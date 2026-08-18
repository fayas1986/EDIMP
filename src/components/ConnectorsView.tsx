import React, { useState, useEffect, useMemo } from 'react';
import { Connector, ConnectorCategory, ThrottlingConfig, DiscoveryLogEntry, ProactiveMitigationAction, ConnectorFailurePrediction } from '../types';
import { ConnectorThrottlingModal } from './ConnectorThrottlingModal';
import { ConnectorBenchmarkPanel } from './ConnectorBenchmarkPanel';
import { DiscoveryLogPanel } from './DiscoveryLogPanel';
import { SmartConnectorRecommender } from './SmartConnectorRecommender';
import { ConnectorDetailsModal } from './ConnectorDetailsModal';
import { ConnectorComparisonModal } from './ConnectorComparisonModal';
import { PredictiveFailureIntelligencePanel } from './PredictiveFailureIntelligencePanel';
import { ConnectorFailurePredictionModal } from './ConnectorFailurePredictionModal';
import { generateAutomatedDataProfile } from '../services/dataProfilingService';
import { analyzeConnectorFailurePrediction } from '../services/connectorFailurePredictionService';
import {
  Database,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Code,
  ShieldCheck,
  Zap,
  Globe,
  Lock,
  Layers,
  Server,
  X,
  FileSpreadsheet,
  Gauge,
  Sliders,
  SlidersHorizontal,
  Clock,
  ShieldAlert,
  Activity,
  Flame,
  LayoutGrid,
  List,
  Radio,
  Wifi,
  WifiOff,
  Table,
  ChevronRight,
  Cpu,
  Terminal,
  Sparkles,
  Building2,
  Users,
  Cloud,
  PieChart,
  BarChart3,
  Percent,
  GitCompare,
} from 'lucide-react';

export const DISCOVERABLE_ENTERPRISE_CONNECTORS: Array<{
  subnet: string;
  connector: Partial<Connector>;
  discoveredEntities: Array<{
    id: string;
    name: string;
    type: string;
    records: number;
    status: 'Synced';
    lastMutation: string;
    odataEndpoint: string;
  }>;
}> = [
  {
    subnet: '10.240.12.45 (Oracle Cloud VPC)',
    connector: {
      id: 'conn-oracle-fusion',
      name: 'Oracle Cloud Fusion ERP',
      category: 'ERP',
      systemType: 'Source',
      provider: 'Oracle Cloud ERP',
      status: 'Connected',
      authType: 'OAuth 2.0',
      latencyMs: 34,
      icon: 'Layers',
      hostUrl: 'https://fusion-erp.oraclecloud.com/fscmRestApi/resources/11.13.18.05',
      lastTested: 'Just now',
      isAutoDiscovered: true,
      isTransferring: true,
      transferRateKbps: 4120,
      activeJobName: 'Financials Ledger Realtime Sync',
      throttlingConfig: {
        isEnabled: true,
        maxRequestsPerSecond: 80,
        maxConcurrentRequests: 12,
        retryStrategy: 'ExponentialBackoff',
        maxRetries: 5,
        autoCooldownOn429: true,
      },
    },
    discoveredEntities: [
      { id: 'dis-e1', name: 'Fusion_Invoices_V2', type: 'REST Entity', records: 84200, status: 'Synced', lastMutation: 'Auto-indexed primary key', odataEndpoint: '/fscmRestApi/resources/11.13.18.05/invoices' },
      { id: 'dis-e2', name: 'Fusion_GL_Journal_Headers', type: 'REST Entity', records: 312000, status: 'Synced', lastMutation: 'Validated UTC timestamps', odataEndpoint: '/fscmRestApi/resources/11.13.18.05/glJournals' },
      { id: 'dis-e3', name: 'Fusion_PurchaseOrders', type: 'REST Entity', records: 45100, status: 'Synced', lastMutation: 'Parsed supplier refs', odataEndpoint: '/fscmRestApi/resources/11.13.18.05/purchaseOrders' },
    ],
  },
  {
    subnet: '10.240.88.102 (Workday Implementation API)',
    connector: {
      id: 'conn-workday-hcm',
      name: 'Workday Enterprise HCM & Payroll API',
      category: 'Custom API',
      systemType: 'Source',
      provider: 'Workday',
      status: 'Connected',
      authType: 'OAuth 2.0',
      latencyMs: 45,
      icon: 'Users',
      hostUrl: 'https://wd2-impl-services1.workday.com/ccx/service/customreport2',
      lastTested: 'Just now',
      isAutoDiscovered: true,
      throttlingConfig: {
        isEnabled: true,
        maxRequestsPerSecond: 40,
        maxConcurrentRequests: 6,
        retryStrategy: 'Linear',
        maxRetries: 3,
        autoCooldownOn429: true,
      },
    },
    discoveredEntities: [
      { id: 'dis-e4', name: 'Worker_Compensation_Master', type: 'Custom Report API', records: 32800, status: 'Synced', lastMutation: 'Masked SSN/PII attributes', odataEndpoint: '/ccx/service/customreport2/workers' },
      { id: 'dis-e5', name: 'Payroll_Journal_Entries', type: 'Custom Report API', records: 128000, status: 'Synced', lastMutation: 'Mapped GL dimension codes', odataEndpoint: '/ccx/service/customreport2/payroll_journals' },
    ],
  },
  {
    subnet: 'xy12345.us-east-1.snowflakecomputing.com (Snowflake VPC)',
    connector: {
      id: 'conn-snowflake-dw',
      name: 'Snowflake Enterprise Data Cloud Warehouse',
      category: 'Database',
      systemType: 'Both',
      provider: 'Snowflake',
      status: 'Connected',
      authType: 'Service Principal',
      latencyMs: 14,
      icon: 'Database',
      hostUrl: 'xy12345.us-east-1.snowflakecomputing.com',
      lastTested: 'Just now',
      isAutoDiscovered: true,
      isTransferring: true,
      transferRateKbps: 8900,
      activeJobName: 'Analytical Mart Extraction',
      throttlingConfig: {
        isEnabled: false,
        maxRequestsPerSecond: 1000,
        maxConcurrentRequests: 100,
        retryStrategy: 'ImmediateRetry',
        maxRetries: 3,
        autoCooldownOn429: false,
      },
    },
    discoveredEntities: [
      { id: 'dis-e6', name: 'ANALYTICS.FACT_SALES_SUMMARY', type: 'Snowflake View', records: 1450000, status: 'Synced', lastMutation: 'Materialized micro-partitions', odataEndpoint: 'snowflake://xy12345.snowflakecomputing.com/ANALYTICS/FACT_SALES_SUMMARY' },
      { id: 'dis-e7', name: 'ANALYTICS.DIM_CUSTOMER_MASTER', type: 'Snowflake Table', records: 124500, status: 'Synced', lastMutation: 'Clustered by CustomerID', odataEndpoint: 'snowflake://xy12345.snowflakecomputing.com/ANALYTICS/DIM_CUSTOMER_MASTER' },
    ],
  },
  {
    subnet: '172.16.40.18 (Oracle NetSuite RESTlet Gateway)',
    connector: {
      id: 'conn-netsuite-erp',
      name: 'NetSuite SuiteTalk ERP Engine',
      category: 'ERP',
      systemType: 'Source',
      provider: 'Oracle NetSuite',
      status: 'Connected',
      authType: 'OAuth 2.0',
      latencyMs: 52,
      icon: 'Building2',
      hostUrl: 'https://1234567.restlets.api.netsuite.com/app/site/hosting/restlet.nl',
      lastTested: 'Just now',
      isAutoDiscovered: true,
      throttlingConfig: {
        isEnabled: true,
        maxRequestsPerSecond: 30,
        maxConcurrentRequests: 5,
        retryStrategy: 'ExponentialBackoff',
        maxRetries: 4,
        autoCooldownOn429: true,
      },
    },
    discoveredEntities: [
      { id: 'dis-e8', name: 'netsuite_customer_records', type: 'RESTlet Endpoint', records: 28400, status: 'Synced', lastMutation: 'Validated credit limits', odataEndpoint: '/restlet.nl?script=custom_cust_v1' },
      { id: 'dis-e9', name: 'netsuite_item_fulfillment', type: 'RESTlet Endpoint', records: 92000, status: 'Synced', lastMutation: 'Parsed tracking numbers', odataEndpoint: '/restlet.nl?script=custom_fulfillment_v1' },
    ],
  },
  {
    subnet: 's3.eu-west-1.amazonaws.com (AWS Gold Data Bucket)',
    connector: {
      id: 'conn-aws-s3-lake',
      name: 'Amazon S3 Enterprise Parquet Data Lake',
      category: 'Cloud Storage',
      systemType: 'Source',
      provider: 'Amazon Web Services (S3)',
      status: 'Connected',
      authType: 'Service Principal',
      latencyMs: 22,
      icon: 'Cloud',
      hostUrl: 's3://prod-enterprise-data-lake-eu-west-1/parquet-gold/',
      lastTested: 'Just now',
      isAutoDiscovered: true,
      throttlingConfig: {
        isEnabled: false,
        maxRequestsPerSecond: 600,
        maxConcurrentRequests: 40,
        retryStrategy: 'ExponentialBackoff',
        maxRetries: 3,
        autoCooldownOn429: false,
      },
    },
    discoveredEntities: [
      { id: 'dis-e10', name: 'gold_customer_aggregates.parquet', type: 'Parquet File', records: 410000, status: 'Synced', lastMutation: 'Snappy compression verified', odataEndpoint: 's3://prod-enterprise-data-lake-eu-west-1/parquet-gold/customers/' },
      { id: 'dis-e11', name: 'gold_financial_ledger.parquet', type: 'Parquet File', records: 1890000, status: 'Synced', lastMutation: 'Partitioned by year/month', odataEndpoint: 's3://prod-enterprise-data-lake-eu-west-1/parquet-gold/ledger/' },
    ],
  },
  {
    subnet: '10.240.200.89 (HubSpot OAuth API Gateway)',
    connector: {
      id: 'conn-hubspot-crm',
      name: 'HubSpot Revenue & CRM Engine',
      category: 'CRM',
      systemType: 'Both',
      provider: 'HubSpot',
      status: 'Connected',
      authType: 'API Key',
      latencyMs: 29,
      icon: 'Globe',
      hostUrl: 'https://api.hubapi.com/crm/v3/objects',
      lastTested: 'Just now',
      isAutoDiscovered: true,
      throttlingConfig: {
        isEnabled: true,
        maxRequestsPerSecond: 50,
        maxConcurrentRequests: 8,
        retryStrategy: 'ExponentialBackoff',
        maxRetries: 3,
        autoCooldownOn429: true,
      },
    },
    discoveredEntities: [
      { id: 'dis-e12', name: 'hubspot_contacts', type: 'v3 CRM Object', records: 64200, status: 'Synced', lastMutation: 'Auto-mapped email property', odataEndpoint: '/crm/v3/objects/contacts' },
      { id: 'dis-e13', name: 'hubspot_deals_pipeline', type: 'v3 CRM Object', records: 18900, status: 'Synced', lastMutation: 'Synced stage amounts', odataEndpoint: '/crm/v3/objects/deals' },
    ],
  },
];

interface ConnectorsViewProps {
  connectors: Connector[];
  onTestConnector: (connectorId: string) => void;
  onAddConnector: (newConn: Partial<Connector>) => void;
  onUpdateConnectorThrottling?: (connectorId: string, config: ThrottlingConfig) => void;
}

export const ConnectorsView: React.FC<ConnectorsViewProps> = ({
  connectors,
  onTestConnector,
  onAddConnector,
  onUpdateConnectorThrottling,
}) => {
  const [activeMainTab, setActiveMainTab] = useState<'registry' | 'throttling' | 'performance' | 'metadata_stream' | 'discovery_log' | 'smart_recommender' | 'predictive_failure'>('registry');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showApiBuilderModal, setShowApiBuilderModal] = useState<boolean>(false);

  // Predictive Failure & Latency Spikes Modal State
  const [selectedPredictionConnector, setSelectedPredictionConnector] = useState<Connector | null>(null);
  const [isPredictionModalOpen, setIsPredictionModalOpen] = useState<boolean>(false);

  // Throttling State
  const [throttlingModalConnector, setThrottlingModalConnector] = useState<Connector | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [showThrottlingMatrix, setShowThrottlingMatrix] = useState<boolean>(false);

  // Real-time WebSocket & Long-Polling Metadata Stream state
  const [isRealtimeStreaming, setIsRealtimeStreaming] = useState<boolean>(true);
  const [streamMode, setStreamMode] = useState<'websocket' | 'polling'>('websocket');
  const [pollingIntervalSec, setPollingIntervalSec] = useState<number>(3);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [secondsAgo, setSecondsAgo] = useState<number>(0);
  const [isManualSyncing, setIsManualSyncing] = useState<boolean>(false);
  const [selectedExplorerConnId, setSelectedExplorerConnId] = useState<string>('conn-sap-s4');

  // Structured Auto-Discovery Log State
  const [discoveryLogs, setDiscoveryLogs] = useState<DiscoveryLogEntry[]>([
    {
      id: 'disc-log-01',
      timestamp: '06:10:02 AM',
      isoTimestamp: new Date(Date.now() - 160000).toISOString(),
      eventType: 'SYSTEM_INITIALIZED',
      status: 'INFO',
      message: 'Auto-Discovery Subnet Scanner Service daemon started on 10.240.0.0/16 VPC ingress gateway.',
      subnet: '10.240.0.0/16',
    },
    {
      id: 'disc-log-02',
      timestamp: '06:10:15 AM',
      isoTimestamp: new Date(Date.now() - 145000).toISOString(),
      connectorId: 'conn-sap-s4',
      connectorName: 'SAP S/4HANA Enterprise ERP',
      category: 'ERP',
      subnet: '10.240.1.12 (SAP Gateway)',
      eventType: 'SUBNET_PROBE',
      status: 'SUCCESS',
      message: 'Probed SAP Gateway OData endpoint. Response 200 OK (18ms). mTLS certificate validated.',
      details: {
        latencyMs: 18,
        authType: 'OAuth 2.0',
        hostUrl: 'https://sap-s4.enterprise.com/sap/opu/odata/sap/',
        securityStandard: 'SOC2 Type II',
      },
    },
    {
      id: 'disc-log-03',
      timestamp: '06:10:30 AM',
      isoTimestamp: new Date(Date.now() - 130000).toISOString(),
      connectorId: 'conn-salesforce-crm',
      connectorName: 'Salesforce Enterprise CRM',
      category: 'CRM',
      subnet: '10.240.4.88 (Salesforce REST VPC)',
      eventType: 'OAUTH_VERIFIED',
      status: 'SUCCESS',
      message: 'OAuth 2.0 Token Exchange verified with Salesforce Identity Provider. JWT signed & cached.',
      details: {
        latencyMs: 22,
        authType: 'OAuth 2.0',
        hostUrl: 'https://na102.salesforce.com/services/data/v58.0/',
        securityStandard: 'ISO27001 / SAML 2.0',
      },
    },
    {
      id: 'disc-log-04',
      timestamp: '06:11:05 AM',
      isoTimestamp: new Date(Date.now() - 95000).toISOString(),
      connectorId: 'conn-oracle-fusion',
      connectorName: 'Oracle Cloud Fusion ERP',
      category: 'ERP',
      subnet: '10.240.12.45 (Oracle Cloud VPC)',
      eventType: 'CONNECTOR_DISCOVERED',
      status: 'SUCCESS',
      message: 'Discovered Oracle Cloud Fusion ERP instance on subnet 10.240.12.45. Auto-populated into Connector Registry.',
      details: {
        latencyMs: 34,
        authType: 'OAuth 2.0',
        hostUrl: 'https://fusion-erp.oraclecloud.com/fscmRestApi/resources/11.13.18.05',
        discoveredEntitiesCount: 3,
        entitiesList: ['Fusion_Invoices_V2', 'Fusion_GL_Journal_Headers', 'Fusion_PurchaseOrders'],
        securityStandard: 'SOC2 Type II / HIPAA',
      },
    },
    {
      id: 'disc-log-05',
      timestamp: '06:11:20 AM',
      isoTimestamp: new Date(Date.now() - 80000).toISOString(),
      connectorId: 'conn-workday-hcm',
      connectorName: 'Workday Enterprise HCM & Payroll API',
      category: 'Custom API',
      subnet: '10.240.88.102 (Workday API Gateway)',
      eventType: 'CONNECTOR_DISCOVERED',
      status: 'SUCCESS',
      message: 'Identified Workday Custom Report 2.0 Endpoint. Auto-discovered Worker Compensation & Payroll feeds.',
      details: {
        latencyMs: 45,
        authType: 'OAuth 2.0',
        hostUrl: 'https://wd2-impl-services1.workday.com/ccx/service/customreport2',
        discoveredEntitiesCount: 2,
        entitiesList: ['Worker_Compensation_Master', 'Payroll_Journal_Entries'],
        securityStandard: 'SOC2 Type II',
      },
    },
    {
      id: 'disc-log-06',
      timestamp: '06:11:45 AM',
      isoTimestamp: new Date(Date.now() - 55000).toISOString(),
      connectorId: 'conn-snowflake-dw',
      connectorName: 'Snowflake Enterprise Data Cloud Warehouse',
      category: 'Database',
      subnet: 'xy12345.snowflakecomputing.com',
      eventType: 'ODATA_INDEXED',
      status: 'SUCCESS',
      message: 'Indexed Snowflake views & tables: ANALYTICS.FACT_SALES_SUMMARY (1.45M records) & ANALYTICS.DIM_CUSTOMER_MASTER.',
      details: {
        latencyMs: 14,
        authType: 'Service Principal',
        hostUrl: 'xy12345.us-east-1.snowflakecomputing.com',
        discoveredEntitiesCount: 2,
        entitiesList: ['ANALYTICS.FACT_SALES_SUMMARY', 'ANALYTICS.DIM_CUSTOMER_MASTER'],
        securityStandard: 'AES-256 Storage / SOC2',
      },
    },
  ]);

  // Real-Time Enterprise Auto-Discovery Scanner State
  const [showScanModal, setShowScanModal] = useState<boolean>(false);
  const [isScanningInRealtime, setIsScanningInRealtime] = useState<boolean>(false);
  const [scanProgressPct, setScanProgressPct] = useState<number>(0);
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [discoveredIdsCurrentRun, setDiscoveredIdsCurrentRun] = useState<string[]>([]);
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);

  // Automated Data Profiling & Connector Details Modal State
  const [selectedDetailsConnector, setSelectedDetailsConnector] = useState<Connector | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);
  
  // Connector Comparison Modal State
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState<boolean>(false);
  const [comparisonConnectorAId, setComparisonConnectorAId] = useState<string | undefined>(undefined);
  const [comparisonConnectorBId, setComparisonConnectorBId] = useState<string | undefined>(undefined);

  const handleOpenComparisonModal = (connAId?: string, connBId?: string) => {
    setComparisonConnectorAId(connAId || connectors[0]?.id);
    setComparisonConnectorBId(connBId || connectors[1]?.id || connectors[0]?.id);
    setIsComparisonModalOpen(true);
  };

  // Pre-calculated proactive failure predictions for all active connectors
  const failurePredictionsMap = useMemo<Record<string, ConnectorFailurePrediction>>(() => {
    const map: Record<string, ConnectorFailurePrediction> = {};
    connectors.forEach((conn) => {
      map[conn.id] = analyzeConnectorFailurePrediction(conn);
    });
    return map;
  }, [connectors]);

  const flaggedFailureCount = useMemo<number>(() => {
    const predictions: ConnectorFailurePrediction[] = Object.values(failurePredictionsMap);
    return predictions.filter(
      (p) => p.riskLevel === 'Critical' || p.riskLevel === 'High'
    ).length;
  }, [failurePredictionsMap]);

  const [profilingToast, setProfilingToast] = useState<{
    show: boolean;
    connector: Connector;
    message: string;
  } | null>(null);

  const handleReProfileConnector = (connectorId: string) => {
    const target = connectors.find((c) => c.id === connectorId);
    if (!target) return;
    const newProfile = generateAutomatedDataProfile(target);
    const updated: Connector = { ...target, dataProfile: newProfile };
    onAddConnector(updated);
    setSelectedDetailsConnector(updated);
  };

  const unaddedDiscoverableCount = DISCOVERABLE_ENTERPRISE_CONNECTORS.filter(
    (dc) => !connectors.some((c) => c.id === dc.connector.id)
  ).length;

  const handleRunAutoDiscovery = () => {
    setShowScanModal(true);
    setIsScanningInRealtime(true);
    setScanProgressPct(5);
    const nowTime = new Date().toLocaleTimeString();
    const nowIso = new Date().toISOString();

    setScanLogs([
      `[${nowTime}] Initializing Subnet & Enterprise Infrastructure Discovery Scanner...`,
      `[${nowTime}] Scanning Active Directory, Cloud IAM (AWS, Azure, GCP) & Network VPCs (10.240.0.0/16, 172.16.0.0/12)...`,
    ]);
    setDiscoveredIdsCurrentRun([]);

    // Add Scanner start log to Discovery Log Panel
    setDiscoveryLogs((prev) => [
      {
        id: `disc-log-${Date.now()}-init`,
        timestamp: nowTime,
        isoTimestamp: nowIso,
        eventType: 'SUBNET_PROBE',
        status: 'INFO',
        message: 'Initiated active subnet scan across enterprise subnets (10.240.0.0/16, 172.16.0.0/12). Probing OAuth gateways & endpoints.',
        subnet: '10.240.0.0/16',
      },
      ...prev,
    ]);

    const unadded = DISCOVERABLE_ENTERPRISE_CONNECTORS.filter(
      (dc) => !connectors.some((c) => c.id === dc.connector.id)
    );

    const itemsToProcess = unadded.length > 0 ? unadded : DISCOVERABLE_ENTERPRISE_CONNECTORS;

    setTimeout(() => {
      setScanProgressPct(20);
      setScanLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Polling Active Service Gateways & OAuth Endpoints...`,
        `[${new Date().toLocaleTimeString()}] Discovered ${itemsToProcess.length} enterprise infrastructure connectors!`,
      ]);
    }, 500);

    let index = 0;
    const interval = setInterval(() => {
      if (index >= itemsToProcess.length) {
        clearInterval(interval);
        setScanProgressPct(100);
        setIsScanningInRealtime(false);
        setLastScanTime(new Date());
        const completionTime = new Date().toLocaleTimeString();
        setScanLogs((prev) => [
          ...prev,
          `[${completionTime}] REAL-TIME AUTO-DISCOVERY COMPLETE: ${itemsToProcess.length} Enterprise Connectors Populated into Active Registry with OAuth Tokens & OData Entities.`,
        ]);

        setDiscoveryLogs((prev) => [
          {
            id: `disc-log-${Date.now()}-complete`,
            timestamp: completionTime,
            isoTimestamp: new Date().toISOString(),
            eventType: 'SYSTEM_INITIALIZED',
            status: 'SUCCESS',
            message: `Auto-Discovery Sweep Finished: Successfully indexed ${itemsToProcess.length} enterprise connectors with verified OAuth tokens & schema entities.`,
            subnet: '10.240.0.0/16',
          },
          ...prev,
        ]);
        return;
      }

      const item = itemsToProcess[index];
      const conn = item.connector;
      const itemTime = new Date().toLocaleTimeString();
      const itemIso = new Date().toISOString();

      // Add connector to main state
      onAddConnector({
        ...conn,
        discoveryTimestamp: itemTime,
      });

      // Register live entity metadata for metadata stream tab
      setLiveEntitiesMap((prev) => ({
        ...prev,
        [conn.id!]: item.discoveredEntities,
      }));

      setDiscoveredIdsCurrentRun((prev) => [...prev, conn.id!]);
      const currentPct = Math.round(20 + ((index + 1) / itemsToProcess.length) * 80);
      setScanProgressPct(currentPct);

      setScanLogs((prev) => [
        ...prev,
        `[${itemTime}] [DISCOVERED ${index + 1}/${itemsToProcess.length}] ${conn.name} (${conn.authType}, ${conn.latencyMs}ms) @ ${item.subnet}`,
      ]);

      // Push structured real-time Discovery Log entry
      setDiscoveryLogs((prev) => [
        {
          id: `disc-log-${Date.now()}-${index}`,
          timestamp: itemTime,
          isoTimestamp: itemIso,
          connectorId: conn.id,
          connectorName: conn.name,
          category: conn.category,
          subnet: item.subnet,
          eventType: 'CONNECTOR_DISCOVERED',
          status: 'SUCCESS',
          message: `Discovered & Auto-Populated ${conn.name} (${conn.provider || conn.category}) on subnet ${item.subnet}. Latency: ${conn.latencyMs}ms.`,
          details: {
            latencyMs: conn.latencyMs,
            authType: conn.authType,
            hostUrl: conn.hostUrl,
            discoveredEntitiesCount: item.discoveredEntities.length,
            entitiesList: item.discoveredEntities.map((e) => e.name),
            securityStandard: 'SOC2 Type II / OAuth 2.0',
          },
        },
        ...prev,
      ]);

      index++;
    }, 600);
  };

  // Live auto-discovered entity metadata state per connector
  const [liveEntitiesMap, setLiveEntitiesMap] = useState<Record<string, Array<{ id: string; name: string; type: string; records: number; status: 'Synced' | 'Updating' | 'Pending'; lastMutation: string; odataEndpoint: string }>>>({
    'conn-sap-s4': [
      { id: 'e1', name: 'ANLA_AssetMaster', type: 'OData v4 Entity', records: 18420, status: 'Synced', lastMutation: 'Added AssetClass_CD', odataEndpoint: '/sap/opu/odata/sap/API_FIXEDASSET_SRV' },
      { id: 'e2', name: 'MARA_Material_Master', type: 'OData v4 Entity', records: 45200, status: 'Synced', lastMutation: 'Updated NetWeight_KG', odataEndpoint: '/sap/opu/odata/sap/API_MATERIAL_DOCUMENT_SRV' },
      { id: 'e3', name: 'BSEG_AccountingDocument', type: 'OData v4 Entity', records: 120400, status: 'Synced', lastMutation: 'No change', odataEndpoint: '/sap/opu/odata/sap/API_FINANCIAL_DOC_SRV' },
      { id: 'e4', name: 'KNA1_CustomerMaster', type: 'OData v4 Entity', records: 14250, status: 'Synced', lastMutation: 'Updated TaxID_VAT', odataEndpoint: '/sap/opu/odata/sap/API_BUSINESS_PARTNER' },
      { id: 'e5', name: 'GL_Transactions', type: 'OData v4 Entity', records: 310500, status: 'Synced', lastMutation: 'Added PostingDate', odataEndpoint: '/sap/opu/odata/sap/API_GL_JOURNAL_SRV' },
    ],
    'conn-bc-prod': [
      { id: 'e6', name: 'FA_FixedAsset', type: 'REST API v2.0', records: 12500, status: 'Synced', lastMutation: 'Updated DepreciationGroup', odataEndpoint: '/v2.0/companies/fixedAssets' },
      { id: 'e7', name: 'Customer', type: 'REST API v2.0', records: 8420, status: 'Synced', lastMutation: 'Added CreditLimit_USD', odataEndpoint: '/v2.0/companies/customers' },
      { id: 'e8', name: 'Vendor', type: 'REST API v2.0', records: 6150, status: 'Synced', lastMutation: 'Updated PaymentTermsCode', odataEndpoint: '/v2.0/companies/vendors' },
      { id: 'e9', name: 'SalesHeader', type: 'REST API v2.0', records: 19800, status: 'Synced', lastMutation: 'No change', odataEndpoint: '/v2.0/companies/salesInvoices' },
      { id: 'e10', name: 'GL_Entry', type: 'REST API v2.0', records: 280000, status: 'Synced', lastMutation: 'Updated DimensionSetID', odataEndpoint: '/v2.0/companies/generalLedgerEntries' },
    ],
    'conn-sfdc-main': [
      { id: 'e11', name: 'Account', type: 'sObject Record', records: 22100, status: 'Synced', lastMutation: 'Added AnnualRevenue', odataEndpoint: '/services/data/v58.0/sobjects/Account' },
      { id: 'e12', name: 'Contact', type: 'sObject Record', records: 48900, status: 'Synced', lastMutation: 'Updated EmailOptOut', odataEndpoint: '/services/data/v58.0/sobjects/Contact' },
      { id: 'e13', name: 'Opportunity', type: 'sObject Record', records: 15400, status: 'Synced', lastMutation: 'Updated StageName', odataEndpoint: '/services/data/v58.0/sobjects/Opportunity' },
      { id: 'e14', name: 'Lead', type: 'sObject Record', records: 38200, status: 'Synced', lastMutation: 'No change', odataEndpoint: '/services/data/v58.0/sobjects/Lead' },
    ],
    'conn-sql-legacy': [
      { id: 'e15', name: 'dbo.tbl_CustomerMaster', type: 'SQL Table', records: 14250, status: 'Synced', lastMutation: 'Indexed CustomerID', odataEndpoint: 'sql://mssql-db01.internal/LegacyERP/dbo/tbl_CustomerMaster' },
      { id: 'e16', name: 'dbo.tbl_GL_Ledger_Archive', type: 'SQL Table', records: 520000, status: 'Synced', lastMutation: 'No change', odataEndpoint: 'sql://mssql-db01.internal/LegacyERP/dbo/tbl_GL_Ledger_Archive' },
      { id: 'e17', name: 'dbo.tbl_SalesOrder_Header', type: 'SQL Table', records: 34100, status: 'Synced', lastMutation: 'Added OrderStatus', odataEndpoint: 'sql://mssql-db01.internal/LegacyERP/dbo/tbl_SalesOrder_Header' },
    ],
    'conn-excel-files': [
      { id: 'e18', name: 'Sheet1_Customer_Master', type: 'Worksheet', records: 14250, status: 'Synced', lastMutation: 'Parsed 24 columns', odataEndpoint: 'file:///mnt/exports/Customer_Master_July2026.xlsx#Sheet1' },
      { id: 'e19', name: 'Sheet2_Addresses', type: 'Worksheet', records: 14250, status: 'Synced', lastMutation: 'Parsed 12 columns', odataEndpoint: 'file:///mnt/exports/Customer_Master_July2026.xlsx#Sheet2' },
    ],
    'conn-d365-fo': [
      { id: 'e20', name: 'CustCustomerV3Entity', type: 'OData Entity', records: 16500, status: 'Synced', lastMutation: 'Added PartyNumber', odataEndpoint: '/data/CustCustomerV3Entities' },
      { id: 'e21', name: 'VendVendorV2Entity', type: 'OData Entity', records: 8900, status: 'Synced', lastMutation: 'No change', odataEndpoint: '/data/VendVendorV2Entities' },
      { id: 'e22', name: 'AssetFixedAssetEntity', type: 'OData Entity', records: 14100, status: 'Synced', lastMutation: 'Updated AssetGroup', odataEndpoint: '/data/AssetFixedAssetEntities' },
    ],
    'conn-postgres-warehouse': [
      { id: 'e23', name: 'public.stg_customers_raw', type: 'PG Table', records: 14250, status: 'Synced', lastMutation: 'Vacuumed & Analyzed', odataEndpoint: 'postgresql://pg-wh.internal:5432/staging/public/stg_customers_raw' },
      { id: 'e24', name: 'public.stg_financial_journal', type: 'PG Table', records: 180000, status: 'Synced', lastMutation: 'Partitioned by month', odataEndpoint: 'postgresql://pg-wh.internal:5432/staging/public/stg_financial_journal' },
    ],
    'conn-sharepoint-docs': [
      { id: 'e25', name: 'Customers_EMEA_v3.xlsx', type: 'SharePoint File', records: 9400, status: 'Synced', lastMutation: 'Auto-scanned Graph API', odataEndpoint: 'ms-graph://acmecorp.sharepoint.com/drive/items/item-001' },
      { id: 'e26', name: 'Prospects_July.csv', type: 'SharePoint File', records: 3100, status: 'Synced', lastMutation: 'Auto-scanned Graph API', odataEndpoint: 'ms-graph://acmecorp.sharepoint.com/drive/items/item-002' },
    ],
    'conn-custom-rest': [
      { id: 'e27', name: 'employees_v1', type: 'REST Endpoint', records: 3400, status: 'Synced', lastMutation: 'Parsed JSON Schema', odataEndpoint: 'https://api.custom.com/v1/employees' },
      { id: 'e28', name: 'payroll_runs', type: 'REST Endpoint', records: 850, status: 'Synced', lastMutation: 'Parsed JSON Schema', odataEndpoint: 'https://api.custom.com/v1/payroll_runs' },
    ],
  });

  // Long-polling / WebSocket metadata stream simulator effect
  useEffect(() => {
    if (!isRealtimeStreaming) return;

    const interval = setInterval(() => {
      setLastSyncTime(new Date());
      setSecondsAgo(0);

      // Simulate subtle row count increments & field metadata discovery in real-time
      setLiveEntitiesMap((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((connId) => {
          next[connId] = next[connId].map((ent) => {
            const rowDelta = Math.floor(Math.random() * 3);
            return {
              ...ent,
              records: ent.records + rowDelta,
              status: 'Synced' as const,
            };
          });
        });
        return next;
      });
    }, pollingIntervalSec * 1000);

    return () => clearInterval(interval);
  }, [isRealtimeStreaming, pollingIntervalSec]);

  // Second ticker for "X seconds ago" badge
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsAgo((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleForceManualSync = () => {
    setIsManualSyncing(true);
    setTimeout(() => {
      setIsManualSyncing(false);
      setLastSyncTime(new Date());
      setSecondsAgo(0);
      setLiveEntitiesMap((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((connId) => {
          next[connId] = next[connId].map((ent) => ({
            ...ent,
            records: ent.records + Math.floor(Math.random() * 8) + 1,
            status: 'Synced' as const,
          }));
        });
        return next;
      });
    }, 500);
  };

  // Local state for active data transfer overrides (interactive toggle)
  const [transferStateMap, setTransferStateMap] = useState<Record<string, boolean>>({});

  const isConnectorTransferring = (conn: Connector) => {
    if (transferStateMap[conn.id] !== undefined) {
      return transferStateMap[conn.id];
    }
    return !!conn.isTransferring;
  };

  const toggleTransferState = (connectorId: string, currentVal: boolean) => {
    setTransferStateMap((prev) => ({
      ...prev,
      [connectorId]: !currentVal,
    }));
  };

  // Status Indicator renderer with subtle pulse animation for active data transfer
  const renderStatusIndicator = (conn: Connector) => {
    const isTransferring = isConnectorTransferring(conn);
    const isConnected = conn.status === 'Connected';
    const isError = conn.status === 'Error';

    if (isConnected && isTransferring) {
      return (
        <div className="flex items-center gap-1.5 min-w-0">
          {/* Subtle pulse animation indicator when actively transferring data */}
          <button
            type="button"
            onClick={() => toggleTransferState(conn.id, true)}
            className="relative flex h-2.5 w-2.5 items-center justify-center cursor-pointer shrink-0"
            title="Actively transferring data (Click to pause transfer simulation)"
            aria-label={`Connector ${conn.name} actively transferring data`}
          >
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-xs ring-2 ring-emerald-200" />
          </button>
          <div className="flex items-center gap-1 min-w-0">
            <span className="text-[11px] font-bold text-emerald-700 font-mono shrink-0">
              Connected ({conn.latencyMs}ms)
            </span>
            <button
              type="button"
              onClick={() => toggleTransferState(conn.id, true)}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs transition-colors cursor-pointer shrink-0"
              title={conn.activeJobName ? `Active Stream: ${conn.activeJobName}` : 'Transferring live data stream'}
            >
              <Activity className="w-3 h-3 text-emerald-600 animate-spin shrink-0" style={{ animationDuration: '3s' }} />
              <span className="truncate max-w-[70px]">
                {conn.transferRateKbps ? `${(conn.transferRateKbps / 1024).toFixed(1)} MB/s` : 'Active'}
              </span>
            </button>
          </div>
        </div>
      );
    }

    if (isConnected) {
      return (
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            type="button"
            onClick={() => toggleTransferState(conn.id, false)}
            className="relative flex h-2.5 w-2.5 items-center justify-center cursor-pointer shrink-0"
            title="Idle connection ready (Click to simulate active data transfer)"
            aria-label={`Connector ${conn.name} connected idle`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-xs" />
          </button>
          <div className="flex items-center gap-1 min-w-0">
            <span className="text-[11px] font-semibold text-slate-700 font-mono shrink-0">
              Connected ({conn.latencyMs}ms)
            </span>
            <button
              type="button"
              onClick={() => toggleTransferState(conn.id, false)}
              className="px-1.5 py-0.5 bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 rounded text-[10px] font-mono border border-slate-200 transition-colors cursor-pointer shrink-0"
              title="Click to simulate active data transfer"
            >
              Idle
            </button>
          </div>
        </div>
      );
    }

    if (isError) {
      return (
        <div className="flex items-center gap-1.5 text-[11px] text-rose-600 font-semibold font-mono shrink-0">
          <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
          <span>Error ({conn.latencyMs || 0}ms)</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-semibold font-mono shrink-0">
        <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
        <span>{conn.status}</span>
      </div>
    );
  };

  // Form states for New Connector
  const [newConnName, setNewConnName] = useState('');
  const [newConnCategory, setNewConnCategory] = useState<ConnectorCategory>('ERP');
  const [newConnProvider, setNewConnProvider] = useState('Business Central');
  const [newConnAuthType, setNewConnAuthType] = useState<'OAuth 2.0' | 'API Key' | 'SQL Auth' | 'Service Principal'>('OAuth 2.0');
  const [newConnHostUrl, setNewConnHostUrl] = useState('');

  // Form states for API Builder
  const [swaggerJson, setSwaggerJson] = useState('');
  const [apiName, setApiName] = useState('');
  const [apiBaseUrl, setApiBaseUrl] = useState('');

  const categories = ['All', 'ERP', 'CRM', 'Database', 'Files', 'Cloud Storage', 'Custom API'];

  const filteredConnectors = connectors.filter((c) => {
    const matchesCat = selectedCategory === 'All' || c.category === selectedCategory;
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.provider.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Calculate Rate Limiting aggregate stats
  const totalApiConnectors = connectors.filter((c) => c.category !== 'Files').length;
  const protectedConnectorsCount = connectors.filter(
    (c) => c.throttlingConfig && c.throttlingConfig.isEnabled
  ).length;
  const combinedRpsCapacity = connectors.reduce((acc, c) => {
    if (c.throttlingConfig && c.throttlingConfig.isEnabled) {
      return acc + c.throttlingConfig.maxRequestsPerSecond;
    }
    return acc + 500; // default uncapped estimate
  }, 0);

  const handleRunTest = (conn: Connector) => {
    setTestingId(conn.id);
    setTestResult(null);

    setTimeout(() => {
      onTestConnector(conn.id);
      setTestResult({
        success: true,
        latency: Math.floor(Math.random() * 30) + 15,
        status: '200 OK',
        authStatus: 'OAuth 2.0 Token Refreshed Successfully',
        message: `Successfully reached endpoint ${conn.hostUrl || 'host'} with valid credentials. Rate Limiting Active: ${
          conn.throttlingConfig?.maxRequestsPerSecond || 50
        } req/s.`,
      });
      setTestingId(null);
    }, 1200);
  };

  const handleSaveThrottlingConfig = (connectorId: string, config: ThrottlingConfig) => {
    if (onUpdateConnectorThrottling) {
      onUpdateConnectorThrottling(connectorId, config);
    }
    setThrottlingModalConnector(null);
  };

  const handleCreateConnectorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConnName.trim()) return;

    const baseConn: Partial<Connector> = {
      name: newConnName,
      category: newConnCategory,
      systemType: 'Both',
      provider: newConnProvider,
      status: 'Connected',
      authType: newConnAuthType,
      latencyMs: 24,
      icon: 'Database',
      hostUrl: newConnHostUrl || 'https://api.enterprise.com/v1',
      lastTested: 'Just now',
    };

    // Run automated data profiling immediately upon connector creation
    const autoProfile = generateAutomatedDataProfile(baseConn);
    const createdConnector: Connector = {
      id: `conn-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: newConnName,
      category: newConnCategory,
      systemType: 'Both',
      provider: newConnProvider,
      status: 'Connected',
      authType: newConnAuthType,
      latencyMs: 24,
      icon: 'Database',
      hostUrl: newConnHostUrl || 'https://api.enterprise.com/v1',
      lastTested: 'Just now',
      dataProfile: autoProfile,
    };

    onAddConnector(createdConnector);
    setShowAddModal(false);
    setNewConnName('');
    setNewConnHostUrl('');

    // Trigger toast notification and allow one-click inspection of profiling stats
    setProfilingToast({
      show: true,
      connector: createdConnector,
      message: `Automated profiling complete: ${autoProfile.totalRowCount.toLocaleString()} rows, ${autoProfile.overallNullPercentage}% null rate, ${autoProfile.dataTypeDistribution.length} data types discovered.`,
    });
  };

  const handleImportOpenApi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiName.trim()) return;

    const baseConn: Partial<Connector> = {
      name: apiName,
      category: 'Custom API',
      systemType: 'Both',
      provider: 'REST / OpenAPI 3.0',
      status: 'Connected',
      authType: 'API Key',
      latencyMs: 38,
      icon: 'Code',
      hostUrl: apiBaseUrl || 'https://api.custom.com/v1',
      lastTested: 'Just now',
    };

    const autoProfile = generateAutomatedDataProfile(baseConn);
    const createdConnector: Connector = {
      id: `conn-api-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: apiName,
      category: 'Custom API',
      systemType: 'Both',
      provider: 'REST / OpenAPI 3.0',
      status: 'Connected',
      authType: 'API Key',
      latencyMs: 38,
      icon: 'Code',
      hostUrl: apiBaseUrl || 'https://api.custom.com/v1',
      lastTested: 'Just now',
      dataProfile: autoProfile,
    };

    onAddConnector(createdConnector);
    setShowApiBuilderModal(false);
    setApiName('');
    setApiBaseUrl('');
    setSwaggerJson('');

    setProfilingToast({
      show: true,
      connector: createdConnector,
      message: `OpenAPI Endpoint Profiled: ${autoProfile.totalRowCount.toLocaleString()} rows, ${autoProfile.overallNullPercentage}% null rate across schema entities.`,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Automated Profiling Toast Notification Banner */}
      {profilingToast && profilingToast.show && (
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white p-4 rounded-2xl border border-indigo-700/60 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-400/30 shrink-0">
              <Sparkles className="w-5 h-5 text-indigo-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">Automated Data Profiling Run Complete</span>
                <span className="px-2 py-0.5 bg-indigo-400/20 text-indigo-200 text-[10px] font-mono font-bold rounded border border-indigo-400/30">
                  {profilingToast.connector.name}
                </span>
              </div>
              <p className="text-xs text-indigo-100/90 mt-0.5 font-medium">
                {profilingToast.message}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setSelectedDetailsConnector(profilingToast.connector);
                setIsDetailsModalOpen(true);
                setProfilingToast(null);
              }}
              className="px-3.5 py-1.5 bg-white text-indigo-900 hover:bg-indigo-50 font-bold text-xs rounded-lg transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <PieChart className="w-3.5 h-3.5 text-indigo-700" />
              <span>Inspect Profile Details</span>
            </button>
            <button
              onClick={() => setProfilingToast(null)}
              className="p-1.5 text-indigo-200 hover:text-white hover:bg-indigo-700/50 rounded-lg transition-colors cursor-pointer"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header & Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600" />
            Universal Connector Framework & Integration Registry
          </h1>
          <p className="text-xs text-slate-600 mt-0.5 font-medium">
            Manage pre-built enterprise connectors, secret vault auth credentials, rate limit throttling policies, and performance benchmarking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="conn-compare-btn"
            onClick={() => handleOpenComparisonModal()}
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 shadow-2xs transition-all cursor-pointer"
            title="Compare profiling statistics & 30-day trends between two connectors"
          >
            <GitCompare className="w-4 h-4 text-indigo-600" />
            <span>Compare Connectors</span>
          </button>

          <button
            id="conn-open-api-builder-btn"
            onClick={() => setShowApiBuilderModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl border border-slate-300 transition-all cursor-pointer"
          >
            <Code className="w-4 h-4 text-indigo-600" />
            <span>OpenAPI / API Builder</span>
          </button>

          <button
            id="conn-add-new-btn"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Register Connector</span>
          </button>
        </div>
      </div>

      {/* Main Feature View Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => {
            setActiveMainTab('registry');
            setShowThrottlingMatrix(false);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeMainTab === 'registry' && !showThrottlingMatrix
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Connector Registry & Vault</span>
        </button>

        <button
          onClick={() => {
            setActiveMainTab('throttling');
            setShowThrottlingMatrix(true);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeMainTab === 'throttling' || showThrottlingMatrix
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Throttling Control Matrix</span>
        </button>

        <button
          onClick={() => {
            setActiveMainTab('performance');
            setShowThrottlingMatrix(false);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeMainTab === 'performance'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span>Performance Testing & Benchmarking</span>
        </button>

        <button
          onClick={() => {
            setActiveMainTab('metadata_stream');
            setShowThrottlingMatrix(false);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeMainTab === 'metadata_stream'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>Live OData & Entity Metadata Stream</span>
        </button>

        <button
          id="conn-discovery-log-tab-btn"
          onClick={() => {
            setActiveMainTab('discovery_log');
            setShowThrottlingMatrix(false);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeMainTab === 'discovery_log'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Terminal className="w-4 h-4 text-purple-400" />
          <span>Discovery Log & Subnet Audits</span>
        </button>

        <button
          id="conn-smart-recommender-tab-btn"
          onClick={() => {
            setActiveMainTab('smart_recommender');
            setShowThrottlingMatrix(false);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeMainTab === 'smart_recommender'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
          <span>Co-Pilot AI Recommender</span>
        </button>

        <button
          id="conn-predictive-failure-tab-btn"
          onClick={() => {
            setActiveMainTab('predictive_failure');
            setShowThrottlingMatrix(false);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeMainTab === 'predictive_failure'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ShieldAlert className={`w-4 h-4 ${flaggedFailureCount > 0 ? 'text-rose-500 animate-bounce' : 'text-slate-400'}`} />
          <span>Proactive Failure & Latency Spikes</span>
        </button>
      </div>

      {/* Real-Time WebSocket & Long-Polling Control Bar */}
      <div className="bg-white text-slate-900 p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3.5 w-3.5 items-center justify-center shrink-0">
            {isRealtimeStreaming ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-xs ring-2 ring-emerald-200" />
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500 ring-2 ring-amber-200" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-xs tracking-wide uppercase font-mono flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-600" />
                Real-Time Metadata Stream Engine
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                isRealtimeStreaming
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {isRealtimeStreaming ? (streamMode === 'websocket' ? 'WebSocket Streaming (wss://)' : `Long-Polling (${pollingIntervalSec}s)`) : 'Stream Paused'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
              Source and Destination entity metadata (tables, views, rows, and schema fields) is updated continuously without page refreshes.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => {
                setStreamMode('websocket');
                setIsRealtimeStreaming(true);
              }}
              className={`px-2.5 py-1 rounded-lg font-mono font-bold text-[10px] transition-all cursor-pointer ${
                streamMode === 'websocket' && isRealtimeStreaming
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              WebSocket Push
            </button>
            <button
              type="button"
              onClick={() => {
                setStreamMode('polling');
                setIsRealtimeStreaming(true);
              }}
              className={`px-2.5 py-1 rounded-lg font-mono font-bold text-[10px] transition-all cursor-pointer ${
                streamMode === 'polling' && isRealtimeStreaming
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Long-Poll (3s)
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsRealtimeStreaming(!isRealtimeStreaming)}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all border cursor-pointer shadow-xs ${
              isRealtimeStreaming
                ? 'bg-white hover:bg-slate-50 text-amber-600 border-amber-200'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
            }`}
          >
            {isRealtimeStreaming ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
            <span>{isRealtimeStreaming ? 'Pause Stream' : 'Resume Stream'}</span>
          </button>

          <button
            type="button"
            onClick={handleForceManualSync}
            disabled={isManualSyncing}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all border border-indigo-500 cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isManualSyncing ? 'animate-spin' : ''}`} />
            <span>Sync OData Now</span>
          </button>

          <div className="text-[10px] font-mono text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            Last Synced: <span className="text-emerald-600 font-bold">{secondsAgo === 0 ? 'Just now' : `${secondsAgo}s ago`}</span>
          </div>
        </div>
      </div>

      {/* Real-time Enterprise Infrastructure Auto-Discovery Engine Banner */}
      <div className="bg-white text-slate-900 p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="flex items-start gap-3.5 relative z-10">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 shrink-0">
            <Cpu className="w-6 h-6 animate-pulse text-indigo-600" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-slate-900 tracking-wide flex items-center gap-2">
                Real-Time Enterprise Infrastructure Auto-Discovery Engine
              </h2>
              <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-mono font-bold rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-600" />
                {connectors.filter((c) => c.isAutoDiscovered).length > 0
                  ? `${connectors.filter((c) => c.isAutoDiscovered).length} / 6 Discovered & Populated`
                  : `${unaddedDiscoverableCount} Unlinked Endpoints Detected`}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl font-medium leading-relaxed">
              Automated network scanner continuously probes local enterprise VPC subnets, Active Directory catalogs, and cloud API gateways (Oracle Fusion, Workday, Snowflake, NetSuite, AWS S3, HubSpot) to discover and auto-populate missing system connectors in real-time.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 relative z-10 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveMainTab('discovery_log')}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer border border-slate-300 shadow-2xs"
          >
            <Terminal className="w-4 h-4 text-indigo-600" />
            <span>View Discovery Log ({discoveryLogs.length})</span>
          </button>

          <button
            type="button"
            id="banner-scan-now-btn"
            onClick={handleRunAutoDiscovery}
            disabled={isScanningInRealtime}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-xs cursor-pointer border border-indigo-500 disabled:opacity-50"
          >
            <Cpu className={`w-4 h-4 ${isScanningInRealtime ? 'animate-spin' : ''}`} />
            <span>{isScanningInRealtime ? 'Scanning Infrastructure...' : 'Scan & Populate 6 Connectors'}</span>
          </button>
        </div>
      </div>

      {/* Throttling & Target Overload Protection Banner */}
      <div className="bg-white text-slate-900 p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
            <Gauge className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 tracking-wide">Target System Overload Protection & Rate Limiting</h2>
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-mono font-bold rounded-full">
                {protectedConnectorsCount} / {totalApiConnectors} Protect Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl font-medium">
              Configured rate limiters prevent API rate limits, HTTP 429 Too Many Requests errors, and database connection pool locks on target SAP, Dynamics 365, and Salesforce systems.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs font-mono shrink-0">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-bold">Combined Throughput Cap</span>
            <span className="text-indigo-600 font-black text-sm">{combinedRpsCapacity} req/s</span>
          </div>
          <div className="w-px h-8 bg-slate-200" />
          <div>
            <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-bold">429 Error Shield</span>
            <span className="text-emerald-600 font-black text-sm">Active (0 Faults)</span>
          </div>
        </div>
      </div>

      {/* Conditional Main View Body */}
      {activeMainTab === 'discovery_log' ? (
        <DiscoveryLogPanel
          logs={discoveryLogs}
          isScanning={isScanningInRealtime}
          onRunScan={handleRunAutoDiscovery}
          onClearLogs={() => setDiscoveryLogs([])}
          connectors={connectors}
        />
      ) : activeMainTab === 'performance' ? (
        <ConnectorBenchmarkPanel connectors={connectors} />
      ) : activeMainTab === 'metadata_stream' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Connector Selection List */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-extrabold text-slate-800 text-xs font-mono uppercase tracking-wider flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-600" />
                  Live Target Endpoints
                </span>
                <span className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {connectors.length} Connected
                </span>
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {connectors.map((c) => {
                  const isSelected = selectedExplorerConnId === c.id;
                  const entList = liveEntitiesMap[c.id] || [];
                  const totalRows = entList.reduce((acc, e) => acc + e.records, 0);

                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedExplorerConnId(c.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-200 shadow-2xs'
                          : 'bg-slate-50/60 hover:bg-slate-100 border-slate-200/80'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 truncate">{c.name}</span>
                          <span className="text-[9px] font-mono bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-bold">
                            {c.category}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 mt-1 flex items-center gap-2">
                          <span>{entList.length} OData Entities</span>
                          <span>•</span>
                          <span className="text-indigo-700 font-bold">{totalRows.toLocaleString()} total rows</span>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? 'text-indigo-600 translate-x-0.5' : 'text-slate-400'}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live Discovered Entities Explorer */}
            <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              {(() => {
                const activeConnObj = connectors.find((c) => c.id === selectedExplorerConnId);
                const entList = liveEntitiesMap[selectedExplorerConnId] || [];

                return (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                          <Server className="w-4 h-4 text-indigo-600" />
                          <span>{activeConnObj?.name || 'Live System Endpoint'}</span>
                          <span className="text-xs font-mono font-normal text-slate-500">
                            ({activeConnObj?.provider})
                          </span>
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5 font-mono">
                          Auto-discovered OData v4 & REST schema entities polled live via WebSocket.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleForceManualSync}
                          disabled={isManualSyncing}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 flex items-center gap-1.5 cursor-pointer"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isManualSyncing ? 'animate-spin' : ''}`} />
                          <span>Re-query Schema</span>
                        </button>
                      </div>
                    </div>

                    {/* Entities Table */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                      <table className="w-full text-left font-mono text-xs">
                        <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                          <tr>
                            <th className="p-3">Entity Name</th>
                            <th className="p-3">Type</th>
                            <th className="p-3">Live Record Count</th>
                            <th className="p-3">OData Endpoint</th>
                            <th className="p-3 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/80 bg-white">
                          {entList.map((ent) => (
                            <tr key={ent.id} className="hover:bg-indigo-50/30 transition-colors">
                              <td className="p-3 font-bold text-slate-900 flex items-center gap-1.5">
                                <Table className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                <span>{ent.name}</span>
                              </td>
                              <td className="p-3 text-slate-600 text-[11px]">
                                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200 font-bold">
                                  {ent.type}
                                </span>
                              </td>
                              <td className="p-3 font-bold text-emerald-700">
                                {ent.records.toLocaleString()}
                              </td>
                              <td className="p-3 text-slate-500 text-[11px] truncate max-w-[200px]" title={ent.odataEndpoint}>
                                {ent.odataEndpoint}
                              </td>
                              <td className="p-3 text-right">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  Live Synced
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* WebSocket Live Feed Log Snippet */}
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-slate-300 font-mono text-[11px] space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-800 pb-1">
                        <span className="flex items-center gap-1.5 font-bold text-emerald-400">
                          <Radio className="w-3 h-3 animate-ping text-emerald-400" />
                          WebSocket Live Stream Frame Buffer
                        </span>
                        <span>wss://api.edimp.internal/v2/schema-stream</span>
                      </div>
                      <div className="text-emerald-400 truncate">
                        [WS-EVENT {new Date().toLocaleTimeString()}] RECEIVED entity.schema_delta for {activeConnObj?.name}: {entList[0]?.name || 'Entity'} ({entList[0]?.records.toLocaleString()} rows)
                      </div>
                      <div className="text-slate-400 truncate">
                        [WS-ACK] Schema hash checksum verified OK • 0 schema drift detected
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      ) : activeMainTab === 'smart_recommender' ? (
        <SmartConnectorRecommender
          connectors={connectors}
          onAddConnector={onAddConnector}
          onUpdateConnectorThrottling={onUpdateConnectorThrottling}
          isScanningInRealtime={isScanningInRealtime}
          onRunScan={handleRunAutoDiscovery}
        />
      ) : activeMainTab === 'predictive_failure' ? (
        <PredictiveFailureIntelligencePanel
          connectors={connectors}
          onOpenThrottlingConfig={(conn) => setThrottlingModalConnector(conn)}
        />
      ) : (
        <>
          {/* Proactive Failure Risk Warning Banner (if any connector has high/critical risk) */}
          {flaggedFailureCount > 0 && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-900 shadow-2xs">
              <div className="flex items-start sm:items-center gap-3">
                <div className="p-2 bg-rose-100 text-rose-700 rounded-xl border border-rose-300 shrink-0">
                  <Flame className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2 font-bold text-sm text-rose-950">
                    <span>Proactive Anomaly Alert: {flaggedFailureCount} Connector{flaggedFailureCount > 1 ? 's' : ''} Approaching Outage Threshold</span>
                    <span className="px-2 py-0.5 bg-rose-200 text-rose-900 rounded font-mono text-[10px] font-extrabold uppercase">
                      Latency Spikes
                    </span>
                  </div>
                  <p className="text-rose-800 text-xs mt-0.5">
                    Historical trend modeling detected severe P99 latency degradation and exponential spike velocity (&gt;+30ms/h).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <button
                  onClick={() => setActiveMainTab('predictive_failure')}
                  className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-mono font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Inspect Risk Model</span>
                </button>
              </div>
            </div>
          )}

          {/* Filter Tabs & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
            <div className="flex flex-wrap gap-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  id={`conn-filter-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2"><div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200"><button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-700"}`} title="Grid View"><LayoutGrid className="w-4 h-4" /></button><button onClick={() => setViewMode("table")} className={`p-1.5 rounded-md transition-colors ${viewMode === "table" ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-700"}`} title="Table View"><List className="w-4 h-4" /></button></div><div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search connectors..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div></div>
          </div>

          {/* Test Connection Result Alert */}
          {testResult && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start justify-between gap-3 text-xs text-emerald-900 shadow-2xs">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm text-emerald-950">Connection Diagnostics Passed</p>
                  <p className="mt-0.5">{testResult.message}</p>
                  <div className="flex gap-4 mt-2 font-mono text-[11px] text-emerald-800">
                    <span>Latency: {testResult.latency}ms</span>
                    <span>Response: {testResult.status}</span>
                    <span>Auth: {testResult.authStatus}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setTestResult(null)} className="text-emerald-700 hover:text-emerald-900">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

      {/* Connector Grid or Throttling Matrix */}
      {!showThrottlingMatrix ? (
        viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredConnectors.map((conn) => {
            const isTesting = testingId === conn.id;
            const throttling = conn.throttlingConfig;

            return (
              <div
                key={conn.id}
                className="bg-white rounded-2xl border border-slate-200 p-4.5 sm:p-5 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between h-full"
              >
                <div className="flex flex-col flex-1 justify-between">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 shrink-0">
                        <Database className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-slate-900 truncate" title={conn.name}>
                          {conn.name}
                        </h3>
                        <span className="text-[11px] font-medium text-slate-500 block truncate" title={conn.provider}>
                          {conn.provider}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {conn.isAutoDiscovered && (
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-[10px] font-mono font-bold border border-purple-200 flex items-center gap-1 shrink-0">
                          <Cpu className="w-3 h-3 text-purple-600" />
                          Auto-Discovered
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-mono font-semibold border border-slate-200 shrink-0">
                        {conn.category}
                      </span>
                    </div>
                  </div>

                  {/* Middle Specs Box */}
                  <div className="space-y-1.5 text-xs text-slate-600 my-3 bg-slate-50 p-3 rounded-xl border border-slate-100 font-mono">
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-slate-400 shrink-0">Endpoint:</span>
                      <span className="text-slate-800 truncate text-right font-medium max-w-[150px] sm:max-w-[170px]" title={conn.hostUrl || 'Configured'}>
                        {conn.hostUrl || 'Configured'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-slate-400 shrink-0">Auth Method:</span>
                      <span className="text-slate-800 truncate text-right font-medium">{conn.authType}</span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-slate-400 shrink-0">Target Role:</span>
                      <span className="text-slate-800 truncate text-right font-medium">{conn.systemType}</span>
                    </div>

                    <div className="flex justify-between items-center gap-2 pt-2 border-t border-slate-200/60 mt-2">
                      <span className="text-slate-500 flex items-center gap-1 text-[11px] shrink-0">
                        <Gauge className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>Throttling:</span>
                      </span>
                      {throttling && throttling.isEnabled ? (
                        <span className="text-indigo-700 font-bold bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded text-[10px] font-mono truncate text-right max-w-[160px]" title={`${throttling.maxRequestsPerSecond} req/s • ${throttling.maxConcurrentRequests} workers`}>
                          {throttling.maxRequestsPerSecond} req/s • {throttling.maxConcurrentRequests} workers
                        </span>
                      ) : (
                        <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-mono shrink-0">
                          Unthrottled Mode
                        </span>
                      )}
                    </div>

                    {/* Automated Data Profiling Statistics Badge */}
                    <div className="mt-2.5 pt-2.5 border-t border-slate-200/60 bg-indigo-50/50 -mx-3 -mb-3 p-2.5 rounded-b-xl border-t-indigo-100 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span className="text-slate-700 font-semibold font-mono truncate">
                          {conn.dataProfile ? `${conn.dataProfile.totalRowCount.toLocaleString()} Rows` : '14,250 Rows'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 font-mono">
                        <span className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
                          (conn.dataProfile?.overallNullPercentage || 3.2) > 5
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {conn.dataProfile ? `${conn.dataProfile.overallNullPercentage}% Null` : '3.2% Null'}
                        </span>
                        <span className="text-indigo-700 bg-white border border-indigo-200 px-1.5 py-0.2 rounded text-[10px] font-bold">
                          {conn.dataProfile ? `${conn.dataProfile.dataTypeDistribution.length} Types` : '4 Types'}
                        </span>
                      </div>
                    </div>

                    {/* Proactive Latency Spike Prediction Strip */}
                    {(() => {
                      const pred = failurePredictionsMap[conn.id];
                      if (!pred) return null;
                      const isHighRisk = pred.riskLevel === 'Critical' || pred.riskLevel === 'High';
                      return (
                        <div className={`mt-2 pt-2 border-t border-dashed flex items-center justify-between text-[11px] ${
                          isHighRisk ? 'border-rose-200 text-rose-800' : 'border-slate-200 text-slate-600'
                        }`}>
                          <span className="flex items-center gap-1 font-mono text-[10px]">
                            <ShieldAlert className={`w-3 h-3 ${isHighRisk ? 'text-rose-600 animate-pulse' : 'text-slate-400'}`} />
                            <span>Risk Score:</span>
                          </span>
                          <span className={`font-mono font-bold text-[10px] px-1.5 py-0.5 rounded border ${
                            pred.riskLevel === 'Critical'
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : pred.riskLevel === 'High'
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {pred.riskScore}% {pred.riskLevel}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="border-t border-slate-100 pt-3 mt-auto space-y-2">
                  {/* Status Indicator Row */}
                  <div className="flex items-center justify-between text-xs min-w-0">
                    <span className="text-slate-400 font-medium font-mono text-[10px] uppercase tracking-wider shrink-0">
                      Telemetry Status
                    </span>
                    <div className="min-w-0 flex-1 flex justify-end">
                      {renderStatusIndicator(conn)}
                    </div>
                  </div>

                  {/* Primary Profiling Details & Failure Forecaster Row */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      id={`conn-details-btn-${conn.id}`}
                      onClick={() => {
                        setSelectedDetailsConnector(conn);
                        setIsDetailsModalOpen(true);
                      }}
                      className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all shadow-xs cursor-pointer w-full"
                      title="Inspect Profile & Details"
                    >
                      <PieChart className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>

                    <button
                      id={`conn-forecaster-btn-${conn.id}`}
                      onClick={() => {
                        setSelectedPredictionConnector(conn);
                        setIsPredictionModalOpen(true);
                      }}
                      className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold rounded-lg transition-all border border-rose-200 cursor-pointer w-full shadow-xs"
                      title="Analyze Historical Latency Spikes & Predict Outages"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                      <span>Forecaster</span>
                    </button>
                  </div>

                  {/* Secondary Actions Row */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      id={`conn-throttling-btn-${conn.id}`}
                      onClick={() => setThrottlingModalConnector(conn)}
                      className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-all border border-slate-200 cursor-pointer w-full shrink-0"
                      title="Configure Rate Limits & System Protection"
                    >
                      <Gauge className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>Throttling</span>
                    </button>

                    <button
                      id={`conn-test-btn-${conn.id}`}
                      onClick={() => handleRunTest(conn)}
                      disabled={isTesting}
                      className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer w-full shrink-0 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isTesting ? 'animate-spin' : ''}`} />
                      <span>{isTesting ? 'Testing...' : 'Test'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Connector</th>
                  <th className="py-3 px-4">Provider</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Endpoint</th>
                  <th className="py-3 px-4">Data Profile Stats</th>
                  <th className="py-3 px-4">Proactive Risk</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredConnectors.map((conn) => {
                  const isTesting = testingId === conn.id;
                  const profile = conn.dataProfile;
                  const pred = failurePredictionsMap[conn.id];
                  return (
                    <tr key={conn.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100 shrink-0">
                            <Database className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-slate-900">{conn.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">{conn.provider}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-mono font-semibold border border-slate-200">
                          {conn.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 text-[11px] truncate max-w-[200px]">{conn.hostUrl || "Configured"}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 font-mono text-[11px]">
                          <span className="font-semibold text-slate-800">
                            {profile ? `${profile.totalRowCount.toLocaleString()} rows` : '14,250 rows'}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
                            (profile?.overallNullPercentage || 3.2) > 5
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {profile ? `${profile.overallNullPercentage}% null` : '3.2% null'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {pred ? (
                          <div className="flex items-center gap-1.5 font-mono text-[11px]">
                            <span className={`px-2 py-0.5 rounded font-bold text-[10px] border ${
                              pred.riskLevel === 'Critical'
                                ? 'bg-rose-100 text-rose-800 border-rose-300'
                                : pred.riskLevel === 'High'
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              {pred.riskScore}% {pred.riskLevel}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono text-[10px]">Nominal</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {renderStatusIndicator(conn)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedDetailsConnector(conn);
                              setIsDetailsModalOpen(true);
                            }}
                            className="px-2 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                            title="Inspect Data Profile & Stats"
                          >
                            <PieChart className="w-3.5 h-3.5" />
                            <span>Details</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedPredictionConnector(conn);
                              setIsPredictionModalOpen(true);
                            }}
                            className="px-2 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                            title="Predictive Latency Spike Forecaster"
                          >
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                            <span>Forecaster</span>
                          </button>
                          <button
                            onClick={() => setThrottlingModalConnector(conn)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Configure Throttling"
                          >
                            <Gauge className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRunTest(conn)}
                            disabled={isTesting}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Test Connection"
                          >
                            <RefreshCw className={`w-4 h-4 ${isTesting ? "animate-spin text-emerald-500" : ""}`} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )
      ) : (
        /* Throttling Control Matrix View */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold text-slate-900">API Throttling & Rate Limit Matrix</h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Showing {filteredConnectors.length} connectors
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Connector Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Rate Limit (RPS)</th>
                  <th className="py-3 px-4">Worker Threads</th>
                  <th className="py-3 px-4">Backoff Strategy</th>
                  <th className="py-3 px-4">429 Cooldown</th>
                  <th className="py-3 px-4 text-right">Configure</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredConnectors.map((c) => {
                  const cfg = c.throttlingConfig;
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-all font-mono">
                      <td className="py-3 px-4 font-bold text-slate-900 font-sans">
                        <div className="flex items-center gap-2">
                          <Database className="w-4 h-4 text-indigo-600" />
                          <span>{c.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-sans">{c.category}</td>
                      <td className="py-3 px-4">
                        {cfg?.isEnabled ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-semibold border border-emerald-100">
                            <ShieldCheck className="w-3 h-3" />
                            Protected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-semibold border border-amber-100">
                            <AlertCircle className="w-3 h-3" />
                            Unthrottled
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold text-indigo-600">
                        {cfg?.isEnabled ? `${cfg.maxRequestsPerSecond} req/s` : '500 req/s (Uncapped)'}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {cfg?.isEnabled ? `${cfg.maxConcurrentRequests} threads` : '32 threads'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-sans text-[11px]">
                        {cfg?.retryStrategy || 'ExponentialBackoff'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {cfg?.autoCooldownOn429 ? `${cfg.cooldownPeriodSeconds || 30}s pause` : 'Disabled'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setThrottlingModalConnector(c)}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold font-sans rounded-lg transition-all text-xs border border-indigo-200"
                        >
                          Edit SLA
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
        </>
      )}

      {/* Throttling Configuration Modal */}
      <ConnectorThrottlingModal
        connector={throttlingModalConnector}
        isOpen={!!throttlingModalConnector}
        onClose={() => setThrottlingModalConnector(null)}
        onSave={handleSaveThrottlingConfig}
      />

      {/* Add Connector Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-600" />
                Register New Enterprise Connector
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateConnectorSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Connector Name</label>
                <input
                  type="text"
                  required
                  value={newConnName}
                  onChange={(e) => setNewConnName(e.target.value)}
                  placeholder="e.g. SAP S/4HANA Finance Prod"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={newConnCategory}
                    onChange={(e) => setNewConnCategory(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="ERP">ERP System</option>
                    <option value="CRM">CRM System</option>
                    <option value="Database">Database</option>
                    <option value="Files">Files</option>
                    <option value="Cloud Storage">Cloud Storage</option>
                    <option value="Custom API">Custom API</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Authentication Method</label>
                  <select
                    value={newConnAuthType}
                    onChange={(e) => setNewConnAuthType(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="OAuth 2.0">OAuth 2.0 Client Credentials</option>
                    <option value="API Key">API Key / Token</option>
                    <option value="SQL Auth">Database User / Password</option>
                    <option value="Service Principal">Azure Service Principal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Host URL or Connection String</label>
                <input
                  type="text"
                  value={newConnHostUrl}
                  onChange={(e) => setNewConnHostUrl(e.target.value)}
                  placeholder="https://api.businesscentral.dynamics.com/v2.0/tenant/api"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-xs"
                >
                  Save Connector
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OpenAPI Builder Modal */}
      {showApiBuilderModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Code className="w-5 h-5 text-indigo-600" />
                No-Code OpenAPI / Swagger API Connector Builder
              </h2>
              <button onClick={() => setShowApiBuilderModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleImportOpenApi} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">API Name</label>
                  <input
                    type="text"
                    required
                    value={apiName}
                    onChange={(e) => setApiName(e.target.value)}
                    placeholder="e.g. Custom HRMS REST API"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Base Endpoint URL</label>
                  <input
                    type="text"
                    value={apiBaseUrl}
                    onChange={(e) => setApiBaseUrl(e.target.value)}
                    placeholder="https://api.hrms.internal/v1"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Paste OpenAPI 3.0 / Swagger Spec (JSON or YAML)
                </label>
                <textarea
                  rows={6}
                  value={swaggerJson}
                  onChange={(e) => setSwaggerJson(e.target.value)}
                  placeholder={`{\n  "openapi": "3.0.0",\n  "info": { "title": "Custom HRMS API" },\n  "paths": { "/employees": { "get": {} } }\n}`}
                  className="w-full p-3 bg-slate-900 text-indigo-300 font-mono text-xs rounded-xl focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowApiBuilderModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-xs"
                >
                  Import OpenAPI Connector
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Real-time Enterprise Infrastructure Auto-Discovery Terminal Modal */}
      {showScanModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl border border-slate-200 max-w-3xl w-full p-6 shadow-xl space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                  <Cpu className="w-6 h-6 animate-pulse text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    Real-Time Infrastructure Scanner & Connector Discovery
                  </h2>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Probing enterprise VPCs, Active Directory LDAP, and API Gateways (6 Endpoints)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowScanModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress Bar & Status Header */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-800 font-bold flex items-center gap-2">
                  <Activity className={`w-4 h-4 text-indigo-600 ${isScanningInRealtime ? 'animate-spin' : ''}`} />
                  {isScanningInRealtime ? 'Scanning Enterprise Subnets in Real-Time...' : 'Auto-Discovery Scan Complete!'}
                </span>
                <span className="text-indigo-600 font-bold">{scanProgressPct}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-300">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${scanProgressPct}%` }}
                />
              </div>
            </div>

            {/* Terminal Log Console */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-500 font-mono px-1">
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-indigo-600" />
                  Scanner Console Logs
                </span>
                <span>Subnet: 10.240.0.0/16</span>
              </div>
              <div className="bg-slate-900 text-emerald-400 font-mono text-[11px] p-4 rounded-xl border border-slate-800 max-h-48 overflow-y-auto space-y-1 shadow-inner">
                {scanLogs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed">
                    {log}
                  </div>
                ))}
              </div>
            </div>

            {/* Discovered Items Summary Grid */}
            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wider mb-2 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Populated Enterprise Connectors ({DISCOVERABLE_ENTERPRISE_CONNECTORS.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {DISCOVERABLE_ENTERPRISE_CONNECTORS.map((item) => {
                  const isPopulated = connectors.some((c) => c.id === item.connector.id);
                  return (
                    <div
                      key={item.connector.id}
                      className={`p-2.5 rounded-xl border text-xs font-mono transition-all ${
                        isPopulated
                          ? 'bg-purple-50 border-purple-200 text-purple-900'
                          : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold truncate">{item.connector.name}</span>
                        {isPopulated ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0 animate-pulse" />
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 truncate">
                        {item.connector.provider} • {item.connector.latencyMs}ms
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-[11px] font-mono text-slate-400">
                {isScanningInRealtime
                  ? 'Discovered connectors are automatically stored in memory and cache.'
                  : '6 Connectors ready for schema migration & transfer.'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowScanModal(false);
                    setActiveMainTab('discovery_log');
                  }}
                  className="px-3.5 py-2 bg-purple-900/80 hover:bg-purple-800 text-purple-200 border border-purple-500/40 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Terminal className="w-3.5 h-3.5 text-purple-300" />
                  <span>Open Discovery Log Panel</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowScanModal(false)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  Close & View in Registry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Automated Data Profiling & Connector Details Modal */}
      {selectedDetailsConnector && (
        <ConnectorDetailsModal
          connector={selectedDetailsConnector}
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedDetailsConnector(null);
          }}
          onReProfile={handleReProfileConnector}
        />
      )}

      {/* Universal Connector Comparison Modal */}
      <ConnectorComparisonModal
        connectors={connectors}
        initialConnectorAId={comparisonConnectorAId}
        initialConnectorBId={comparisonConnectorBId}
        isOpen={isComparisonModalOpen}
        onClose={() => {
          setIsComparisonModalOpen(false);
          setComparisonConnectorAId(undefined);
          setComparisonConnectorBId(undefined);
        }}
        onSelectConnectorForDetails={(conn) => {
          setSelectedDetailsConnector(conn);
          setIsDetailsModalOpen(true);
        }}
      />

      {/* Proactive Latency Spike & Failure Prediction Modal */}
      {selectedPredictionConnector && (
        <ConnectorFailurePredictionModal
          connector={selectedPredictionConnector}
          isOpen={isPredictionModalOpen}
          onClose={() => {
            setIsPredictionModalOpen(false);
            setSelectedPredictionConnector(null);
          }}
          onOpenThrottling={(conn: any) => {
            setIsPredictionModalOpen(false);
            setThrottlingModalConnector(conn);
          }}
        />
      )}
    </div>
  );
};
