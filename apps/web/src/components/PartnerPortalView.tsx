import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  Server,
  KeyRound,
  BarChart3,
  DollarSign,
  Palette,
  Search,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  Shield,
  Download,
  Settings,
  Sparkles,
  Layers,
  ArrowUpRight,
  Database,
  Lock,
  Globe,
  RefreshCcw,
  Sliders,
  FileSpreadsheet,
  Zap,
  ChevronRight,
  X,
  Check,
  Briefcase,
  Activity,
  Cpu,
  PieChart as PieChartIcon,
  LayoutGrid,
  Table,
  Play,
  Pause,
  Radio,
  TrendingUp,
  Eye,
  Filter,
  MoreHorizontal,
  Mail,
  Bell,
  Send,
  ShieldAlert,
  CreditCard,
  FileText,
  Receipt,
  Calendar,
  Edit3,
  ShieldCheck,
  Terminal,
  Copy,
  RefreshCw,
  EyeOff,
  Link2,
} from 'lucide-react';
import { MigrationAuditTrailView } from './MigrationAuditTrailView';
import { CustomerComparisonDashboard } from './CustomerComparisonDashboard';
import { PartnerLeadsCrm } from './PartnerLeadsCrm';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  MOCK_PARTNER_ORGANIZATIONS,
  MOCK_PARTNER_CUSTOMERS,
  MOCK_PARTNER_TENANTS,
  MOCK_LICENSE_PACKAGES,
  MOCK_LICENSE_ASSIGNMENTS,
  MOCK_MONTHLY_USAGE,
  MOCK_REVENUE_DATA,
  DEFAULT_WHITE_LABEL_CONFIG,
  MOCK_LIVE_ACTIVITY_EVENTS,
  PartnerOrganization,
  PartnerCustomer,
  PartnerTenant,
  LicensePackage,
  LicenseAssignment,
  WhiteLabelConfig,
  LiveActivityEvent,
} from '../data/partnerPortalData';
import { LiveActivityFeed } from './LiveActivityFeed';

export type UserRole = 'Partner Admin' | 'Partner Analyst' | 'Partner Support';

export interface RolePermissions {
  canOnboardPartner: boolean;
  canOnboardCustomer: boolean;
  canProvisionTenant: boolean;
  canRestartTenantNodes: boolean;
  canAssignLicense: boolean;
  canEditWhiteLabel: boolean;
  canViewRevenueReports: boolean;
  canViewAuditLogs: boolean;
  canViewDashboards: boolean;
  canViewUsageReports: boolean;
  canManageSso: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  'Partner Admin': {
    canOnboardPartner: true,
    canOnboardCustomer: true,
    canProvisionTenant: true,
    canRestartTenantNodes: true,
    canAssignLicense: true,
    canEditWhiteLabel: true,
    canViewRevenueReports: true,
    canViewAuditLogs: true,
    canViewDashboards: true,
    canViewUsageReports: true,
    canManageSso: true,
  },
  'Partner Analyst': {
    canOnboardPartner: false,
    canOnboardCustomer: false,
    canProvisionTenant: false,
    canRestartTenantNodes: false,
    canAssignLicense: false,
    canEditWhiteLabel: false,
    canViewRevenueReports: true,
    canViewAuditLogs: true,
    canViewDashboards: true,
    canViewUsageReports: true,
    canManageSso: false,
  },
  'Partner Support': {
    canOnboardPartner: false,
    canOnboardCustomer: false,
    canProvisionTenant: true,
    canRestartTenantNodes: true,
    canAssignLicense: false,
    canEditWhiteLabel: false,
    canViewRevenueReports: false,
    canViewAuditLogs: true,
    canViewDashboards: true,
    canViewUsageReports: true,
    canManageSso: true,
  },
};

interface PartnerPortalViewProps {
  onNavigateTab?: (tab: string) => void;
}

export const PartnerPortalView: React.FC<PartnerPortalViewProps> = ({ onNavigateTab }) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'partners' | 'customers' | 'dashboards' | 'tenants' | 'sso' | 'licenses' | 'usage' | 'revenue' | 'whitelabel' | 'audit' | 'activity' | 'comparison' | 'crm'
  >('partners');
  const [selectedAuditCustomerId, setSelectedAuditCustomerId] = useState<string>('ALL');

  // Real-Time Live Activity Feed State
  const [liveActivityEvents, setLiveActivityEvents] = useState<LiveActivityEvent[]>(MOCK_LIVE_ACTIVITY_EVENTS);

  // Helper function to record a real-time event
  const pushActivityEvent = (
    eventType: LiveActivityEvent['eventType'],
    title: string,
    description: string,
    customer: PartnerCustomer,
    actor: string = 'Partner Lead',
    actorRole: string = 'Partner Admin',
    metadata?: Record<string, string | number>,
    severity: LiveActivityEvent['severity'] = 'info'
  ) => {
    const newEvt: LiveActivityEvent = {
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: `Just now (${new Date().toLocaleTimeString()})`,
      customerId: customer.id,
      customerName: customer.name,
      customerCode: customer.code,
      partnerId: customer.partnerId,
      partnerName: customer.partnerName || 'Avanade',
      eventType,
      severity,
      title,
      description,
      actor,
      actorRole,
      metadata,
    };
    setLiveActivityEvents((prev) => [newEvt, ...prev]);
  };

  // Fine-Grained Role-Based Access Control (RBAC) State
  const [userRole, setUserRole] = useState<UserRole>('Partner Admin');
  const [showRbacMatrixModal, setShowRbacMatrixModal] = useState<boolean>(false);
  const [supportAssignedOnly, setSupportAssignedOnly] = useState<boolean>(false);
  const [assignedSupportCustomerIds, setAssignedSupportCustomerIds] = useState<string[]>([
    'cust-101',
    'cust-102',
    'cust-107',
  ]);

  const currentPermissions = ROLE_PERMISSIONS[userRole];

  // Multi-Partner Organizations State & Context Isolation Switcher
  const [partners, setPartners] = useState<PartnerOrganization[]>(MOCK_PARTNER_ORGANIZATIONS);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('ALL');
  const [showAddPartnerModal, setShowAddPartnerModal] = useState<boolean>(false);

  // New Partner Form State
  const [newPartner, setNewPartner] = useState({
    name: '',
    code: '',
    tier: 'Platinum Global Strategic Partner' as PartnerOrganization['tier'],
    region: 'Global' as PartnerOrganization['region'],
    accountManager: '',
    contactEmail: '',
    logoPreset: 'Avanade' as PartnerOrganization['logoPreset'],
    primaryColorHex: '#4F46E5',
    accentColorHex: '#10B981',
    themeMode: 'Indigo Executive' as PartnerOrganization['themeMode'],
    cnameDomain: '',
  });

  // Interactive state
  const [customers, setCustomers] = useState<PartnerCustomer[]>(MOCK_PARTNER_CUSTOMERS);
  const [tenants, setTenants] = useState<PartnerTenant[]>(MOCK_PARTNER_TENANTS);
  const [licensePackages, setLicensePackages] = useState<LicensePackage[]>(MOCK_LICENSE_PACKAGES);
  const [licenseAssignments, setLicenseAssignments] = useState<LicenseAssignment[]>(MOCK_LICENSE_ASSIGNMENTS);
  const [whiteLabel, setWhiteLabel] = useState<WhiteLabelConfig>(DEFAULT_WHITE_LABEL_CONFIG);

  // Partner Switcher Handler
  const handleSelectPartner = (partnerId: string) => {
    setSelectedPartnerId(partnerId);
    if (partnerId === 'ALL') {
      setWhiteLabel(DEFAULT_WHITE_LABEL_CONFIG);
      showToast(`🌐 Multi-Partner Ecosystem View Activated (Showing all ${partners.length} partners)`);
    } else {
      const p = partners.find((item) => item.id === partnerId);
      if (p) {
        setWhiteLabel({
          partnerName: p.name,
          tagline: `Premier ${p.tier} Isolated Workspace`,
          partnerTier: p.tier as any,
          logoPreset: p.logoPreset as any,
          primaryColorHex: p.primaryColorHex,
          accentColorHex: p.accentColorHex,
          themeMode: p.themeMode,
          cnameDomain: p.cnameDomain,
          sslCertStatus: 'Active & Verified',
          supportEmail: p.contactEmail,
          customHeaderNotice: `🔒 Data Isolation Active — Workspace Partition for ${p.name}`,
          coBrandingText: `Powered by EDIMP Isolation Engine v3.4`,
          showPoweredByBadge: true,
          loginWelcomeMsg: `Welcome to ${p.name} Partner Workspace. Data isolation policy enforced.`,
        });
        showToast(`🔒 Partner Data Isolation Enforced: Workspace switched to ${p.name}`);
      }
    }
  };

  // View Mode Toggles
  const [customerViewMode, setCustomerViewMode] = useState<'grid' | 'table'>('grid');
  const [dashboardViewMode, setDashboardViewMode] = useState<'grid' | 'table'>('grid');

  // Real-time Simulation Engine
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);
  const [liveThroughputGbSec, setLiveThroughputGbSec] = useState(4.28);
  const [liveCdcOpsSec, setLiveCdcOpsSec] = useState(19420);
  const [lastLiveUpdate, setLastLiveUpdate] = useState(new Date().toLocaleTimeString());

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [erpFilter, setErpFilter] = useState<string>('All');
  const [stageFilter, setStageFilter] = useState<string>('All');

  // Modals & Drawers
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showProvisionTenantModal, setShowProvisionTenantModal] = useState(false);
  const [selectedCustomerForDrawer, setSelectedCustomerForDrawer] = useState<PartnerCustomer | null>(null);
  const [selectedCustomerWorkspace, setSelectedCustomerWorkspace] = useState<PartnerCustomer | null>(null);

  // Tenant Provisioning Animation state
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [provisionProgress, setProvisionProgress] = useState(0);
  const [provisionStepText, setProvisionStepText] = useState('');

  // Usage Reports Interactive Controls
  const [usageMetric, setUsageMetric] = useState<'all' | 'dataTransferredTb' | 'apiRequestsMillions' | 'cdcEventsBillions'>('all');
  const [usageChartType, setUsageChartType] = useState<'area' | 'bar'>('area');

  // New Customer Form State (Includes Payment & Commercial Plan Config)
  const [newCustomer, setNewCustomer] = useState({
    partnerId: 'partner-avanade',
    name: '',
    code: '',
    erpEcosystem: 'Microsoft Dynamics 365' as PartnerCustomer['erpEcosystem'],
    tier: 'Enterprise' as PartnerCustomer['tier'],
    accountManager: 'Marcus Vance (Partner Team)',
    contactName: '',
    contactEmail: '',
    region: 'North America' as PartnerCustomer['region'],
    mrrAmount: 18500,
    billingCycle: 'Monthly' as 'Monthly' | 'Annual',
    paymentMethod: 'Corporate PO / Invoice',
    poNumber: '',
    taxId: '',
    selectedAddons: ['priority_sla', 'anonymization'] as string[],
  });

  // Dynamic MRR calculation for onboarding new customer
  const calculateNewCustomerMrr = () => {
    let base = 18500;
    if (newCustomer.tier === 'Trial') base = 0;
    else if (newCustomer.tier === 'Starter') base = 2500;
    else if (newCustomer.tier === 'Professional') base = 7500;
    else if (newCustomer.tier === 'Enterprise') base = 18500;
    else if (newCustomer.tier === 'Partner') base = 35000;
    else if (newCustomer.tier === 'Unlimited') base = 75000;
    else if (newCustomer.tier === 'Standard') base = 7500;
    else if (newCustomer.tier === 'Pro') base = 12000;
    else if (newCustomer.tier === 'Dedicated Cluster') base = 25000;
    else if (newCustomer.tier === 'Pay-As-You-Go CDC') base = 5000;

    let addonTotal = 0;
    if (newCustomer.selectedAddons.includes('priority_sla')) addonTotal += 1500;
    if (newCustomer.selectedAddons.includes('anonymization')) addonTotal += 2000;
    if (newCustomer.selectedAddons.includes('cdc_relay')) addonTotal += 2500;

    const subtotal = base + addonTotal;
    const discount = newCustomer.billingCycle === 'Annual' ? 0.85 : 1.0;
    return Math.round(subtotal * discount);
  };

  // New Tenant Form State
  const [newTenant, setNewTenant] = useState({
    tenantName: '',
    customerId: customers[0]?.id || '',
    cloudRegion: 'Azure US East' as PartnerTenant['cloudRegion'],
    instanceType: 'Dedicated High-Throughput Cluster' as PartnerTenant['instanceType'],
    allocatedNodes: 8,
    storageAllocatedTb: 50,
  });

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Interactive Customer Billing Plan Management State
  const [editingBillingTier, setEditingBillingTier] = useState<PartnerCustomer['tier']>('Enterprise');
  const [editingBillingCycle, setEditingBillingCycle] = useState<'Monthly' | 'Annual'>('Monthly');
  const [editingAddons, setEditingAddons] = useState<string[]>(['priority_sla', 'anonymization']);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<string>('Corporate PO / Invoice');
  const [editingAutoRenew, setEditingAutoRenew] = useState<boolean>(true);

  // Sync state whenever selectedCustomerForDrawer is set or changed
  useEffect(() => {
    if (selectedCustomerForDrawer) {
      setEditingBillingTier(selectedCustomerForDrawer.tier);
      if (selectedCustomerForDrawer.tier === 'Enterprise') {
        setEditingAddons(['priority_sla', 'anonymization']);
      } else if (selectedCustomerForDrawer.tier === 'Dedicated Cluster') {
        setEditingAddons(['priority_sla', 'anonymization', 'cdc_relay']);
      } else {
        setEditingAddons(['priority_sla']);
      }
    }
  }, [selectedCustomerForDrawer]);

  // Calculate real-time MRR based on selected tier, cycle discount, and add-ons
  const calculatePlanMrr = (
    tier: PartnerCustomer['tier'],
    cycle: 'Monthly' | 'Annual',
    addons: string[]
  ) => {
    let base = 18500;
    if (tier === 'Trial') base = 0;
    else if (tier === 'Starter') base = 2500;
    else if (tier === 'Professional') base = 7500;
    else if (tier === 'Enterprise') base = 18500;
    else if (tier === 'Partner') base = 35000;
    else if (tier === 'Unlimited') base = 75000;
    else if (tier === 'Standard') base = 7500;
    else if (tier === 'Pro') base = 12000;
    else if (tier === 'Dedicated Cluster') base = 25000;
    else if (tier === 'Pay-As-You-Go CDC') base = 5000;

    let addonTotal = 0;
    if (addons.includes('priority_sla')) addonTotal += 1500;
    if (addons.includes('anonymization')) addonTotal += 2000;
    if (addons.includes('cdc_relay')) addonTotal += 2500;
    if (addons.includes('replay_buffer')) addonTotal += 1000;

    const subtotal = base + addonTotal;
    const discountFactor = cycle === 'Annual' ? 0.85 : 1.0;
    return Math.round(subtotal * discountFactor);
  };

  const handleSaveBillingPlan = () => {
    if (!selectedCustomerForDrawer) return;

    const newMrr = calculatePlanMrr(
      editingBillingTier,
      editingBillingCycle,
      editingAddons
    );

    setCustomers((prev) =>
      prev.map((c) =>
        c.id === selectedCustomerForDrawer.id
          ? {
              ...c,
              tier: editingBillingTier,
              mrrAmount: newMrr,
            }
          : c
      )
    );

    setSelectedCustomerForDrawer((prev) =>
      prev
        ? {
            ...prev,
            tier: editingBillingTier,
            mrrAmount: newMrr,
          }
        : null
    );

    showToast(
      `🎉 Billing plan updated for ${selectedCustomerForDrawer.name}! Plan: ${editingBillingTier} ($${newMrr.toLocaleString()}/mo)`
    );
  };

  const handleLaunchCustomerDashboard = (customer: PartnerCustomer) => {
    setSelectedCustomerWorkspace(customer);
    showToast(`⚡ Opened Real-Time Workspace Dashboard for ${customer.name} (${customer.code})!`);
    if (selectedCustomerForDrawer) setSelectedCustomerForDrawer(null);
  };

  const handleManualSyncPulse = () => {
    const nextThroughput = +(4.2 + Math.random() * 1.5).toFixed(2);
    const nextCdcOps = Math.floor(19000 + Math.random() * 4000);
    const timeStr = new Date().toLocaleTimeString();

    setLiveThroughputGbSec(nextThroughput);
    setLiveCdcOpsSec(nextCdcOps);
    setLastLiveUpdate(timeStr);

    setCustomers((prev) =>
      prev.map((c) => ({
        ...c,
        dataMigratedTb: +(c.dataMigratedTb + 0.04).toFixed(2),
        healthScore: Math.min(100, Math.max(90, +(c.healthScore + 0.2).toFixed(1))),
      }))
    );

    showToast(`⚡ Manual Real-Time Telemetry Checkpoint Executed at ${timeStr}! Updated all customer CDC streams.`);
  };

  // Automated Storage Quota Alert State
  const [storageAlertThresholdPct, setStorageAlertThresholdPct] = useState<number>(80);
  const [enableAutoEmailAlerts, setEnableAutoEmailAlerts] = useState<boolean>(true);
  const [enableSlackAlerts, setEnableSlackAlerts] = useState<boolean>(true);
  const [showStorageAlertModal, setShowStorageAlertModal] = useState<boolean>(false);
  const [alertFilterQuery, setAlertFilterQuery] = useState<string>('');

  interface StorageAlertLog {
    id: string;
    timestamp: string;
    customerName: string;
    customerCode: string;
    storageUsedTb: number;
    storageQuotaTb: number;
    pctUsed: number;
    recipients: string[];
    status: 'Delivered' | 'Sent' | 'Failed';
    channel: 'Email & System' | 'Email' | 'Slack Webhook';
  }

  const [storageAlertLogs, setStorageAlertLogs] = useState<StorageAlertLog[]>([
    {
      id: 'alt-101',
      timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString().replace('T', ' ').substring(0, 19),
      customerName: 'Global Logistics Corp',
      customerCode: 'GLC-001',
      storageUsedTb: 44.2,
      storageQuotaTb: 50.0,
      pctUsed: 88.4,
      recipients: ['m.vance@partner.com', 'admin@globallogistics.com'],
      status: 'Delivered',
      channel: 'Email & System',
    },
    {
      id: 'alt-102',
      timestamp: new Date(Date.now() - 1000 * 60 * 140).toISOString().replace('T', ' ').substring(0, 19),
      customerName: 'Apex Health Systems',
      customerCode: 'AHS-002',
      storageUsedTb: 27.6,
      storageQuotaTb: 30.0,
      pctUsed: 92.0,
      recipients: ['s.chen@partner.com', 'it-director@apexhealth.com'],
      status: 'Delivered',
      channel: 'Email & System',
    },
    {
      id: 'alt-103',
      timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString().replace('T', ' ').substring(0, 19),
      customerName: 'Nordic Retail Group',
      customerCode: 'NRG-003',
      storageUsedTb: 76.5,
      storageQuotaTb: 80.0,
      pctUsed: 95.6,
      recipients: ['m.vance@partner.com', 'cloud-admin@nordicretail.com'],
      status: 'Delivered',
      channel: 'Email & System',
    },
  ]);

  const [emailTemplate, setEmailTemplate] = useState({
    subject: '⚠️ Action Required: Data migration storage capacity approaching threshold for {{customer_code}}',
    headerNotice: 'Automated Migration Storage Capacity Warning',
  });

  // Partner Customer SSO Configurations State
  const [partnerSsoConfigs, setPartnerSsoConfigs] = useState([
    {
      id: 'sso-cust-01',
      customerId: 'cust-101',
      customerName: 'Acme Corporation',
      customerCode: 'ACME-001',
      protocol: 'OIDC' as 'SAML2' | 'OIDC',
      status: 'Active' as 'Active' | 'Testing' | 'Disabled',
      connectionStatus: 'Pending' as 'Verified' | 'Error' | 'Pending',
      domain: 'acme-corp.com',
      samlMetadataUrl: 'https://idp.acme-corp.com/federationmetadata/2007-06/federationmetadata.xml',
      samlEntityId: 'urn:edimp:sp:acme-corp',
      acsUrl: 'https://app.edimp.io/api/auth/sso/saml/acs',
      x509CertFingerprint: '9A:8B:7C:6D:5E:4F:3A:2B:1C:0D:9E:8F:7A:6B:5C:4D',
      samlCertExpiryDate: '2027-11-15',
      oidcDiscoveryUrl: 'https://acme.okta.com/oauth2/default/.well-known/openid-configuration',
      issuerUrl: 'https://acme.okta.com/oauth2/default',
      clientId: '0oae189x09XzMkp097',
      clientSecret: 'secret_live_okta_981273912389172391',
      scopes: 'openid profile email groups',
      lastTestedAt: '2026-08-09 14:22',
      testStatus: 'PASSED' as 'PASSED' | 'FAILED' | 'NEVER',
      mappedRole: 'Customer Administrator',
    },
    {
      id: 'sso-cust-02',
      customerId: 'cust-102',
      customerName: 'Contoso Retail Group',
      customerCode: 'CNT-002',
      protocol: 'SAML2' as 'SAML2' | 'OIDC',
      status: 'Active' as 'Active' | 'Testing' | 'Disabled',
      connectionStatus: 'Pending' as 'Verified' | 'Error' | 'Pending',
      domain: 'contoso-retail.com',
      samlMetadataUrl: 'https://login.microsoftonline.com/72f988bf-86f1-41af-91ab-2d7cd011db47/federationmetadata/2007-06/federationmetadata.xml',
      samlEntityId: 'https://contoso-retail.com/saml2',
      acsUrl: 'https://app.edimp.io/api/auth/sso/saml/acs',
      x509CertFingerprint: '11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00',
      samlCertExpiryDate: '2026-08-22',
      oidcDiscoveryUrl: '',
      issuerUrl: 'https://sts.windows.net/72f988bf-86f1-41af-91ab-2d7cd011db47/',
      clientId: 'contoso-sso-app-id-998',
      clientSecret: 'secret_entra_id_554433221100',
      scopes: 'openid email profile',
      lastTestedAt: '2026-08-08 09:15',
      testStatus: 'PASSED' as 'PASSED' | 'FAILED' | 'NEVER',
      mappedRole: 'Customer Administrator',
    },
    {
      id: 'sso-cust-03',
      customerId: 'cust-103',
      customerName: 'Nordic Retail Group',
      customerCode: 'NRG-003',
      protocol: 'SAML2' as 'SAML2' | 'OIDC',
      status: 'Testing' as 'Active' | 'Testing' | 'Disabled',
      connectionStatus: 'Pending' as 'Verified' | 'Error' | 'Pending',
      domain: 'nordicretail.com',
      samlMetadataUrl: 'https://sso.nordicretail.com/idp/shibboleth/metadata',
      samlEntityId: 'urn:edimp:sp:nordic-retail',
      acsUrl: 'https://app.edimp.io/api/auth/sso/saml/acs',
      x509CertFingerprint: '44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33',
      oidcDiscoveryUrl: '',
      issuerUrl: '',
      clientId: '',
      clientSecret: '',
      scopes: '',
      lastTestedAt: '2026-08-05 18:40',
      testStatus: 'PASSED' as 'PASSED' | 'FAILED' | 'NEVER',
      mappedRole: 'Migration Analyst',
    },
  ]);

  // Automatic page load connection verification check for configured SSO providers
  useEffect(() => {
    const timer = setTimeout(() => {
      setPartnerSsoConfigs((prev) =>
        prev.map((prov) => {
          const targetUrl = prov.protocol === 'SAML2' ? prov.samlMetadataUrl : prov.oidcDiscoveryUrl;
          let vStatus: 'Verified' | 'Error' | 'Pending' = 'Verified';

          if (!targetUrl || targetUrl.trim() === '') {
            vStatus = 'Error';
          } else if (prov.status === 'Disabled') {
            vStatus = 'Error';
          } else if (prov.status === 'Testing') {
            vStatus = 'Pending';
          } else {
            vStatus = 'Verified';
          }

          return {
            ...prov,
            connectionStatus: vStatus,
          };
        })
      );
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  const [ssoSelectedCustId, setSsoSelectedCustId] = useState<string>('cust-101');
  const [ssoFormProtocol, setSsoFormProtocol] = useState<'SAML2' | 'OIDC'>('OIDC');
  const [ssoFormDomain, setSsoFormDomain] = useState('acme-corp.com');
  const [ssoFormSamlMetadataUrl, setSsoFormSamlMetadataUrl] = useState('https://idp.acme-corp.com/federationmetadata/2007-06/federationmetadata.xml');
  const [ssoFormSamlEntityId, setSsoFormSamlEntityId] = useState('urn:edimp:sp:acme-corp');
  const [ssoFormAcsUrl, setSsoFormAcsUrl] = useState('https://app.edimp.io/api/auth/sso/saml/acs');
  const [ssoFormX509Cert, setSsoFormX509Cert] = useState('9A:8B:7C:6D:5E:4F:3A:2B:1C:0D:9E:8F:7A:6B:5C:4D');

  const [ssoFormOidcDiscoveryUrl, setSsoFormOidcDiscoveryUrl] = useState('https://acme.okta.com/oauth2/default/.well-known/openid-configuration');
  const [ssoFormIssuerUrl, setSsoFormIssuerUrl] = useState('https://acme.okta.com/oauth2/default');
  const [ssoFormClientId, setSsoFormClientId] = useState('0oae189x09XzMkp097');
  const [ssoFormClientSecret, setSsoFormClientSecret] = useState('secret_live_okta_981273912389172391');
  const [ssoFormShowSecret, setSsoFormShowSecret] = useState(false);
  const [ssoFormScopes, setSsoFormScopes] = useState('openid profile email groups');

  // Interactive Live Testing State
  const [isTestingSsoHandshake, setIsTestingSsoHandshake] = useState(false);
  const [ssoTestingStep, setSsoTestingStep] = useState(0); // 0 = idle, 1 = fetching, 2 = parsing, 3 = cert check, 4 = complete
  const [ssoTestingLogs, setSsoTestingLogs] = useState<string[]>([]);

  // Connectivity Ping State
  const [isPingingSsoUrl, setIsPingingSsoUrl] = useState(false);
  const [ssoPingResult, setSsoPingResult] = useState<{
    url: string;
    protocol: 'SAML2' | 'OIDC';
    status: 'SUCCESS' | 'ERROR';
    httpStatus: number;
    latencyMs: number;
    contentType: string;
    details: string;
    verifiedAt: string;
  } | null>(null);

  const handleVerifySsoConnection = (protocolOverride?: 'SAML2' | 'OIDC') => {
    const targetProtocol = protocolOverride || ssoFormProtocol;
    const targetUrl = targetProtocol === 'SAML2' ? ssoFormSamlMetadataUrl.trim() : ssoFormOidcDiscoveryUrl.trim();

    if (!targetUrl) {
      showToast(`⚠️ Please enter a valid ${targetProtocol === 'SAML2' ? 'SAML Metadata URL' : 'OIDC Discovery Endpoint URL'} to verify.`);
      return;
    }

    setIsPingingSsoUrl(true);
    setSsoPingResult(null);

    const startTime = performance.now();

    setTimeout(() => {
      const elapsedMs = Math.round(performance.now() - startTime + Math.random() * 20 + 15);
      const nowStr = new Date().toLocaleTimeString();

      if (targetProtocol === 'SAML2') {
        const isXml = targetUrl.toLowerCase().includes('.xml') || targetUrl.toLowerCase().includes('metadata') || targetUrl.startsWith('http');
        setPartnerSsoConfigs((prev) =>
          prev.map((sso) =>
            sso.customerId === ssoSelectedCustId
              ? { ...sso, connectionStatus: isXml ? 'Verified' : 'Error' }
              : sso
          )
        );
        if (isXml) {
          setSsoPingResult({
            url: targetUrl,
            protocol: 'SAML2',
            status: 'SUCCESS',
            httpStatus: 200,
            latencyMs: elapsedMs,
            contentType: 'application/xml; charset=utf-8',
            details: `HTTP/2 200 OK — SAML EntityDescriptor XML payload retrieved. Validated X.509 signature & ACS bindings over TLS 1.3.`,
            verifiedAt: nowStr,
          });
          showToast(`✅ SAML Metadata Connection Ping Succeeded! HTTP 200 OK (${elapsedMs}ms)`);
        } else {
          setSsoPingResult({
            url: targetUrl,
            protocol: 'SAML2',
            status: 'ERROR',
            httpStatus: 404,
            latencyMs: elapsedMs,
            contentType: 'text/html',
            details: `HTTP/2 404 Not Found — Invalid SAML EntityDescriptor XML document at specified endpoint URL.`,
            verifiedAt: nowStr,
          });
          showToast(`❌ SAML Connection Ping Failed: Endpoint returned 404 Not Found`);
        }
      } else {
        const isOidc = targetUrl.toLowerCase().includes('openid-configuration') || targetUrl.toLowerCase().includes('oauth2') || targetUrl.startsWith('http');
        setPartnerSsoConfigs((prev) =>
          prev.map((sso) =>
            sso.customerId === ssoSelectedCustId
              ? { ...sso, connectionStatus: isOidc ? 'Verified' : 'Error' }
              : sso
          )
        );
        if (isOidc) {
          setSsoPingResult({
            url: targetUrl,
            protocol: 'OIDC',
            status: 'SUCCESS',
            httpStatus: 200,
            latencyMs: elapsedMs,
            contentType: 'application/json; charset=utf-8',
            details: `HTTP/2 200 OK — OpenID Provider Metadata JSON retrieved. Verified authorization_endpoint, token_endpoint, and jwks_uri.`,
            verifiedAt: nowStr,
          });
          showToast(`✅ OIDC Discovery Connection Ping Succeeded! HTTP 200 OK (${elapsedMs}ms)`);
        } else {
          setSsoPingResult({
            url: targetUrl,
            protocol: 'OIDC',
            status: 'ERROR',
            httpStatus: 400,
            latencyMs: elapsedMs,
            contentType: 'application/json',
            details: `HTTP/2 400 Bad Request — Unable to locate valid OpenID Configuration document.`,
            verifiedAt: nowStr,
          });
          showToast(`❌ OIDC Connection Ping Failed: Endpoint returned 400 Bad Request`);
        }
      }
      setIsPingingSsoUrl(false);
    }, 700);
  };

  // Select customer to populate form
  const handleSelectCustomerForSso = (cId: string) => {
    setSsoSelectedCustId(cId);
    const existing = partnerSsoConfigs.find((s) => s.customerId === cId);
    if (existing) {
      setSsoFormProtocol(existing.protocol);
      setSsoFormDomain(existing.domain);
      setSsoFormSamlMetadataUrl(existing.samlMetadataUrl || '');
      setSsoFormSamlEntityId(existing.samlEntityId || `urn:edimp:sp:${existing.domain.replace(/\./g, '-')}`);
      setSsoFormAcsUrl(existing.acsUrl || 'https://app.edimp.io/api/auth/sso/saml/acs');
      setSsoFormX509Cert(existing.x509CertFingerprint || '9A:8B:7C:6D:5E:4F:3A:2B:1C:0D:9E:8F:7A:6B:5C:4D');
      setSsoFormOidcDiscoveryUrl(existing.oidcDiscoveryUrl || '');
      setSsoFormIssuerUrl(existing.issuerUrl || '');
      setSsoFormClientId(existing.clientId || '');
      setSsoFormClientSecret(existing.clientSecret || '');
      setSsoFormScopes(existing.scopes || 'openid profile email groups');
    } else {
      const custObj = customers.find((c) => c.id === cId);
      const domain = custObj ? `${custObj.name.toLowerCase().replace(/[^a-z]/g, '')}.com` : 'company.com';
      setSsoFormProtocol('OIDC');
      setSsoFormDomain(domain);
      setSsoFormSamlMetadataUrl(`https://idp.${domain}/federationmetadata/2007-06/federationmetadata.xml`);
      setSsoFormSamlEntityId(`urn:edimp:sp:${domain.replace(/\./g, '-')}`);
      setSsoFormAcsUrl('https://app.edimp.io/api/auth/sso/saml/acs');
      setSsoFormX509Cert('A1:B2:C3:D4:E5:F6:11:22:33:44:55:66:77:88:99:00');
      setSsoFormOidcDiscoveryUrl(`https://auth.${domain}/.well-known/openid-configuration`);
      setSsoFormIssuerUrl(`https://auth.${domain}`);
      setSsoFormClientId(`client-id-${Math.floor(Math.random() * 100000)}`);
      setSsoFormClientSecret('secret_' + Math.random().toString(36).substring(2));
      setSsoFormScopes('openid profile email groups');
    }
    setSsoTestingStep(0);
    setSsoTestingLogs([]);
  };

  // Run live SAML metadata or OIDC discovery test
  const handleRunSsoTestHandshake = () => {
    setIsTestingSsoHandshake(true);
    setSsoTestingStep(1);
    const targetUrl = ssoFormProtocol === 'SAML2' ? ssoFormSamlMetadataUrl : ssoFormOidcDiscoveryUrl;
    
    setSsoTestingLogs([
      `[INIT] Dispatching HTTP GET request to Identity Provider endpoint: ${targetUrl || 'Default Endpoint'}...`,
      `[TLS_HANDSHAKE] Establishing TLS 1.3 encrypted tunnel (Cipher: ECDHE-RSA-AES128-GCM-SHA256)...`,
    ]);

    setTimeout(() => {
      setSsoTestingStep(2);
      if (ssoFormProtocol === 'SAML2') {
        setSsoTestingLogs((prev) => [
          ...prev,
          `[HTTP_200] Successfully fetched SAML 2.0 EntityDescriptor XML payload (Content-Type: application/xml).`,
          `[XML_PARSER] Root EntityID parsed: "${ssoFormSamlEntityId || 'urn:edimp:sp:customer'}"`,
          `[IDP_ENDPOINTS] SingleSignOnService Binding parsed: HTTP-POST -> ${ssoFormSamlMetadataUrl.replace('federationmetadata/2007-06/federationmetadata.xml', 'saml2/sso')}`,
          `[IDP_ENDPOINTS] SingleLogoutService Binding parsed: HTTP-Redirect -> ${ssoFormSamlMetadataUrl.replace('federationmetadata/2007-06/federationmetadata.xml', 'saml2/slo')}`,
        ]);
      } else {
        setSsoTestingLogs((prev) => [
          ...prev,
          `[HTTP_200] Received OpenID Provider Metadata JSON document.`,
          `[OIDC_DISCOVERY] Issuer URL verified: "${ssoFormIssuerUrl || 'https://auth.company.com'}"`,
          `[OIDC_ENDPOINTS] authorization_endpoint: ${ssoFormIssuerUrl}/v1/authorize`,
          `[OIDC_ENDPOINTS] token_endpoint: ${ssoFormIssuerUrl}/v1/token`,
          `[OIDC_ENDPOINTS] userinfo_endpoint: ${ssoFormIssuerUrl}/v1/userinfo`,
          `[OIDC_ENDPOINTS] jwks_uri: ${ssoFormIssuerUrl}/v1/keys`,
        ]);
      }
    }, 1000);

    setTimeout(() => {
      setSsoTestingStep(3);
      setSsoTestingLogs((prev) => [
        ...prev,
        `[SECURITY_AUDIT] Validating X.509 Certificate Chain / JWKS RS256 Key Pair...`,
        `[CERT_STATUS] X.509 Certificate Valid (Fingerprint: ${ssoFormX509Cert.substring(0, 14)}..., Expiry: 2028-11-20).`,
        `[CLAIMS_MAP] Claim mapping verified: NameID / email -> "contact@${ssoFormDomain}", Role -> "Customer Administrator".`,
      ]);
    }, 2100);

    setTimeout(() => {
      setSsoTestingStep(4);
      setSsoTestingLogs((prev) => [
        ...prev,
        `[SUCCESS] SSO Handshake & Metadata Validation Completed with ZERO errors!`,
        `[READY] Enterprise Identity Provider is now fully operational and ready for single sign-on requests.`,
      ]);
      setIsTestingSsoHandshake(false);

      // Save/Update in partnerSsoConfigs
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
      setPartnerSsoConfigs((prev) => {
        const custObj = customers.find((c) => c.id === ssoSelectedCustId);
        const exists = prev.find((s) => s.customerId === ssoSelectedCustId);
        if (exists) {
          return prev.map((s) =>
            s.customerId === ssoSelectedCustId
              ? {
                  ...s,
                  protocol: ssoFormProtocol,
                  domain: ssoFormDomain,
                  samlMetadataUrl: ssoFormSamlMetadataUrl,
                  samlEntityId: ssoFormSamlEntityId,
                  acsUrl: ssoFormAcsUrl,
                  x509CertFingerprint: ssoFormX509Cert,
                  oidcDiscoveryUrl: ssoFormOidcDiscoveryUrl,
                  issuerUrl: ssoFormIssuerUrl,
                  clientId: ssoFormClientId,
                  clientSecret: ssoFormClientSecret,
                  scopes: ssoFormScopes,
                  lastTestedAt: nowStr,
                  testStatus: 'PASSED',
                  connectionStatus: 'Verified' as const,
                }
              : s
          );
        } else {
          const newEntry = {
            id: `sso-cust-${Date.now()}`,
            customerId: ssoSelectedCustId,
            customerName: custObj?.name || 'Customer Account',
            customerCode: custObj?.code || 'CUST',
            protocol: ssoFormProtocol,
            status: 'Active' as const,
            connectionStatus: 'Verified' as const,
            domain: ssoFormDomain,
            samlMetadataUrl: ssoFormSamlMetadataUrl,
            samlEntityId: ssoFormSamlEntityId,
            acsUrl: ssoFormAcsUrl,
            x509CertFingerprint: ssoFormX509Cert,
            oidcDiscoveryUrl: ssoFormOidcDiscoveryUrl,
            issuerUrl: ssoFormIssuerUrl,
            clientId: ssoFormClientId,
            clientSecret: ssoFormClientSecret,
            scopes: ssoFormScopes,
            lastTestedAt: nowStr,
            testStatus: 'PASSED' as const,
            mappedRole: 'Customer Administrator',
          };
          return [newEntry, ...prev];
        }
      });

      showToast(`⚡ SAML / OIDC Endpoint Test Succeeded! Configuration updated and verified for @${ssoFormDomain}.`);
    }, 3200);
  };

  // Calculate storage quota info for a customer
  const getCustomerQuotaInfo = (c: PartnerCustomer) => {
    const tenant = tenants.find((t) => t.customerId === c.id || t.customerName === c.name);
    const quotaTb = tenant ? tenant.storageAllocatedTb : c.tier === 'Enterprise' ? 50 : 30;
    const usedTb = tenant ? Math.max(tenant.storageUsedTb, c.dataMigratedTb) : c.dataMigratedTb;
    const pctUsed = Math.min(100, Math.round((usedTb / (quotaTb || 1)) * 100));
    const isNearingLimit = pctUsed >= storageAlertThresholdPct;
    return { quotaTb, usedTb, pctUsed, isNearingLimit, tenant };
  };

  const customersNearingLimit = customers.filter((c) => getCustomerQuotaInfo(c).isNearingLimit);

  // Send Manual Storage Warning Email for a specific customer
  const sendManualStorageWarningEmail = (customer: PartnerCustomer) => {
    const info = getCustomerQuotaInfo(customer);
    const newLog: StorageAlertLog = {
      id: `alt-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      customerName: customer.name,
      customerCode: customer.code,
      storageUsedTb: info.usedTb,
      storageQuotaTb: info.quotaTb,
      pctUsed: info.pctUsed,
      recipients: [customer.contactEmail, customer.accountManager],
      status: 'Delivered',
      channel: 'Email & System',
    };
    setStorageAlertLogs((prev) => [newLog, ...prev]);
    showToast(`📧 Storage Warning Email sent to ${customer.contactEmail} (${info.pctUsed}% used)`);
  };

  // Run full automated audit across all customers
  const triggerStorageAuditAndAlerts = () => {
    let count = 0;
    const newLogs: StorageAlertLog[] = [];

    customers.forEach((c) => {
      const info = getCustomerQuotaInfo(c);
      if (info.isNearingLimit) {
        count++;
        newLogs.push({
          id: `alt-${Date.now()}-${c.code}`,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          customerName: c.name,
          customerCode: c.code,
          storageUsedTb: info.usedTb,
          storageQuotaTb: info.quotaTb,
          pctUsed: info.pctUsed,
          recipients: [c.contactEmail, c.accountManager],
          status: 'Delivered',
          channel: enableSlackAlerts ? 'Email & System' : 'Email',
        });
      }
    });

    if (count > 0) {
      setStorageAlertLogs((prev) => [...newLogs, ...prev]);
      showToast(`⚡ Storage Audit Complete: Dispatched ${count} automated warning email(s)!`);
    } else {
      showToast(`✅ Audit Complete: All customers are within safe storage limits (<${storageAlertThresholdPct}%).`);
    }
  };

  // Real-time telemetry pulse effect
  useEffect(() => {
    if (!isLiveStreaming) return;

    const interval = setInterval(() => {
      const nextThroughput = +(3.8 + Math.random() * 1.6).toFixed(2);
      const nextCdcOps = Math.floor(17000 + Math.random() * 5000);
      const timeStr = new Date().toLocaleTimeString();

      setLiveThroughputGbSec(nextThroughput);
      setLiveCdcOpsSec(nextCdcOps);
      setLastLiveUpdate(timeStr);

      setCustomers((prev) =>
        prev.map((c) => {
          if (c.deploymentStage === 'Live Migration' || c.deploymentStage === 'Managed Services' || (c.deploymentStage as any) === 'Onboarding') {
            const increment = +(0.01 + Math.random() * 0.03).toFixed(2);
            const updatedData = +(c.dataMigratedTb + increment).toFixed(2);
            const updatedHealth = Math.min(100, Math.max(88, +(c.healthScore + (Math.random() * 0.4 - 0.2)).toFixed(1)));
            const updatedCust = {
              ...c,
              dataMigratedTb: updatedData,
              healthScore: updatedHealth,
            };

            // If selected workspace modal is open for this customer, update modal state
            if (selectedCustomerWorkspace && selectedCustomerWorkspace.id === c.id) {
              setSelectedCustomerWorkspace(updatedCust);
            }

            return updatedCust;
          }
          return c;
        })
      );

      // Occasionally dispatch a real-time activity log event (10% chance per tick)
      if (Math.random() < 0.12 && customers.length > 0) {
        const randomCust = customers[Math.floor(Math.random() * customers.length)];
        const isMigrationType = Math.random() > 0.5;
        if (isMigrationType) {
          const newEvt: LiveActivityEvent = {
            id: `act-${Date.now()}`,
            timestamp: `Just now (${timeStr})`,
            customerId: randomCust.id,
            customerName: randomCust.name,
            customerCode: randomCust.code,
            partnerId: randomCust.partnerId,
            partnerName: randomCust.partnerName || 'Avanade',
            eventType: 'MIGRATION_START',
            severity: 'success',
            title: 'Real-Time CDC Micro-Batch Catchup Completed',
            description: `Stream processor synchronized 12,400 delta change records for ${randomCust.erpEcosystem} CDC staging table.`,
            actor: 'CDC Engine Worker',
            actorRole: 'System Auto-Provisioner',
            metadata: {
              'Pipeline Rate': `${nextThroughput} GB/s`,
              'CDC Ops/sec': `${nextCdcOps.toLocaleString()}`,
              'Target DB': `${randomCust.region}`,
            },
          };
          setLiveActivityEvents((prev) => [newEvt, ...prev].slice(0, 100));
        }
      }

      // Keep Partner totalDataMigratedTb in sync with customer data increments
      setPartners((prevPartners) =>
        prevPartners.map((p) => {
          const partnerCusts = customers.filter((c) => c.partnerId === p.id);
          const totalTb = partnerCusts.reduce((sum, c) => sum + c.dataMigratedTb, 0);
          return {
            ...p,
            totalDataMigratedTb: +totalTb.toFixed(1),
          };
        })
      );
    }, 2500);

    return () => clearInterval(interval);
  }, [isLiveStreaming, selectedCustomerWorkspace, customers]);

  // Handle Register Partner Organization
  const handleCreatePartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartner.name) return;

    const partnerId = `partner-${Date.now()}`;
    const created: PartnerOrganization = {
      id: partnerId,
      name: newPartner.name,
      code: newPartner.code || `PTR-${Math.floor(100 + Math.random() * 900)}`,
      tier: newPartner.tier,
      region: newPartner.region,
      accountManager: newPartner.accountManager || 'Partner Success Director',
      contactEmail: newPartner.contactEmail || `partners@${newPartner.name.toLowerCase().replace(/[^a-z]/g, '')}.com`,
      logoPreset: newPartner.logoPreset,
      primaryColorHex: newPartner.primaryColorHex,
      accentColorHex: newPartner.accentColorHex,
      themeMode: newPartner.themeMode,
      activeCustomersCount: 0,
      totalMrr: 0,
      totalDataMigratedTb: 0,
      status: 'Active',
      cnameDomain: newPartner.cnameDomain || `migration.${newPartner.name.toLowerCase().replace(/[^a-z]/g, '')}.com`,
    };

    setPartners((prev) => [created, ...prev]);
    setShowAddPartnerModal(false);
    showToast(`🎉 Partner Organization "${created.name}" onboarded & isolated!`);
    handleSelectPartner(partnerId);
  };

  // Handle Onboard Customer
  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.contactEmail) return;

    const assignedPartner = partners.find((p) => p.id === newCustomer.partnerId) || partners[0];
    const finalMrr = calculateNewCustomerMrr();

    const created: PartnerCustomer = {
      id: `cust-${Date.now()}`,
      partnerId: assignedPartner.id,
      partnerName: assignedPartner.name,
      name: newCustomer.name,
      code: newCustomer.code || `CUST-${Math.floor(100 + Math.random() * 900)}`,
      erpEcosystem: newCustomer.erpEcosystem,
      tier: newCustomer.tier,
      accountManager: `${newCustomer.contactName || 'Partner Lead'} (${assignedPartner.name})`,
      contactName: newCustomer.contactName || 'Primary Admin',
      contactEmail: newCustomer.contactEmail,
      region: newCustomer.region,
      deploymentStage: 'Pre-Flight',
      healthScore: 98.5,
      dataMigratedTb: 0,
      activeJobs: 1,
      tenantId: `tenant-pending-${Date.now()}`,
      assignedLicenses: 5,
      mrrAmount: finalMrr,
      contractRenewalDate: '2027-04-01',
      status: 'Onboarding',
    };

    setCustomers((prev) => [created, ...prev]);
    pushActivityEvent(
      'CONFIG_CHANGE',
      'New Partner Customer Account Onboarded',
      `Customer ${created.name} onboarded under ${assignedPartner.name} with ${created.tier} tier plan ($${finalMrr.toLocaleString()}/mo).`,
      created,
      created.contactName || 'Partner Admin',
      userRole,
      {
        'Tier': created.tier,
        'MRR': `$${finalMrr.toLocaleString()}/mo`,
        'ERP System': created.erpEcosystem,
        'Region': created.region,
      },
      'info'
    );
    setShowAddCustomerModal(false);

    showToast(
      `🎉 New customer "${created.name}" onboarded under ${assignedPartner.name}! Tier: ${created.tier} ($${finalMrr.toLocaleString()}/mo)`
    );
    setNewCustomer({
      partnerId: assignedPartner.id,
      name: '',
      code: '',
      erpEcosystem: 'Microsoft Dynamics 365',
      tier: 'Enterprise',
      accountManager: 'Marcus Vance (Partner Team)',
      contactName: '',
      contactEmail: '',
      region: 'North America',
      mrrAmount: 18500,
      billingCycle: 'Monthly',
      paymentMethod: 'Corporate PO / Invoice',
      poNumber: '',
      taxId: '',
      selectedAddons: ['priority_sla', 'anonymization'],
    });
  };

  // Handle Provision Tenant
  const handleProvisionTenant = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProvisioning(true);
    setProvisionProgress(10);
    setProvisionStepText('Initializing Cloud Infrastructure...');

    const interval = setInterval(() => {
      setProvisionProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          setTimeout(() => {
            setIsProvisioning(false);
            setShowProvisionTenantModal(false);
            
            const targetCustomer = customers.find((c) => c.id === newTenant.customerId);

            const createdTenant: PartnerTenant = {
              id: `tenant-${Date.now()}`,
              partnerId: targetCustomer?.partnerId || selectedPartnerId === 'ALL' ? 'partner-avanade' : selectedPartnerId,
              partnerName: targetCustomer?.partnerName || 'Avanade Global',
              tenantName: newTenant.tenantName || `${targetCustomer?.code || 'CUST'}-Cluster-01`,
              customerId: newTenant.customerId,
              customerName: targetCustomer?.name || 'Partner Customer',
              cloudRegion: newTenant.cloudRegion,
              instanceType: newTenant.instanceType,
              allocatedNodes: newTenant.allocatedNodes,
              allocatedMemoryGb: newTenant.allocatedNodes * 8,
              cpuUtilizationPct: 15,
              storageAllocatedTb: newTenant.storageAllocatedTb,
              storageUsedTb: 0.1,
              erpConnectorsActive: [
                targetCustomer?.erpEcosystem || 'Microsoft Dynamics 365',
                'Azure Data Lake Gen2',
              ],
              status: 'Active',
              provisionedAt: new Date().toISOString().split('T')[0],
              cnameDomain: `migration.${(targetCustomer?.name || 'customer').toLowerCase().replace(/[^a-z]/g, '')}.partner.com`,
            };

            setTenants((prevTenants) => [createdTenant, ...prevTenants]);
            if (targetCustomer) {
              pushActivityEvent(
                'CLUSTER_PROVISION',
                'Isolated Customer Tenant Cluster Provisioned',
                `Dedicated Kubernetes cluster ${createdTenant.tenantName} (${createdTenant.allocatedNodes} nodes) provisioned in ${createdTenant.cloudRegion}.`,
                targetCustomer,
                'System Auto-Provisioner',
                'System Auto-Provisioner',
                {
                  'Cluster ID': createdTenant.id,
                  'Region': createdTenant.cloudRegion,
                  'Allocated Nodes': createdTenant.allocatedNodes,
                  'RAM Capacity': `${createdTenant.allocatedMemoryGb} GB`,
                },
                'success'
              );
            }
            showToast(`Tenant "${createdTenant.tenantName}" provisioned successfully!`);

          }, 800);
          return 100;
        }

        if (prev === 25) setProvisionStepText('Configuring ERP Connectors & Security Policies...');
        if (prev === 55) setProvisionStepText('Allocating CDC Stream Workers & Memory...');
        if (prev === 80) setProvisionStepText('Issuing TLS Certificate & Verifying Domain CNAME...');
        return prev + 15;
      });
    }, 400);
  };

  // RBAC Permission Check Helper
  const checkPermission = (permKey: keyof RolePermissions, actionTitle: string): boolean => {
    if (!currentPermissions[permKey]) {
      showToast(`🔒 Access Restricted: ${actionTitle} requires higher permissions than '${userRole}'.`);
      return false;
    }
    return true;
  };

  // Derived Partner Collections based on Isolation Filter & Support RBAC Scope
  const activePartnerObj = partners.find((p) => p.id === selectedPartnerId);

  let rawDisplayCustomers = selectedPartnerId === 'ALL'
    ? customers
    : customers.filter((c) => c.partnerId === selectedPartnerId);

  if (userRole === 'Partner Support' && supportAssignedOnly) {
    rawDisplayCustomers = rawDisplayCustomers.filter((c) => assignedSupportCustomerIds.includes(c.id));
  }

  const displayCustomers = rawDisplayCustomers;

  let rawDisplayTenants = selectedPartnerId === 'ALL'
    ? tenants
    : tenants.filter((t) => t.partnerId === selectedPartnerId);

  if (userRole === 'Partner Support' && supportAssignedOnly) {
    rawDisplayTenants = rawDisplayTenants.filter((t) => assignedSupportCustomerIds.includes(t.customerId));
  }

  const displayTenants = rawDisplayTenants;

  const displayLicenseAssignments = selectedPartnerId === 'ALL'
    ? licenseAssignments
    : licenseAssignments.filter((la) => la.partnerId === selectedPartnerId);

  // Filter Customers
  const filteredCustomers = displayCustomers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contactEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.partnerName && c.partnerName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesErp = erpFilter === 'All' || c.erpEcosystem === erpFilter;
    const matchesStage = stageFilter === 'All' || c.deploymentStage === stageFilter;
    return matchesSearch && matchesErp && matchesStage;
  });

  // Calculations
  const totalCustomersCount = displayCustomers.length;
  const totalMigratedTb = displayCustomers.reduce((acc, c) => acc + c.dataMigratedTb, 0).toFixed(1);
  const totalActiveJobs = displayCustomers.reduce((acc, c) => acc + c.activeJobs, 0);
  const totalMrr = displayCustomers.reduce((acc, c) => acc + c.mrrAmount, 0);
  const avgHealth = (displayCustomers.reduce((acc, c) => acc + c.healthScore, 0) / (displayCustomers.length || 1)).toFixed(1);

  // Render Access Denied Card when user role lacks required permissions for a sub tab
  const renderAccessDeniedScreen = (featureTitle: string, requiredPerm: string, allowedRoles: UserRole[]) => (
    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl text-center space-y-6 max-w-2xl mx-auto my-12 animate-in fade-in zoom-in-95">
      <div className="w-16 h-16 bg-amber-100 rounded-3xl flex items-center justify-center mx-auto text-amber-600 shadow-inner">
        <ShieldAlert className="w-9 h-9" />
      </div>

      <div className="space-y-2">
        <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200 text-xs font-mono font-extrabold uppercase tracking-wider">
          Fine-Grained RBAC Policy Protection
        </span>
        <h3 className="text-xl font-black text-slate-900">Access Restricted: {featureTitle}</h3>
        <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
          Your current session role (<strong className="text-indigo-600 font-bold">{userRole}</strong>) is restricted from accessing this administrative module under fine-grained security policies.
        </p>
      </div>

      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs font-mono space-y-2">
        <div className="flex justify-between items-center text-[11px] text-slate-600">
          <span>Required Privilege:</span>
          <span className="font-extrabold text-slate-900">{requiredPerm}</span>
        </div>
        <div className="flex justify-between items-center text-[11px] text-slate-600">
          <span>Authorized Role(s):</span>
          <span className="font-extrabold text-indigo-600">{allowedRoles.join(', ')}</span>
        </div>
        <div className="flex justify-between items-center text-[11px] text-slate-600">
          <span>Active Session Role:</span>
          <span className="font-extrabold text-amber-600">{userRole}</span>
        </div>
      </div>

      <div className="pt-2 flex items-center justify-center gap-3">
        <button
          onClick={() => setShowRbacMatrixModal(true)}
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
        >
          <Sliders className="w-4 h-4 text-slate-600" />
          <span>Inspect RBAC Matrix</span>
        </button>

        {allowedRoles.length > 0 && (
          <button
            onClick={() => {
              setUserRole(allowedRoles[0]);
              showToast(`🎉 Role Switched to '${allowedRoles[0]}'! Access Granted.`);
            }}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Switch to {allowedRoles[0]} Role</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-indigo-600 text-white font-bold text-xs px-4 py-3 rounded-2xl shadow-sm border border-indigo-400 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Multi-Partner Workspace & Isolation Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col xl:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap w-full xl:w-auto">
          <div className="flex items-center gap-2 text-indigo-600 font-extrabold text-xs uppercase font-mono tracking-wider shrink-0">
            <Building2 className="w-4 h-4 text-indigo-600 animate-pulse" />
            <span>Active Partner Context:</span>
          </div>

          {/* Partner Selector Dropdown */}
          <div className="relative flex-1 sm:w-72">
            <select
              value={selectedPartnerId}
              onChange={(e) => handleSelectPartner(e.target.value)}
              className="w-full bg-white text-slate-900 font-bold text-xs py-2 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm"
            >
              <option value="ALL">🌐 ALL PARTNERS (Global Multi-Partner Ecosystem View)</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  🏢 {p.name} ({p.code}) — {p.tier}
                </option>
              ))}
            </select>
          </div>

          {/* Security Boundary Badge */}
          {selectedPartnerId === 'ALL' ? (
            <span className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-bold flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-indigo-600" />
              Viewing All {partners.length} Partners ({customers.length} Total Customers)
            </span>
          ) : (
            <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              Strict Data Isolation Active: {activePartnerObj?.name} ({displayCustomers.length} Customers)
            </span>
          )}
        </div>

        {/* Role-Based Access Control (RBAC) Switcher & Safeguards */}
        <div className="flex items-center gap-3 flex-wrap w-full xl:w-auto shrink-0 justify-end border-t xl:border-t-0 xl:border-l border-slate-200 pt-3 xl:pt-0 xl:pl-4">
          <div className="flex items-center gap-1.5 text-amber-600 font-extrabold text-xs font-mono uppercase tracking-wider shrink-0">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>Active Role:</span>
          </div>

          <select
            value={userRole}
            onChange={(e) => {
              const newRole = e.target.value as UserRole;
              setUserRole(newRole);
              showToast(`🔒 Role Switched to '${newRole}'. Permissions updated.`);
            }}
            className="bg-white text-amber-300 font-black text-xs py-2 px-3 rounded-xl border border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer shadow-inner"
          >
            <option value="Partner Admin">👑 Partner Admin (Full Privileges)</option>
            <option value="Partner Analyst">📊 Partner Analyst (Read-Only Analytics)</option>
            <option value="Partner Support">🛠️ Partner Support (Operational Support)</option>
          </select>

          {/* RBAC Policy Matrix Modal Button */}
          <button
            onClick={() => setShowRbacMatrixModal(true)}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-100 flex items-center gap-1.5 transition-all cursor-pointer"
            title="Inspect Role-Based Access Control Policy Matrix"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-600" />
            <span>RBAC Matrix</span>
          </button>

          {/* Support Project Scope Filter Toggle (Support Role Only) */}
          {userRole === 'Partner Support' && (
            <button
              onClick={() => {
                setSupportAssignedOnly(!supportAssignedOnly);
                showToast(
                  !supportAssignedOnly
                    ? `🎯 Scope Filtered to ${assignedSupportCustomerIds.length} Assigned Customer Projects`
                    : `🌐 Showing All Ecosystem Customer Projects`
                );
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                supportAssignedOnly
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-md'
                  : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>{supportAssignedOnly ? 'Assigned Projects (3)' : 'All Projects'}</span>
            </button>
          )}

          <button
            onClick={() => {
              if (checkPermission('canOnboardPartner', 'Registering New Partners')) {
                setShowAddPartnerModal(true);
              }
            }}
            className={`px-3.5 py-2 font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer border ${
              currentPermissions.canOnboardPartner
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-400/40'
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 opacity-80'
            }`}
          >
            {currentPermissions.canOnboardPartner ? <Plus className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5 text-amber-600" />}
            <span>Register New Partner</span>
          </button>
        </div>
      </div>

      {/* Main Banner / Header (EMCC White Theme) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs relative overflow-hidden">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 relative z-10">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="z-10 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="bg-emerald-50 text-emerald-700 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1.5 shadow-3xs">
              <span className={`w-1.5 h-1.5 rounded-full inline-block ${isLiveStreaming ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
              {whiteLabel.partnerTier}
            </span>
            <span className="text-slate-400 text-[11px] font-mono">
              Partner Ecosystem Context: {whiteLabel.partnerName}
            </span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            {whiteLabel.partnerName} Partner Portal
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed font-medium">
            Unified multi-tenant orchestration suite built for Microsoft Dynamics 365, SAP S/4HANA, Oracle Fusion Cloud, and global ERP implementation partners.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 z-10 shrink-0">
          {/* Real-time Data Polling Auto-Refresh Toggle Control (EMCC Style) */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-1.5 rounded-xl shadow-2xs text-xs">
            <div className="flex items-center gap-2 pr-2">
              <button
                onClick={() => setIsLiveStreaming(!isLiveStreaming)}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isLiveStreaming ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
                role="switch"
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isLiveStreaming ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
              <div className="flex flex-col text-left">
                <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1 leading-tight">
                  <Radio className={`w-3 h-3 ${isLiveStreaming ? 'text-indigo-600 animate-pulse' : 'text-slate-400'}`} />
                  Real-Time
                </span>
                <span className="text-[9px] text-slate-500 font-mono tracking-tighter leading-none mt-0.5">
                  {liveThroughputGbSec} GB/s
                </span>
              </div>
            </div>
            
            {/* Action Buttons styled like EMCC */}
            <div className="flex items-center gap-1.5 border-l border-slate-200 pl-2">
              <button
                onClick={() => setShowStorageAlertModal(true)}
                className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-[11px] font-bold border border-amber-200 transition-colors flex items-center gap-1.5"
                title="Configure Alerts"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Alerts
                {customersNearingLimit.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-200 text-amber-900 font-mono text-[9px] font-black">
                    {customersNearingLimit.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  if (checkPermission('canOnboardCustomer', 'Onboard Customer')) {
                    setShowAddCustomerModal(true);
                  }
                }}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  currentPermissions.canOnboardCustomer
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-400 border border-slate-200'
                }`}
              >
                {currentPermissions.canOnboardCustomer ? <Plus className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                Onboard
              </button>

              {onNavigateTab && (
                <button
                  onClick={() => onNavigateTab('billing-management')}
                  className="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                  Billing
                </button>
              )}

              <button
                onClick={() => {
                  if (checkPermission('canProvisionTenant', 'Provision Tenant')) {
                    setShowProvisionTenantModal(true);
                  }
                }}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  currentPermissions.canProvisionTenant
                    ? 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs'
                    : 'bg-slate-50 text-slate-400 border border-slate-200 opacity-80'
                }`}
              >
                {currentPermissions.canProvisionTenant ? <Server className="w-3.5 h-3.5 text-emerald-600" /> : <Lock className="w-3.5 h-3.5" />}
                Provision
              </button>
            </div>
          </div>
        </div>

        </div>
        {/* Sub-Navigation Tabs with Scrollbar */}
        <div className="flex items-center gap-1 mt-6 overflow-x-auto pb-2 pt-2 border-t border-slate-200 hide-scrollbar relative z-10">
          {[
            { id: 'partners', label: 'Partners Directory', icon: Building2, badge: `${partners.length} Partners` },
            { id: 'crm', label: 'Partner Leads CRM', icon: Briefcase, badge: '5 Active' },
            { id: 'customers', label: 'Manage Customers', icon: Users, badge: `${totalCustomersCount}` },
            { id: 'dashboards', label: 'Customer Dashboards', icon: BarChart3 },
            { id: 'tenants', label: 'Tenant Provisioning', icon: Server, badge: `${displayTenants.length}` },
            { id: 'sso', label: 'SSO Management', icon: Globe, badge: 'SAML / OIDC', permKey: 'canManageSso' },
            { id: 'licenses', label: 'License Assignment', icon: KeyRound },
            { id: 'usage', label: 'Usage Reports', icon: Activity },
            {
              id: 'revenue',
              label: 'Revenue Reports',
              icon: DollarSign,
              badge: `$${(totalMrr / 1000).toFixed(0)}k/mo`,
              permKey: 'canViewRevenueReports',
            },
            {
              id: 'whitelabel',
              label: 'White Label Branding',
              icon: Palette,
              badge: 'Live Preview',
              permKey: 'canEditWhiteLabel',
            },
            { id: 'audit', label: 'Migration Audit Trail', icon: ShieldCheck, badge: 'SOC 2 Logs' },
            { id: 'activity', label: 'Live Activity Feed', icon: Radio, badge: 'Live Stream' },
            { id: 'comparison', label: 'Customer Comparison', icon: PieChartIcon, badge: 'D3 Load Analytics' },
          ].map((tab) => {

            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            const isRestricted = tab.permKey && !currentPermissions[tab.permKey as keyof RolePermissions];

            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm font-extrabold border border-indigo-100'
                    : isRestricted
                    ? 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 opacity-80'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : isRestricted ? 'text-amber-600' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {isRestricted ? (
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-mono font-bold flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" /> Restricted
                  </span>
                ) : (
                  tab.badge && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        isActive ? 'bg-indigo-100 text-indigo-800' : 'bg-white text-slate-700'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* CRM TAB */}
      {activeSubTab === 'crm' && (
        <PartnerLeadsCrm />
      )}

      {/* SUB-TAB 0: PARTNERS DIRECTORY & ISOLATION MANAGEMENT */}
      {activeSubTab === 'partners' && (
        <div className="space-y-6">
          {/* Executive Multi-Partner Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-slate-500 text-xs font-bold uppercase font-mono flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-indigo-600" /> Active Implementation Partners
              </span>
              <div className="text-3xl font-black text-slate-900">{partners.length}</div>
              <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> 100% Isolated Sovereign Tenants
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-slate-500 text-xs font-bold uppercase font-mono flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-indigo-600" /> Total Multi-Partner Customers
              </span>
              <div className="text-3xl font-black text-indigo-600">{customers.length}</div>
              <div className="text-[11px] text-slate-500">Separately partitioned customer accounts</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-slate-500 text-xs font-bold uppercase font-mono flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Combined Ecosystem MRR
              </span>
              <div className="text-3xl font-black text-emerald-600">
                ${partners.reduce((sum, p) => sum + p.totalMrr, 0).toLocaleString()}
              </div>
              <div className="text-[11px] text-indigo-600 font-semibold">Reseller Margin ~32.5%</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-slate-500 text-xs font-bold uppercase font-mono flex items-center gap-1">
                <Database className="w-3.5 h-3.5 text-amber-500" /> Total Data Migrated (TB)
              </span>
              <div className="text-3xl font-black text-slate-900">
                {partners.reduce((sum, p) => sum + p.totalDataMigratedTb, 0).toFixed(1)} TB
              </div>
              <div className="text-[11px] text-slate-500">Across SAP, Dynamics, Oracle &amp; Infor</div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Partner Directory &amp; Security Isolation Engine</h3>
                <p className="text-[11px] text-slate-500">
                  Select a partner organization to filter and isolate their customers, tenants, and license pools in real time.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
              <button
                onClick={() => handleSelectPartner('ALL')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                  selectedPartnerId === 'ALL'
                    ? 'bg-white text-slate-900 border-slate-900 shadow-md font-black'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Globe className="w-4 h-4 text-indigo-600" />
                <span>Global Ecosystem View (All)</span>
              </button>
              <button
                onClick={() => setShowAddPartnerModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Onboard New Partner</span>
              </button>
            </div>
          </div>

          {/* Partner Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {partners.map((partner) => {
              const partnerCusts = customers.filter((c) => c.partnerId === partner.id);
              const partnerTenants = tenants.filter((t) => t.partnerId === partner.id);
              const isCurrentlySelected = selectedPartnerId === partner.id;

              return (
                <div
                  key={partner.id}
                  className={`bg-white rounded-2xl border p-6 shadow-xs hover:shadow-lg transition-all space-y-4 relative ${
                    isCurrentlySelected
                      ? 'border-indigo-600 ring-2 ring-indigo-500/30 bg-indigo-50/20'
                      : 'border-slate-200'
                  }`}
                >
                  {/* Top Badge & Tier */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {partner.code}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-200">
                          {partner?.tier ? partner.tier.split(' ')[0] : ''}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-base text-slate-900">{partner.name}</h3>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                        isCurrentlySelected
                          ? 'bg-emerald-500 text-slate-900 shadow-xs'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {isCurrentlySelected ? <Lock className="w-3 h-3 text-slate-900" /> : <Globe className="w-3 h-3 text-slate-500" />}
                      {isCurrentlySelected ? 'Isolated Active' : 'Multi-Tenant'}
                    </span>
                  </div>

                  {/* Partner Metrics Summary */}
                  <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl text-xs">
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-mono block">Customers</span>
                      <span className="font-extrabold text-slate-900 text-sm">{partnerCusts.length} Managed</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-mono block">Tenants</span>
                      <span className="font-extrabold text-indigo-600 text-sm">{partnerTenants.length} Clusters</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-mono block">Data Transferred</span>
                      <span className="font-extrabold text-slate-900 text-sm">{partner.totalDataMigratedTb} TB</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-mono block">Monthly MRR</span>
                      <span className="font-extrabold text-emerald-600 text-sm">${partner.totalMrr.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Contact & CNAME */}
                  <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-500">Account Manager:</span>
                      <span className="font-bold text-slate-800">{partner.accountManager}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-500">CNAME Domain:</span>
                      <span className="font-mono text-indigo-600 font-bold">{partner.cnameDomain}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-500">Region:</span>
                      <span className="font-semibold text-slate-700">{partner.region}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={() => {
                        handleSelectPartner(partner.id);
                        setActiveSubTab('customers');
                      }}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        isCurrentlySelected
                          ? 'bg-emerald-600 text-slate-900 shadow-md'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>{isCurrentlySelected ? 'Viewing Isolated Customers' : 'Isolate & View Workspace'}</span>
                    </button>
                    <button
                      onClick={() => {
                        handleSelectPartner(partner.id);
                        setActiveSubTab('whitelabel');
                      }}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer"
                      title="Edit White-Label Theme & Branding"
                    >
                      <Palette className="w-4 h-4 text-indigo-600" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Partner Isolation Comparison Table */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Partner Data Boundary &amp; Tenant Isolation Matrix
              </h3>
              <span className="text-xs text-slate-500 font-mono">SOC 2 Type II Sovereign Boundaries Enforced</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-mono font-bold uppercase">
                    <th className="pb-3">Partner Organization</th>
                    <th className="pb-3">Code &amp; Tier</th>
                    <th className="pb-3">Region</th>
                    <th className="pb-3">Customers</th>
                    <th className="pb-3">Tenants</th>
                    <th className="pb-3">Total Volume</th>
                    <th className="pb-3">Monthly MRR</th>
                    <th className="pb-3">Isolation Boundary</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {partners.map((p) => {
                    const custCount = customers.filter((c) => c.partnerId === p.id).length;
                    const tenantCount = tenants.filter((t) => t.partnerId === p.id).length;
                    const isSelected = selectedPartnerId === p.id;

                    return (
                      <tr key={p.id} className={`hover:bg-slate-50 ${isSelected ? 'bg-indigo-50/30' : ''}`}>
                        <td className="py-3 font-extrabold text-slate-900">{p.name}</td>
                        <td className="py-3 font-mono font-bold text-slate-600">
                          {p.code} <span className="text-[10px] text-indigo-600">({p?.tier ? p.tier.split(' ')[0] : ''})</span>
                        </td>
                        <td className="py-3 text-slate-700">{p.region}</td>
                        <td className="py-3 font-bold text-slate-900">{custCount} Customers</td>
                        <td className="py-3 font-bold text-indigo-600">{tenantCount} Clusters</td>
                        <td className="py-3 font-mono text-slate-700">{p.totalDataMigratedTb} TB</td>
                        <td className="py-3 font-mono font-bold text-emerald-600">${p.totalMrr.toLocaleString()}</td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 w-max">
                            <Shield className="w-3 h-3 text-emerald-600" /> Isolated VNet
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => {
                              handleSelectPartner(p.id);
                              setActiveSubTab('customers');
                            }}
                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-[11px] shadow-xs cursor-pointer"
                          >
                            Switch Workspace
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 1: MANAGE CUSTOMERS */}
      {activeSubTab === 'customers' && (
        <div className="space-y-6">
          {/* Executive Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-slate-500 text-xs font-bold uppercase font-mono">Managed Customers</span>
              <div className="text-2xl font-black text-slate-900">{totalCustomersCount}</div>
              <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" /> +2 this quarter
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-slate-500 text-xs font-bold uppercase font-mono">Total Volume Migrated</span>
              <div className="text-2xl font-black text-indigo-600">{totalMigratedTb} TB</div>
              <div className="text-[11px] text-slate-500">Across SAP, Dynamics &amp; Oracle</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-slate-500 text-xs font-bold uppercase font-mono">Active Live Migrations</span>
              <div className="text-2xl font-black text-emerald-600">{totalActiveJobs} Jobs</div>
              <div className="text-[11px] text-emerald-600 font-semibold">100% SLA uptime</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-slate-500 text-xs font-bold uppercase font-mono">Total Monthly MRR</span>
              <div className="text-2xl font-black text-slate-900">${totalMrr.toLocaleString()}</div>
              <div className="text-[11px] text-indigo-600 font-semibold">Reseller Margin ~32%</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-slate-500 text-xs font-bold uppercase font-mono">Avg Health Score</span>
              <div className="text-2xl font-black text-emerald-600">{avgHealth}%</div>
              <div className="text-[11px] text-slate-500">Zero open blocker errors</div>
            </div>
          </div>

          {/* Live CDC Telemetry Control Strip for Manage Customers */}
          <div className="bg-white text-slate-900 p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-mono font-bold">
                <Radio className={`w-3.5 h-3.5 text-emerald-600 ${isLiveStreaming ? 'animate-pulse' : ''}`} />
                <span>{isLiveStreaming ? '⚡ Live CDC Telemetry Streaming' : '⏸ Real-Time Stream Paused'}</span>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="text-slate-700">
                  Global Throughput: <strong className="text-emerald-600 font-black">{liveThroughputGbSec} GB/s</strong>
                </span>
                <span className="text-slate-700 hidden sm:inline">
                  CDC Rate: <strong className="text-amber-300 font-black">{liveCdcOpsSec.toLocaleString()} ops/s</strong>
                </span>
                <span className="text-slate-500 text-[11px]">
                  Last Checkpoint: <strong className="text-slate-900">{lastLiveUpdate}</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  setIsLiveStreaming(!isLiveStreaming);
                  showToast(isLiveStreaming ? '⏸ Real-time telemetry streaming paused.' : '▶ Real-time telemetry streaming resumed.');
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                  isLiveStreaming
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                    : 'bg-emerald-600 text-slate-900 border-emerald-500 hover:bg-emerald-500 shadow-xs'
                }`}
              >
                {isLiveStreaming ? <Pause className="w-3.5 h-3.5 text-amber-300" /> : <Play className="w-3.5 h-3.5 text-slate-900" />}
                <span>{isLiveStreaming ? 'Pause Stream' : 'Resume Live Stream'}</span>
              </button>

              <button
                onClick={handleManualSyncPulse}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 border border-indigo-400/50"
              >
                <RefreshCcw className="w-3.5 h-3.5 text-indigo-200" />
                <span>Sync Delta Now</span>
              </button>

              <button
                onClick={() => setShowAddCustomerModal(true)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-white text-slate-900 font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-600" />
                <span>Onboard Customer</span>
              </button>
            </div>
          </div>

          {/* Filter Bar & View Toggle */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search customers, code, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Grid vs Table View Mode Switcher */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
                <button
                  onClick={() => setCustomerViewMode('grid')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    customerViewMode === 'grid'
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span className="hidden sm:inline">Cards</span>
                </button>
                <button
                  onClick={() => setCustomerViewMode('table')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    customerViewMode === 'table'
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Table View"
                >
                  <Table className="w-4 h-4" />
                  <span className="hidden sm:inline">Table</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 overflow-x-auto w-full md:w-auto">
              {/* ERP Ecosystem Filter */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 font-bold">ERP:</span>
                <select
                  value={erpFilter}
                  onChange={(e) => setErpFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700"
                >
                  <option value="All">All ERP Systems</option>
                  <option value="Microsoft Dynamics 365">Microsoft Dynamics 365</option>
                  <option value="SAP S/4HANA">SAP S/4HANA</option>
                  <option value="Oracle Fusion Cloud">Oracle Fusion Cloud</option>
                  <option value="NetSuite ERP">NetSuite ERP</option>
                  <option value="Infor LN">Infor LN</option>
                </select>
              </div>

              {/* Stage Filter */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 font-bold">Stage:</span>
                <select
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700"
                >
                  <option value="All">All Stages</option>
                  <option value="Pre-Flight">Pre-Flight</option>
                  <option value="Live Migration">Live Migration</option>
                  <option value="Post-Cutover">Post-Cutover</option>
                  <option value="Managed Services">Managed Services</option>
                </select>
              </div>
            </div>
          </div>

          {/* Customer View Mode: GRID CARDS */}
          {customerViewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredCustomers.map((customer) => {
                const info = getCustomerQuotaInfo(customer);
                return (
                  <div
                    key={customer.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all space-y-4 relative group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            {customer.code}
                          </span>
                          {customer.partnerName && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-1">
                              <Building2 className="w-2.5 h-2.5 text-indigo-600" />
                              {customer.partnerName}
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              customer.deploymentStage === 'Live Migration'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : customer.deploymentStage === 'Post-Cutover'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {customer.deploymentStage}
                          </span>
                        </div>
                        <h3 className="font-extrabold text-base text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {customer.name}
                        </h3>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 block font-mono">Health Score</span>
                        <span className="text-base font-black text-emerald-600">{customer.healthScore}%</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span className="font-medium text-slate-500">ERP Ecosystem:</span>
                        <strong className="text-slate-900 font-bold">{customer.erpEcosystem}</strong>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span className="font-medium text-slate-500">Region &amp; Tier:</span>
                        <span className="font-semibold text-slate-800">
                          {customer.region} ({customer.tier})
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span className="font-medium text-slate-500">Partner MRR:</span>
                        <strong className="text-slate-900 font-bold">${customer.mrrAmount.toLocaleString()}/mo</strong>
                      </div>

                      {/* Storage Quota Progress Bar */}
                      <div className="pt-2 border-t border-slate-200/80 space-y-1">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="font-bold text-slate-700 flex items-center gap-1">
                            <Database className="w-3.5 h-3.5 text-indigo-500" /> Storage Quota:
                          </span>
                          <span className={`font-mono font-extrabold ${info.isNearingLimit ? 'text-amber-700' : 'text-slate-900'}`}>
                            {info.usedTb.toFixed(1)} / {info.quotaTb} TB ({info.pctUsed}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              info.pctUsed >= 90 ? 'bg-red-500' : info.isNearingLimit ? 'bg-amber-500' : 'bg-indigo-600'
                            }`}
                            style={{ width: `${Math.min(100, info.pctUsed)}%` }}
                          />
                        </div>
                        {info.isNearingLimit && (
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-amber-800 font-bold flex items-center gap-1 bg-amber-100/90 px-2 py-0.5 rounded-md border border-amber-300">
                              <AlertTriangle className="w-3 h-3 text-amber-600 animate-bounce" />
                              Limit Alert ({info.pctUsed}%)
                            </span>
                            <button
                              onClick={() => sendManualStorageWarningEmail(customer)}
                              className="text-[10px] text-indigo-700 hover:text-indigo-900 font-bold flex items-center gap-1 cursor-pointer bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md border border-indigo-200 transition-colors"
                              title="Trigger automated email warning"
                            >
                              <Mail className="w-3 h-3 text-indigo-600" /> Send Warning Email
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 text-slate-500">
                      <div className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>{customer.accountManager}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={() => handleLaunchCustomerDashboard(customer)}
                        className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-indigo-200"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Customer Dashboard</span>
                      </button>
                      <button
                        onClick={() => setSelectedCustomerForDrawer(customer)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                      >
                        <span>Details &amp; Billing</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Customer View Mode: HIGH DENSITY TABLE */}
          {customerViewMode === 'table' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-2">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Table className="w-4 h-4 text-indigo-600" />
                  Detailed Managed Customers Directory
                </h3>
                <span className="text-xs text-slate-500 font-mono">Showing {filteredCustomers.length} accounts</span>
              </div>

              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-indigo-500/30 scrollbar-track-slate-100">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono font-bold uppercase">
                      <th className="p-3">Partner</th>
                      <th className="p-3">Customer Code</th>
                      <th className="p-3">Customer Name</th>
                      <th className="p-3">ERP Ecosystem</th>
                      <th className="p-3">Region &amp; Tier</th>
                      <th className="p-3">Deployment Stage</th>
                      <th className="p-3">Storage Migration Quota</th>
                      <th className="p-3">Active Jobs</th>
                      <th className="p-3">Monthly MRR</th>
                      <th className="p-3">Health / SLA</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCustomers.map((cust) => {
                      const info = getCustomerQuotaInfo(cust);
                      return (
                        <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-200 font-mono">
                              {cust.partnerName || 'Avanade'}
                            </span>
                          </td>
                          <td className="p-3 font-mono font-bold text-indigo-600">
                            <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200">
                              {cust.code}
                            </span>
                          </td>
                          <td className="p-3 font-extrabold text-slate-900">
                            <div>{cust.name}</div>
                            <span className="text-[10px] text-slate-500 font-normal">{cust.contactEmail}</span>
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-slate-800">{cust.erpEcosystem}</span>
                          </td>
                          <td className="p-3 text-slate-600">
                            {cust.region} ({cust.tier})
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                cust.deploymentStage === 'Live Migration'
                                  ? 'bg-amber-100 text-amber-800'
                                  : cust.deploymentStage === 'Post-Cutover'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {cust.deploymentStage}
                            </span>
                          </td>
                          <td className="p-3 min-w-[160px]">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between font-mono text-[11px] font-bold">
                                <span>{info.usedTb.toFixed(1)} / {info.quotaTb} TB</span>
                                <span className={info.isNearingLimit ? 'text-amber-600 font-black' : 'text-slate-600'}>
                                  {info.pctUsed}%
                                </span>
                              </div>
                              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    info.pctUsed >= 90 ? 'bg-red-500' : info.isNearingLimit ? 'bg-amber-500' : 'bg-indigo-600'
                                  }`}
                                  style={{ width: `${Math.min(100, info.pctUsed)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-700">
                            {cust.activeJobs} Jobs
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-900">
                            ${cust.mrrAmount.toLocaleString()}/mo
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              {cust.healthScore}%
                            </span>
                          </td>
                          <td className="p-3 text-right space-x-1 whitespace-nowrap">
                            {info.isNearingLimit && (
                              <button
                                onClick={() => sendManualStorageWarningEmail(cust)}
                                className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold rounded-lg text-[11px] cursor-pointer inline-flex items-center gap-1 border border-amber-300"
                                title="Send storage limit warning email"
                              >
                                <Mail className="w-3 h-3 text-amber-700" /> Alert Email
                              </button>
                            )}
                            <button
                              onClick={() => handleLaunchCustomerDashboard(cust)}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-[11px] cursor-pointer inline-flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" /> Dashboard
                            </button>
                            <button
                              onClick={() => setSelectedCustomerForDrawer(cust)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg cursor-pointer font-bold"
                            >
                              Details &amp; Billing
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
        </div>
      )}

      {/* SUB-TAB 2: CUSTOMER DASHBOARDS */}
      {activeSubTab === 'dashboards' && (
        <div className="space-y-6">
          {/* Live Real-Time Telemetry Controls Bar for Customer Dashboards */}
          <div className="bg-white text-slate-900 p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-xs">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                  Multi-Customer Live Migration Telemetry Dashboards
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold flex items-center gap-1">
                    <Radio className={`w-3 h-3 text-emerald-600 ${isLiveStreaming ? 'animate-pulse' : ''}`} />
                    {isLiveStreaming ? 'LIVE STREAMING' : 'PAUSED'}
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Live operational CDC pipeline telemetries, cluster capacity load, throughput, and SLA health across all customer ERP clusters.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-100 text-xs font-mono text-slate-700 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                <span>Aggregated Rate: <strong className="text-emerald-600 font-black">{liveThroughputGbSec} GB/s</strong></span>
              </div>

              <button
                onClick={() => {
                  setIsLiveStreaming(!isLiveStreaming);
                  showToast(isLiveStreaming ? '⏸ Telemetry stream paused.' : '▶ Telemetry stream resumed.');
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                  isLiveStreaming
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                    : 'bg-emerald-600 text-slate-900 border-emerald-500 hover:bg-emerald-500 shadow-xs'
                }`}
              >
                {isLiveStreaming ? <Pause className="w-3.5 h-3.5 text-amber-300" /> : <Play className="w-3.5 h-3.5 text-slate-900" />}
                <span>{isLiveStreaming ? 'Pause Stream' : 'Resume Live Stream'}</span>
              </button>

              <button
                onClick={handleManualSyncPulse}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 border border-indigo-400/50"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                <span>Sync All Dashboards</span>
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-600" />
                  Live Managed Customer Workspaces
                </h2>
                <p className="text-slate-500 text-xs">
                  Showing {customers.length} customer accounts under real-time synchronization.
                </p>
              </div>

              {/* View Switcher for Dashboards */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
                <button
                  onClick={() => setDashboardViewMode('grid')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    dashboardViewMode === 'grid'
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span>Cards</span>
                </button>
                <button
                  onClick={() => setDashboardViewMode('table')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    dashboardViewMode === 'table'
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Table className="w-4 h-4" />
                  <span>Metrics Matrix</span>
                </button>
              </div>
            </div>

            {/* Dashboard View Mode: GRID CARDS */}
            {dashboardViewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {customers.map((cust) => {
                  const quotaInfo = getCustomerQuotaInfo(cust);
                  const custThroughput = ((cust.dataMigratedTb * 0.04) + 1.25).toFixed(2);
                  const clusterLoad = Math.min(96, Math.max(25, Math.floor((cust.dataMigratedTb / (quotaInfo.quotaTb || 1)) * 100)));

                  return (
                    <div key={cust.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-indigo-300 transition-all space-y-3 shadow-xs">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-900">{cust.name}</h4>
                          <span className="text-[10px] text-slate-500 font-mono">{cust.erpEcosystem}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <Radio className="w-2.5 h-2.5 text-emerald-600 animate-pulse" />
                          SLA {cust.healthScore}%
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between text-slate-600">
                          <span>CDC Pipeline Throughput:</span>
                          <strong className="text-emerald-600 font-mono font-bold">⚡ {custThroughput} GB/s</strong>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Active Parallel Jobs:</span>
                          <strong className="text-slate-900 font-mono font-bold">{cust.activeJobs} Jobs Running</strong>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Data Transferred:</span>
                          <strong className="text-indigo-600 font-mono font-bold">{cust.dataMigratedTb.toFixed(2)} / {quotaInfo.quotaTb} TB</strong>
                        </div>
                        <div className="space-y-1 pt-1">
                          <div className="flex justify-between text-[11px] text-slate-500 font-mono font-bold">
                            <span>Cluster Capacity Load</span>
                            <span className={clusterLoad > 85 ? 'text-amber-600 font-black' : 'text-slate-700'}>{clusterLoad}%</span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${clusterLoad > 85 ? 'bg-amber-500' : 'bg-indigo-600'}`}
                              style={{ width: `${clusterLoad}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleLaunchCustomerDashboard(cust)}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-indigo-200" />
                        <span>Launch Real-Time Customer Workspace</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Dashboard View Mode: METRICS MATRIX TABLE */}
            {dashboardViewMode === 'table' && (
              <div className="overflow-x-auto border border-slate-200 rounded-xl scrollbar-thin scrollbar-thumb-indigo-500/30 scrollbar-track-slate-100">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono font-bold uppercase">
                      <th className="p-3">Customer Account</th>
                      <th className="p-3">ERP Engine</th>
                      <th className="p-3">Deployment Stage</th>
                      <th className="p-3">Tenant Instance</th>
                      <th className="p-3">Active Jobs</th>
                      <th className="p-3">Data Migrated</th>
                      <th className="p-3">CDC Throughput</th>
                      <th className="p-3">Cluster Capacity</th>
                      <th className="p-3">SLA Health</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customers.map((cust) => {
                      const quotaInfo = getCustomerQuotaInfo(cust);
                      const custThroughput = ((cust.dataMigratedTb * 0.04) + 1.25).toFixed(2);
                      const clusterLoad = Math.min(96, Math.max(25, Math.floor((cust.dataMigratedTb / (quotaInfo.quotaTb || 1)) * 100)));

                      return (
                        <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3 font-bold text-slate-900">{cust.name}</td>
                          <td className="p-3 text-slate-700 font-medium">{cust.erpEcosystem}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {cust.deploymentStage}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-slate-500">{cust.tenantId}</td>
                          <td className="p-3 font-mono font-bold text-slate-800">{cust.activeJobs} Jobs</td>
                          <td className="p-3 font-mono font-bold text-indigo-600">{cust.dataMigratedTb.toFixed(2)} TB</td>
                          <td className="p-3 font-mono text-emerald-600 font-bold flex items-center gap-1">
                            <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
                            {custThroughput} GB/s
                          </td>
                          <td className="p-3">
                            <div className="w-24 space-y-1">
                              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                                <span>Load</span>
                                <span>{clusterLoad}%</span>
                              </div>
                              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                                  style={{ width: `${clusterLoad}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              {cust.healthScore}%
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleLaunchCustomerDashboard(cust)}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-[11px] cursor-pointer flex items-center gap-1 ml-auto shadow-xs"
                            >
                              <span>Launch Workspace</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: TENANT PROVISIONING */}
      {activeSubTab === 'tenants' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Server className="w-5 h-5 text-indigo-600" />
                  Provisioned Customer Tenants
                </h2>
                <p className="text-slate-500 text-xs">
                  Isolated Cloud Engine instances, cluster sizes, and connector presets across your customer accounts.
                </p>
              </div>

              <button
                onClick={() => setShowProvisionTenantModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Provision New Tenant Instance</span>
              </button>
            </div>

            {/* Tenant Table with Scrollbar */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl scrollbar-thin scrollbar-thumb-indigo-500/30 scrollbar-track-slate-100">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono font-bold uppercase">
                    <th className="p-3">Tenant Name</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Cloud Region</th>
                    <th className="p-3">Instance Type</th>
                    <th className="p-3">Nodes</th>
                    <th className="p-3">Storage Used</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tenants.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <Server className="w-4 h-4 text-indigo-600" />
                          <span>{tenant.tenantName}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono block">{tenant.cnameDomain}</span>
                      </td>
                      <td className="p-3 text-slate-700 font-medium">{tenant.customerName}</td>
                      <td className="p-3 text-slate-600 font-mono">{tenant.cloudRegion}</td>
                      <td className="p-3 text-slate-600">{tenant.instanceType}</td>
                      <td className="p-3 font-mono font-bold text-indigo-600">{tenant.allocatedNodes} Nodes</td>
                      <td className="p-3">
                        <span className="font-mono font-bold text-slate-800">
                          {tenant.storageUsedTb} TB / {tenant.storageAllocatedTb} TB
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            tenant.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {tenant.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => showToast(`Tenant ${tenant.tenantName} health check OK (100% SLA).`)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] cursor-pointer"
                        >
                          Health
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB: SSO MANAGEMENT (SAML 2.0 & OIDC IDENTITY PROVIDER CONFIGURATION) */}
      {activeSubTab === 'sso' && (
        !currentPermissions.canManageSso ? (
          renderAccessDeniedScreen('Identity Provider SSO Management', 'canManageSso', ['Partner Admin', 'Partner Support'])
        ) : (
          <div className="space-y-6 animate-in fade-in zoom-in-95">
            {/* Header / Summary Metrics */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-indigo-600" />
                      Federated Identity Management
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold">
                      Zero-Trust SAML 2.0 &amp; OIDC PKCE
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    Enterprise Customer SSO &amp; Identity Provider Management
                  </h2>
                  <p className="text-xs text-slate-700 max-w-2xl">
                    Configure customer-specific identity providers (Okta, Microsoft Entra ID, PingFederate, Auth0, Shibboleth), test SAML metadata XML endpoints, and validate OIDC client credentials for seamless single sign-on.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      const sampleCust = customers[0];
                      if (sampleCust) handleSelectCustomerForSso(sampleCust.id);
                      showToast('🔄 SSO Form reset to primary active customer context.');
                    }}
                    className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-100 cursor-pointer flex items-center gap-1.5 transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Reset SSO Context</span>
                  </button>
                </div>
              </div>

              {/* SSO Stat Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-1">
                  <span className="text-[10px] font-bold uppercase font-mono text-indigo-500">Total Configured IdPs</span>
                  <div className="text-xl font-black text-slate-900 font-mono">{partnerSsoConfigs.length} Customers</div>
                  <div className="text-[10px] text-indigo-600/70">Across active partner workspace</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-1">
                  <span className="text-[10px] font-bold uppercase font-mono text-emerald-600">SAML 2.0 XML Endpoints</span>
                  <div className="text-xl font-black text-emerald-700 font-mono">
                    {partnerSsoConfigs.filter((s) => s.protocol === 'SAML2').length} Active
                  </div>
                  <div className="text-[10px] text-emerald-600/70 font-mono">X.509 Signature Validated</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-1">
                  <span className="text-[10px] font-bold uppercase font-mono text-amber-600">OIDC Discovery Endpoints</span>
                  <div className="text-xl font-black text-amber-700 font-mono">
                    {partnerSsoConfigs.filter((s) => s.protocol === 'OIDC').length} Configured
                  </div>
                  <div className="text-[10px] text-amber-600/70 font-mono">PKCE S256 Supported</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase font-mono text-slate-500">Endpoint Uptime &amp; SLA</span>
                  <div className="text-xl font-black text-slate-900 font-mono">100% Passed</div>
                  <div className="text-[10px] text-slate-500">Automated handshake verification</div>
                </div>
              </div>
            </div>

            {/* Main Interactive Form Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl space-y-6">
              {/* Customer Selection & Protocol Selector Header */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div className="space-y-1 flex-1">
                  <label className="block text-xs font-mono font-bold uppercase text-slate-500">
                    Target Customer Account Context
                  </label>
                  <select
                    value={ssoSelectedCustId}
                    onChange={(e) => handleSelectCustomerForSso(e.target.value)}
                    className="w-full max-w-md px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-xs"
                  >
                    {customers.map((c) => {
                      const hasConfig = partnerSsoConfigs.some((s) => s.customerId === c.id);
                      return (
                        <option key={c.id} value={c.id}>
                          🏢 {c.name} ({c.code}) — {c.erpEcosystem} {hasConfig ? '✓ [SSO Configured]' : '[New Setup]'}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Protocol Toggle Buttons */}
                <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shrink-0">
                  <button
                    type="button"
                    onClick={() => setSsoFormProtocol('OIDC')}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                      ssoFormProtocol === 'OIDC'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>OpenID Connect (OIDC)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSsoFormProtocol('SAML2')}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                      ssoFormProtocol === 'SAML2'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    <Globe className="w-4 h-4" />
                    <span>SAML 2.0 Metadata XML</span>
                  </button>
                </div>
              </div>

              {/* Protocol Form Inputs */}
              {ssoFormProtocol === 'SAML2' ? (
                /* SAML 2.0 FORM */
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 text-xs text-indigo-950 flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-extrabold text-indigo-900">SAML 2.0 Web Browser SSO Profile:</strong>
                      <p className="mt-0.5 text-indigo-800">
                        Input the customer's SAML Federation Metadata XML URL (e.g., Microsoft Entra ID, PingFederate, Shibboleth, Okta). The test engine will fetch the EntityDescriptor XML, extract X.509 signing certificates, and verify Assertion Consumer Service (ACS) endpoints.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
                    <div className="lg:col-span-2 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <label className="block font-bold text-slate-800">
                          SAML Federation Metadata XML URL <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[11px] text-slate-500 font-mono">HTTPS SAML 2.0 EntityDescriptor</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            type="url"
                            value={ssoFormSamlMetadataUrl}
                            onChange={(e) => {
                              setSsoFormSamlMetadataUrl(e.target.value);
                              setSsoPingResult(null);
                            }}
                            placeholder="https://login.microsoftonline.com/tenant-id/federationmetadata/2007-06/federationmetadata.xml"
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-16"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(ssoFormSamlMetadataUrl);
                              showToast('📋 SAML Metadata URL copied to clipboard!');
                            }}
                            className="absolute right-2 top-2 px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[11px] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </button>
                        </div>

                        {/* Dedicated Verify Connection Button */}
                        <button
                          type="button"
                          onClick={() => handleVerifySsoConnection('SAML2')}
                          disabled={isPingingSsoUrl}
                          className={`px-4 py-2.5 font-extrabold text-xs rounded-xl shadow-sm border transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                            isPingingSsoUrl
                              ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500/50 hover:shadow-md'
                          }`}
                        >
                          {isPingingSsoUrl ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-950" />
                              <span>Pinging...</span>
                            </>
                          ) : (
                            <>
                              <Zap className="w-3.5 h-3.5 text-amber-300" />
                              <span>Verify Connection</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Immediate Ping Feedback Banner for SAML */}
                      {(isPingingSsoUrl || (ssoPingResult && ssoPingResult.protocol === 'SAML2')) && (
                        <div
                          className={`p-3.5 rounded-2xl border text-xs font-mono space-y-1.5 transition-all animate-in fade-in ${
                            isPingingSsoUrl
                              ? 'bg-amber-50/80 border-amber-300 text-amber-950'
                              : ssoPingResult?.status === 'SUCCESS'
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                              : 'bg-rose-50 border-rose-300 text-rose-950'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <div className="flex items-center gap-2">
                              {isPingingSsoUrl ? (
                                <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
                              ) : ssoPingResult?.status === 'SUCCESS' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <ShieldAlert className="w-4 h-4 text-rose-600" />
                              )}
                              <span>
                                {isPingingSsoUrl
                                  ? 'Executing HTTPS ping to SAML Metadata URL...'
                                  : `Connectivity Status: HTTP ${ssoPingResult?.httpStatus} ${
                                      ssoPingResult?.status === 'SUCCESS' ? 'OK' : 'Error'
                                    }`}
                              </span>
                            </div>

                            {ssoPingResult && (
                              <div className="flex items-center gap-2 text-[11px] font-normal">
                                <span className="px-2 py-0.5 rounded-md bg-white/80 border border-slate-300 text-slate-800 font-bold">
                                  ⚡ {ssoPingResult.latencyMs} ms
                                </span>
                                <span>Verified at {ssoPingResult.verifiedAt}</span>
                              </div>
                            )}
                          </div>

                          {ssoPingResult && (
                            <div className="text-[11px] leading-relaxed pt-1 border-t border-slate-200/60 space-y-1">
                              <div>
                                <span className="font-bold">Content-Type:</span> {ssoPingResult.contentType}
                              </div>
                              <div>
                                <span className="font-bold">Diagnostic:</span> {ssoPingResult.details}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Customer Primary Domain</label>
                      <input
                        type="text"
                        value={ssoFormDomain}
                        onChange={(e) => setSsoFormDomain(e.target.value)}
                        placeholder="contoso-retail.com"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Service Provider (SP) Entity ID</label>
                      <input
                        type="text"
                        value={ssoFormSamlEntityId}
                        onChange={(e) => setSsoFormSamlEntityId(e.target.value)}
                        placeholder="urn:edimp:sp:customer-code"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Assertion Consumer Service (ACS) URL</label>
                      <input
                        type="text"
                        value={ssoFormAcsUrl}
                        readOnly
                        className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-300 rounded-xl font-mono text-xs text-slate-700 cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 mb-1">X.509 Signing Certificate Fingerprint (SHA-256)</label>
                      <input
                        type="text"
                        value={ssoFormX509Cert}
                        onChange={(e) => setSsoFormX509Cert(e.target.value)}
                        placeholder="9A:8B:7C:6D:5E:4F..."
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* OIDC FORM */
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs text-amber-950 flex items-start gap-3">
                    <KeyRound className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-extrabold text-amber-900">OpenID Connect 1.0 (OIDC) Authorization Code Flow with PKCE:</strong>
                      <p className="mt-0.5 text-amber-800">
                        Input the customer's OIDC Discovery Endpoint (`.well-known/openid-configuration`), Client ID, and Client Secret. The test engine will perform an OpenID discovery handshake, verify authorization &amp; token endpoints, and check JWKS key sets.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
                    <div className="lg:col-span-2 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <label className="block font-bold text-slate-800">
                          OIDC Discovery Endpoint URL <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[11px] text-slate-500 font-mono">.well-known/openid-configuration</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            type="url"
                            value={ssoFormOidcDiscoveryUrl}
                            onChange={(e) => {
                              setSsoFormOidcDiscoveryUrl(e.target.value);
                              setSsoPingResult(null);
                            }}
                            placeholder="https://acme.okta.com/oauth2/default/.well-known/openid-configuration"
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-16"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(ssoFormOidcDiscoveryUrl);
                              showToast('📋 OIDC Discovery URL copied to clipboard!');
                            }}
                            className="absolute right-2 top-2 px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[11px] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </button>
                        </div>

                        {/* Dedicated Verify Connection Button */}
                        <button
                          type="button"
                          onClick={() => handleVerifySsoConnection('OIDC')}
                          disabled={isPingingSsoUrl}
                          className={`px-4 py-2.5 font-extrabold text-xs rounded-xl shadow-sm border transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                            isPingingSsoUrl
                              ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500/50 hover:shadow-md'
                          }`}
                        >
                          {isPingingSsoUrl ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-950" />
                              <span>Pinging...</span>
                            </>
                          ) : (
                            <>
                              <Zap className="w-3.5 h-3.5 text-amber-300" />
                              <span>Verify Connection</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Immediate Ping Feedback Banner for OIDC */}
                      {(isPingingSsoUrl || (ssoPingResult && ssoPingResult.protocol === 'OIDC')) && (
                        <div
                          className={`p-3.5 rounded-2xl border text-xs font-mono space-y-1.5 transition-all animate-in fade-in ${
                            isPingingSsoUrl
                              ? 'bg-amber-50/80 border-amber-300 text-amber-950'
                              : ssoPingResult?.status === 'SUCCESS'
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                              : 'bg-rose-50 border-rose-300 text-rose-950'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <div className="flex items-center gap-2">
                              {isPingingSsoUrl ? (
                                <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
                              ) : ssoPingResult?.status === 'SUCCESS' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <ShieldAlert className="w-4 h-4 text-rose-600" />
                              )}
                              <span>
                                {isPingingSsoUrl
                                  ? 'Executing HTTPS ping to OpenID Discovery Endpoint URL...'
                                  : `Connectivity Status: HTTP ${ssoPingResult?.httpStatus} ${
                                      ssoPingResult?.status === 'SUCCESS' ? 'OK' : 'Error'
                                    }`}
                              </span>
                            </div>

                            {ssoPingResult && (
                              <div className="flex items-center gap-2 text-[11px] font-normal">
                                <span className="px-2 py-0.5 rounded-md bg-white/80 border border-slate-300 text-slate-800 font-bold">
                                  ⚡ {ssoPingResult.latencyMs} ms
                                </span>
                                <span>Verified at {ssoPingResult.verifiedAt}</span>
                              </div>
                            )}
                          </div>

                          {ssoPingResult && (
                            <div className="text-[11px] leading-relaxed pt-1 border-t border-slate-200/60 space-y-1">
                              <div>
                                <span className="font-bold">Content-Type:</span> {ssoPingResult.contentType}
                              </div>
                              <div>
                                <span className="font-bold">Diagnostic:</span> {ssoPingResult.details}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 mb-1">OIDC Issuer URL</label>
                      <input
                        type="text"
                        value={ssoFormIssuerUrl}
                        onChange={(e) => setSsoFormIssuerUrl(e.target.value)}
                        placeholder="https://acme.okta.com/oauth2/default"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Customer Allowed Domain</label>
                      <input
                        type="text"
                        value={ssoFormDomain}
                        onChange={(e) => setSsoFormDomain(e.target.value)}
                        placeholder="acme-corp.com"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 mb-1">OIDC Client ID <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        value={ssoFormClientId}
                        onChange={(e) => setSsoFormClientId(e.target.value)}
                        placeholder="0oae189x09XzMkp097"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 mb-1">OIDC Client Secret <span className="text-rose-500">*</span></label>
                      <div className="relative">
                        <input
                          type={ssoFormShowSecret ? 'text' : 'password'}
                          value={ssoFormClientSecret}
                          onChange={(e) => setSsoFormClientSecret(e.target.value)}
                          placeholder="secret_live_okta_..."
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setSsoFormShowSecret(!ssoFormShowSecret)}
                          className="absolute right-3 top-3 text-slate-500 hover:text-slate-600 transition-colors cursor-pointer"
                        >
                          {ssoFormShowSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="lg:col-span-2">
                      <label className="block font-bold text-slate-800 mb-1">Requested OAuth Scopes</label>
                      <input
                        type="text"
                        value={ssoFormScopes}
                        onChange={(e) => setSsoFormScopes(e.target.value)}
                        placeholder="openid profile email groups"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons: Test Handshake & Save Configuration */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-500 font-mono flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Enforces Encrypted TLS 1.3 &amp; Fine-Grained RBAC</span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleRunSsoTestHandshake}
                    disabled={isTestingSsoHandshake}
                    className={`flex-1 sm:flex-none px-5 py-2.5 font-extrabold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isTestingSsoHandshake
                        ? 'bg-amber-500 text-slate-950 border border-amber-400 animate-pulse'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/40 shadow-indigo-600/30'
                    }`}
                  >
                    {isTestingSsoHandshake ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                        <span>Testing Handshake ({ssoTestingStep}/4)...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 text-amber-300" />
                        <span>Test Metadata &amp; Handshake</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
                      setPartnerSsoConfigs((prev: any) => {
                        const custObj = customers.find((c) => c.id === ssoSelectedCustId);
                        const exists = prev.find((s) => s.customerId === ssoSelectedCustId);
                        if (exists) {
                          return prev.map((s) =>
                            s.customerId === ssoSelectedCustId
                              ? {
                                  ...s,
                                  protocol: ssoFormProtocol,
                                  domain: ssoFormDomain,
                                  samlMetadataUrl: ssoFormSamlMetadataUrl,
                                  samlEntityId: ssoFormSamlEntityId,
                                  acsUrl: ssoFormAcsUrl,
                                  x509CertFingerprint: ssoFormX509Cert,
                                  oidcDiscoveryUrl: ssoFormOidcDiscoveryUrl,
                                  issuerUrl: ssoFormIssuerUrl,
                                  clientId: ssoFormClientId,
                                  clientSecret: ssoFormClientSecret,
                                  scopes: ssoFormScopes,
                                  lastTestedAt: nowStr,
                                  status: 'Active' as const,
                                }
                              : s
                          );
                        } else {
                          return [
                            {
                              id: `sso-cust-${Date.now()}`,
                              customerId: ssoSelectedCustId,
                              customerName: custObj?.name || 'Customer Account',
                              customerCode: custObj?.code || 'CUST',
                              protocol: ssoFormProtocol,
                              status: 'Active' as const,
                              domain: ssoFormDomain,
                              samlMetadataUrl: ssoFormSamlMetadataUrl,
                              samlEntityId: ssoFormSamlEntityId,
                              acsUrl: ssoFormAcsUrl,
                              x509CertFingerprint: ssoFormX509Cert,
                              oidcDiscoveryUrl: ssoFormOidcDiscoveryUrl,
                              issuerUrl: ssoFormIssuerUrl,
                              clientId: ssoFormClientId,
                              clientSecret: ssoFormClientSecret,
                              scopes: ssoFormScopes,
                              lastTestedAt: nowStr,
                              testStatus: 'PASSED' as const,
                              mappedRole: 'Customer Administrator',
                            },
                            ...prev,
                          ];
                        }
                      });
                      showToast(`🎉 SSO Configuration saved & activated for @${ssoFormDomain}!`);
                    }}
                    className="px-5 py-2.5 bg-white hover:bg-white text-slate-900 font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Save SSO Settings</span>
                  </button>
                </div>
              </div>

              {/* LIVE HANDSHAKE TEST CONSOLE TERMINAL */}
              {(isTestingSsoHandshake || ssoTestingLogs.length > 0) && (
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl border border-slate-200 text-slate-700 font-mono text-xs space-y-3 shadow-sm animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-emerald-600" />
                      <span className="font-extrabold text-slate-900 text-xs">
                        Identity Provider Endpoint Handshake Tester &amp; Diagnostic Terminal
                      </span>
                    </div>

                    <div className="flex items-center gap-2 font-bold text-[11px]">
                      <span
                        className={`px-2 py-0.5 rounded-md ${
                          ssoTestingStep === 4
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                            : 'bg-amber-950 text-amber-300 border border-amber-500/50 animate-pulse'
                        }`}
                      >
                        Step {ssoTestingStep} of 4: {ssoTestingStep === 4 ? 'Handshake Passed ✓' : 'Auditing Endpoints...'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSsoTestingLogs([]);
                          setSsoTestingStep(0);
                        }}
                        className="text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Line */}
                  <div className="w-full bg-white h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full transition-all duration-500"
                      style={{ width: `${(ssoTestingStep / 4) * 100}%` }}
                    />
                  </div>

                  {/* Terminal Log Stream */}
                  <div className="space-y-1.5 max-h-52 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700">
                    {ssoTestingLogs.map((log, idx) => {
                      const isSuccess = log.includes('[SUCCESS]') || log.includes('[READY]') || log.includes('[CERT_STATUS]');
                      const isHttp = log.includes('[HTTP_200]');
                      return (
                        <div
                          key={idx}
                          className={`text-[11px] leading-relaxed flex items-start gap-2 ${
                            isSuccess ? 'text-emerald-600 font-bold' : isHttp ? 'text-indigo-300' : 'text-slate-700'
                          }`}
                        >
                          <ChevronRight className="w-3 h-3 text-slate-500 shrink-0 mt-0.5" />
                          <span>{log}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Registered Customer IdPs Directory Table */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <Globe className="w-4.5 h-4.5 text-indigo-600" />
                    Configured Customer Identity Providers
                  </h3>
                  <p className="text-xs text-slate-500">
                    Directory of verified SAML 2.0 and OIDC single sign-on integrations across customer tenant environments.
                  </p>
                </div>

                <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 font-mono text-xs font-extrabold w-fit">
                  {partnerSsoConfigs.length} Active Customer IdPs
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-2xl scrollbar-thin scrollbar-thumb-indigo-500/30 scrollbar-track-slate-100">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono font-bold uppercase">
                      <th className="p-3.5">Customer Account</th>
                      <th className="p-3.5">Allowed Domain</th>
                      <th className="p-3.5">Protocol</th>
                      <th className="p-3.5">Metadata XML / Discovery URL</th>
                      <th className="p-3.5">Connection Status</th>
                      <th className="p-3.5">Last Handshake</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {partnerSsoConfigs.map((sso) => {
                      const isSelected = sso.customerId === ssoSelectedCustId;
                      const targetUrl = sso.protocol === 'SAML2' ? sso.samlMetadataUrl : sso.oidcDiscoveryUrl;
                      const connStatus = sso.connectionStatus || 'Pending';

                      return (
                        <tr
                          key={sso.id}
                          className={`hover:bg-slate-50 transition-colors ${isSelected ? 'bg-indigo-50/40' : ''}`}
                        >
                          <td className="p-3.5 font-extrabold text-slate-900">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span>{sso.customerName}</span>
                                  {/* Color-Coded Connection Status Indicator Badge */}
                                  <span
                                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border transition-all ${
                                      connStatus === 'Verified'
                                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                        : connStatus === 'Error'
                                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                                        : 'bg-amber-100 text-amber-800 border-amber-300'
                                    }`}
                                    title={`Endpoint Connectivity Status: ${connStatus}`}
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                        connStatus === 'Verified'
                                          ? 'bg-emerald-500'
                                          : connStatus === 'Error'
                                          ? 'bg-rose-500'
                                          : 'bg-amber-500 animate-pulse'
                                      }`}
                                    />
                                    <span>{connStatus}</span>
                                  </span>
                                </div>
                                <span className="block text-[10px] font-mono text-slate-500 font-normal">
                                  Code: {sso.customerCode}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="p-3.5 font-mono text-slate-700 font-bold">
                            @{sso.domain}
                          </td>

                          <td className="p-3.5">
                            <span
                              className={`px-2.5 py-1 rounded-lg font-mono text-[10px] font-extrabold border ${
                                sso.protocol === 'SAML2'
                                  ? 'bg-indigo-100 text-indigo-900 border-indigo-200'
                                  : 'bg-amber-100 text-amber-900 border-amber-200'
                              }`}
                            >
                              {sso.protocol === 'SAML2' ? 'SAML 2.0 XML' : 'OIDC 1.0 PKCE'}
                            </span>
                          </td>

                          <td className="p-3.5 font-mono text-[11px] text-slate-600 max-w-xs truncate">
                            {targetUrl ? (
                              <span className="truncate block" title={targetUrl}>
                                {targetUrl}
                              </span>
                            ) : (
                              <span className="text-slate-500 italic">Not set</span>
                            )}
                          </td>

                          <td className="p-3.5">
                            {/* Detailed Color-Coded Connection Status Column */}
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold font-mono border flex items-center gap-1.5 w-fit ${
                                connStatus === 'Verified'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : connStatus === 'Error'
                                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                                  : 'bg-amber-100 text-amber-800 border-amber-300'
                              }`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${
                                  connStatus === 'Verified'
                                    ? 'bg-emerald-500 animate-pulse'
                                    : connStatus === 'Error'
                                    ? 'bg-rose-500'
                                    : 'bg-amber-500 animate-ping'
                                }`}
                              />
                              <span>{connStatus}</span>
                            </span>
                          </td>

                          <td className="p-3.5 font-mono text-[11px] text-slate-600">
                            {sso.lastTestedAt || 'Never'}
                          </td>

                          <td className="p-3.5">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono border flex items-center gap-1 w-fit ${
                                sso.status === 'Active'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : sso.status === 'Testing'
                                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                                  : 'bg-slate-100 text-slate-600 border-slate-300'
                              }`}
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              {sso.status}
                            </span>
                          </td>

                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleSelectCustomerForSso(sso.customerId)}
                                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs rounded-xl transition-colors cursor-pointer border border-indigo-200 flex items-center gap-1"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  handleSelectCustomerForSso(sso.customerId);
                                  setTimeout(() => handleRunSsoTestHandshake(), 100);
                                }}
                                className="px-3 py-1.5 bg-white hover:bg-white text-slate-900 font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <Zap className="w-3.5 h-3.5 text-amber-300" />
                                <span>Test</span>
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
          </div>
        )
      )}

      {/* SUB-TAB 4: LICENSE ASSIGNMENT */}
      {activeSubTab === 'licenses' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-indigo-600" />
                Partner License Pool &amp; Customer Assignments
              </h2>
              <p className="text-slate-500 text-xs">
                Manage your enterprise connector seats, CDC stream allowances, and customer quota allocations.
              </p>
            </div>

            {/* License Pool Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {licensePackages.map((pkg) => {
                const availableSeats = pkg.totalPoolSeats - pkg.assignedSeats;
                const pctUsed = Math.round((pkg.assignedSeats / pkg.totalPoolSeats) * 100);

                return (
                  <div key={pkg.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                        {pkg.erpVendor}
                      </span>
                      <span className="text-[10px] text-slate-500">Exp: {pkg.expiryDate}</span>
                    </div>

                    <h4 className="font-extrabold text-xs text-slate-900">{pkg.name}</h4>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-500">Assigned / Pool</span>
                        <strong className="text-indigo-600 font-bold">
                          {pkg.assignedSeats} / {pkg.totalPoolSeats}
                        </strong>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            pctUsed > 85 ? 'bg-amber-500' : 'bg-indigo-600'
                          }`}
                          style={{ width: `${pctUsed}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[11px] pt-1 text-slate-500">
                      <span>Available: {availableSeats} seats</span>
                      <strong className="text-slate-800">${pkg.costPerSeatMonthly}/mo</strong>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Active Customer License Assignments Table */}
            <div className="space-y-3">
              <h3 className="font-extrabold text-sm text-slate-900">Active Customer License Allocations</h3>
              <div className="overflow-x-auto border border-slate-200 rounded-xl scrollbar-thin scrollbar-thumb-indigo-500/30 scrollbar-track-slate-100">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono font-bold uppercase">
                      <th className="p-3">Customer Name</th>
                      <th className="p-3">License Package</th>
                      <th className="p-3">Tenant ID</th>
                      <th className="p-3">Assigned Seats</th>
                      <th className="p-3">Assigned Date</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {licenseAssignments.map((asgn) => (
                      <tr key={asgn.id} className="hover:bg-slate-50/80">
                        <td className="p-3 font-bold text-slate-900">{asgn.customerName}</td>
                        <td className="p-3 text-indigo-700 font-semibold">{asgn.licenseName}</td>
                        <td className="p-3 font-mono text-slate-500">{asgn.tenantId}</td>
                        <td className="p-3 font-bold font-mono text-slate-800">{asgn.assignedSeats} Seats</td>
                        <td className="p-3 text-slate-600">{asgn.assignedAt}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {asgn.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => showToast(`License updated for ${asgn.customerName}`)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] cursor-pointer"
                          >
                            Modify
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: USAGE REPORTS */}
      {activeSubTab === 'usage' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-600" />
                  Partner Platform Usage Trends &amp; Telemetries
                </h2>
                <p className="text-slate-500 text-xs">
                  Historical data transfer volume, API throughput, and active CDC streams.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Metric Selector Filter */}
                <select
                  value={usageMetric}
                  onChange={(e) => setUsageMetric(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                >
                  <option value="all">All Usage Telemetries</option>
                  <option value="dataTransferredTb">Data Transferred (TB)</option>
                  <option value="apiRequestsMillions">API Requests (Millions)</option>
                  <option value="cdcEventsBillions">CDC Stream Events (Billions)</option>
                </select>

                <button
                  onClick={() => showToast('Usage Report statement downloaded as PDF & CSV.')}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-900 font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-xs shrink-0"
                >
                  <Download className="w-4 h-4 text-indigo-600" />
                  <span>Export Report (PDF)</span>
                </button>
              </div>
            </div>

            {/* Recharts Area Chart */}
            <div className="h-80 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MOCK_MONTHLY_USAGE} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="usageDataGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="apiDataGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="cdcDataGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />

                  {(usageMetric === 'all' || usageMetric === 'dataTransferredTb') && (
                    <Area
                      type="monotone"
                      dataKey="dataTransferredTb"
                      name="Data Volume (TB)"
                      stroke="#4F46E5"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#usageDataGrad)"
                    />
                  )}

                  {(usageMetric === 'all' || usageMetric === 'apiRequestsMillions') && (
                    <Area
                      type="monotone"
                      dataKey="apiRequestsMillions"
                      name="API Requests (M)"
                      stroke="#10B981"
                      strokeWidth={2}
                      fillOpacity={0.6}
                      fill="url(#apiDataGrad)"
                    />
                  )}

                  {(usageMetric === 'all' || usageMetric === 'cdcEventsBillions') && (
                    <Area
                      type="monotone"
                      dataKey="cdcEventsBillions"
                      name="CDC Stream Events (B)"
                      stroke="#F59E0B"
                      strokeWidth={2}
                      fillOpacity={0.5}
                      fill="url(#cdcDataGrad)"
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Detailed Monthly Usage Telemetries Table with Scrollbar */}
            <div className="space-y-3 pt-2">
              <h3 className="font-extrabold text-sm text-slate-900">Detailed Monthly Platform Telemetry Statements</h3>
              <div className="overflow-x-auto border border-slate-200 rounded-xl scrollbar-thin scrollbar-thumb-indigo-500/30 scrollbar-track-slate-100">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono font-bold uppercase">
                      <th className="p-3">Month</th>
                      <th className="p-3">Data Transferred (TB)</th>
                      <th className="p-3">API Calls (Millions)</th>
                      <th className="p-3">Migration Jobs Executed</th>
                      <th className="p-3">CDC Stream Events (B)</th>
                      <th className="p-3">Active Customer Tenants</th>
                      <th className="p-3 font-right">Est. Cloud Infra Cost</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {MOCK_MONTHLY_USAGE.map((row) => (
                      <tr key={row.month} className="hover:bg-slate-50/80">
                        <td className="p-3 font-mono font-bold text-slate-900">{row.month} 2026</td>
                        <td className="p-3 font-mono font-bold text-indigo-600">{row.dataTransferredTb} TB</td>
                        <td className="p-3 font-mono text-emerald-600 font-bold">{row.apiRequestsMillions} M</td>
                        <td className="p-3 font-mono text-slate-800">{row.migrationJobsCount} Jobs</td>
                        <td className="p-3 font-mono text-amber-600 font-bold">{row.cdcEventsBillions} B</td>
                        <td className="p-3 font-mono text-slate-700">{row.activeTenants} Tenants</td>
                        <td className="p-3 font-mono text-slate-900 font-bold">${(row.dataTransferredTb * 180).toFixed(0)}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => showToast(`Statement for ${row.month} exported.`)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] cursor-pointer"
                          >
                            Export CSV
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 6: REVENUE REPORTS */}
      {activeSubTab === 'revenue' && (
        !currentPermissions.canViewRevenueReports
          ? renderAccessDeniedScreen('Reseller Financial & Revenue Reports', 'View Reseller Financials & Commission Statements', ['Partner Admin', 'Partner Analyst'])
          : (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-emerald-600" />
                      Partner Reseller Revenue &amp; Commissions
                    </h2>
                    <p className="text-slate-500 text-xs">
                      Financial performance, reseller margins, and tier discount commission statements.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-bold font-mono">
                      Tier Margin: 35% Discount
                    </span>
                  </div>
                </div>

                {/* Financial Overview Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[11px] font-mono font-bold text-slate-500 uppercase">Gross Revenue (Feb)</span>
                    <div className="text-2xl font-black text-slate-900">$148,500</div>
                    <span className="text-[10px] text-emerald-600 font-bold">+19.7% vs last month</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[11px] font-mono font-bold text-slate-500 uppercase">Partner Margin</span>
                    <div className="text-2xl font-black text-emerald-600">$51,975</div>
                    <span className="text-[10px] text-slate-500">Average 35% reseller markup</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[11px] font-mono font-bold text-slate-500 uppercase">Net Commission</span>
                    <div className="text-2xl font-black text-indigo-600">$41,580</div>
                    <span className="text-[10px] text-slate-500">Payout due March 1st</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[11px] font-mono font-bold text-slate-500 uppercase">Next Partner Tier</span>
                    <div className="text-xl font-black text-slate-900">Diamond Partner</div>
                    <span className="text-[10px] text-indigo-600 font-bold">$1.28M / $1.50M ARR Goal</span>
                  </div>
                </div>

                {/* Recharts Bar Chart */}
                <div className="h-72 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={MOCK_REVENUE_DATA} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit=" $" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: 'none',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="sapRevenue" name="SAP Revenue ($)" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="dynamicsRevenue" name="Dynamics 365 Revenue ($)" fill="#10B981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="oracleRevenue" name="Oracle Revenue ($)" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )
      )}

      {/* SUB-TAB 7: WHITE LABEL BRANDING */}
      {activeSubTab === 'whitelabel' && (
        !currentPermissions.canEditWhiteLabel
          ? renderAccessDeniedScreen('White-Label Portal Branding Configurator', 'Configure Partner Branding & White Labeling', ['Partner Admin'])
          : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* White Label Config Form */}
                <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <Palette className="w-5 h-5 text-indigo-600" />
                      White Label Portal Customization
                    </h2>
                    <p className="text-slate-500 text-xs">
                      Customize the branding, logos, theme colors, and domain settings visible to your customers.
                    </p>
                  </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Partner Organization Name</label>
                  <input
                    type="text"
                    value={whiteLabel.partnerName}
                    onChange={(e) => setWhiteLabel({ ...whiteLabel, partnerName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tagline / Subtitle</label>
                  <input
                    type="text"
                    value={whiteLabel.tagline}
                    onChange={(e) => setWhiteLabel({ ...whiteLabel, tagline: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Logo Preset</label>
                    <select
                      value={whiteLabel.logoPreset}
                      onChange={(e) => setWhiteLabel({ ...whiteLabel, logoPreset: e.target.value as any })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                    >
                      <option value="Avanade">Avanade Digital</option>
                      <option value="Deloitte Digital">Deloitte Digital</option>
                      <option value="PwC Advisory">PwC Advisory</option>
                      <option value="Accenture Tech">Accenture Tech</option>
                      <option value="KPMG Cyber">KPMG Cyber</option>
                      <option value="Infosys Digital">Infosys Digital</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Primary Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={whiteLabel.primaryColorHex}
                        onChange={(e) => setWhiteLabel({ ...whiteLabel, primaryColorHex: e.target.value })}
                        className="w-9 h-9 p-0.5 border border-slate-200 rounded-xl cursor-pointer"
                      />
                      <span className="font-mono text-slate-600 font-bold">{whiteLabel.primaryColorHex}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Custom Domain CNAME</label>
                  <input
                    type="text"
                    value={whiteLabel.cnameDomain}
                    onChange={(e) => setWhiteLabel({ ...whiteLabel, cnameDomain: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-[10px] text-emerald-600 font-semibold block mt-1">
                    ✓ SSL Certificate Verified &amp; Active
                  </span>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Custom Header Notice Banner</label>
                  <textarea
                    rows={2}
                    value={whiteLabel.customHeaderNotice}
                    onChange={(e) => setWhiteLabel({ ...whiteLabel, customHeaderNotice: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <button
                  onClick={() => showToast('White Label Branding configurations saved and published live!')}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md cursor-pointer transition-all"
                >
                  Save &amp; Publish Branding
                </button>
              </div>
            </div>

            {/* Live Interactive Preview Studio */}
            <div className="lg:col-span-6 space-y-3">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-600" />
                Live Customer Portal Co-Branding Preview
              </h3>

              <div className="border border-slate-300 rounded-2xl overflow-hidden shadow-lg bg-white text-slate-900">
                <div className="bg-slate-50 border border-slate-200 px-4 py-2 border-b border-slate-200 text-white flex items-center justify-between text-[11px] font-mono">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                    <span className="ml-2 font-semibold text-slate-700">https://{whiteLabel.cnameDomain}</span>
                  </div>
                  <span className="text-emerald-600 font-bold">SSL Active</span>
                </div>

                <div className="p-6 space-y-6">
                  {/* Notice header */}
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-[11px] text-indigo-800">
                    {whiteLabel.customHeaderNotice}
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-slate-900 text-lg shadow-md"
                        style={{ backgroundColor: whiteLabel.primaryColorHex }}
                      >
                        {whiteLabel.logoPreset.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-base text-slate-900">{whiteLabel.partnerName}</h4>
                        <p className="text-xs text-slate-500">{whiteLabel.tagline}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/60 p-4 rounded-xl border border-slate-100/50 space-y-3">
                    <h5 className="font-bold text-xs text-slate-700">Welcome to Customer Self-Service Portal</h5>
                    <p className="text-xs text-slate-500">
                      Access your ERP migration progress, download CDC sync logs, and manage data validation suites.
                    </p>
                    <button
                      className="px-4 py-2 rounded-xl font-bold text-xs text-slate-900 shadow-md cursor-pointer"
                      style={{ backgroundColor: whiteLabel.primaryColorHex }}
                    >
                      Access ERP Migration Suite
                    </button>
                  </div>

                  {whiteLabel.showPoweredByBadge && (
                    <div className="text-center pt-2 border-t border-slate-200 text-[10px] text-slate-500 font-mono">
                      {whiteLabel.coBrandingText}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
          )
      )}

      {/* SUB-TAB 8: MIGRATION AUDIT TRAIL */}
      {activeSubTab === 'audit' && (
        <div className="space-y-6">
          <MigrationAuditTrailView
            initialCustomerId={selectedAuditCustomerId}
            onSelectCustomer={(cId) => setSelectedAuditCustomerId(cId)}
            onShowToast={showToast}
          />
        </div>
      )}

      {/* SUB-TAB 9: LIVE REAL-TIME ACTIVITY FEED */}
      {activeSubTab === 'activity' && (
        <LiveActivityFeed
          events={liveActivityEvents}
          customers={customers}
          selectedPartnerId={selectedPartnerId}
          currentRole={userRole}
          isLiveStreaming={isLiveStreaming}
          onToggleStreaming={() => setIsLiveStreaming(!isLiveStreaming)}
          onSimulateConfigChange={() => {
            const randomCust = customers[Math.floor(Math.random() * customers.length)] || customers[0];
            pushActivityEvent(
              'CONFIG_CHANGE',
              'Storage Quota & Scaling Policy Reconfigured',
              `Customer ${randomCust.name} billing plan storage allocation updated from ${(randomCust.dataMigratedTb + 5).toFixed(1)} TB to ${(randomCust.dataMigratedTb + 20).toFixed(1)} TB.`,
              randomCust,
              'Elena Rostova (Account Mgr)',
              'Partner Analyst',
              {
                'Previous Storage': `${(randomCust.dataMigratedTb + 5).toFixed(1)} TB`,
                'New Storage Allocation': `${(randomCust.dataMigratedTb + 20).toFixed(1)} TB`,
                'Auto-Scaling': 'Enabled (Azure Scale Set)',
              },
              'info'
            );
            showToast(`⚙️ Config change event simulated for ${randomCust.name}!`);
          }}
          onSimulateMigrationStart={() => {
            const randomCust = customers[Math.floor(Math.random() * customers.length)] || customers[0];
            pushActivityEvent(
              'MIGRATION_START',
              'Dynamics 365 / SAP Delta Pipeline Started',
              `High-throughput CDC migration pipeline initialized for ${randomCust.name} staging cluster (${randomCust.region}).`,
              randomCust,
              'Marcus Vance (Partner Lead)',
              'Partner Admin',
              {
                'ERP Engine': randomCust.erpEcosystem,
                'Cloud Region': randomCust.region,
                'Initial Rate': '2.45 GB/s',
                'Status': 'Real-Time Sync Active',
              },
              'success'
            );
            showToast(`🚀 Migration start event simulated for ${randomCust.name}!`);
          }}
          onSelectCustomerWorkspace={(c) => {
            setSelectedCustomerWorkspace(c);
          }}
          onClearFeed={() => {
            setLiveActivityEvents([]);
            showToast('Live activity stream cleared.');
          }}
        />
      )}

      {/* SUB-TAB 10: CUSTOMER COMPARISON D3 LOAD ANALYTICS DASHBOARD */}
      {activeSubTab === 'comparison' && (
        <CustomerComparisonDashboard
          customers={customers}
          tenants={tenants}
          onSelectCustomerWorkspace={(c) => {
            setSelectedCustomerWorkspace(c);
          }}
        />
      )}


      {/* MODAL: ONBOARD NEW CUSTOMER (WITH FULL BILLING & PAYMENT PLAN CONFIG) */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm max-w-3xl w-full max-h-[92vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="bg-white text-slate-900 p-5 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono font-bold uppercase flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                    Commercial Billing &amp; Account Onboarding
                  </span>
                  <span className="text-xs text-slate-500 font-mono">Step 1 of 1: Full Provisioning</span>
                </div>
                <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  Onboard New Partner Customer Account
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCustomerModal(false)}
                className="p-1.5 rounded-xl hover:bg-white text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleCreateCustomer} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs bg-slate-50/50 scrollbar-thin scrollbar-thumb-indigo-500/30">
              {/* SECTION 1: CUSTOMER ORGANIZATION & CONTACT */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider font-mono flex items-center gap-2 text-indigo-600">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  1. Organization &amp; Primary Technical Contact
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Assigned Partner Organization <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={newCustomer.partnerId}
                      onChange={(e) => setNewCustomer({ ...newCustomer, partnerId: e.target.value })}
                      className="w-full px-3 py-2 bg-indigo-50/70 border border-indigo-200 rounded-xl text-slate-900 font-extrabold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {partners.map((p) => (
                        <option key={p.id} value={p.id}>
                          🏢 {p.name} ({p.code}) — {p.tier}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Customer Organization Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Acme Global Logistics Corp"
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Customer Code</label>
                      <input
                        type="text"
                        placeholder="e.g. AGL-009"
                        value={newCustomer.code}
                        onChange={(e) => setNewCustomer({ ...newCustomer, code: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">ERP Ecosystem</label>
                      <select
                        value={newCustomer.erpEcosystem}
                        onChange={(e) => setNewCustomer({ ...newCustomer, erpEcosystem: e.target.value as any })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                      >
                        <option value="Microsoft Dynamics 365">Microsoft Dynamics 365</option>
                        <option value="SAP S/4HANA">SAP S/4HANA</option>
                        <option value="Oracle Fusion Cloud">Oracle Fusion Cloud</option>
                        <option value="NetSuite ERP">NetSuite ERP</option>
                        <option value="Infor LN">Infor LN</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Deployment Region</label>
                      <select
                        value={newCustomer.region}
                        onChange={(e) => setNewCustomer({ ...newCustomer, region: e.target.value as any })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                      >
                        <option value="North America">North America (US East)</option>
                        <option value="Europe / EU West">Europe (EU West / Frankfurt)</option>
                        <option value="Asia Pacific">Asia Pacific (Singapore)</option>
                        <option value="Latin America">Latin America (Brazil)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Primary Contact Name</label>
                      <input
                        type="text"
                        placeholder="e.g. John Doe (VP Infrastructure)"
                        value={newCustomer.contactName}
                        onChange={(e) => setNewCustomer({ ...newCustomer, contactName: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Contact Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="jdoe@acme.com"
                        value={newCustomer.contactEmail}
                        onChange={(e) => setNewCustomer({ ...newCustomer, contactEmail: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: BILLING PLAN & COMMERCIAL TIER */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider font-mono flex items-center gap-2 text-indigo-600">
                    <DollarSign className="w-4 h-4 text-indigo-600" />
                    2. Select Service Tier &amp; Billing Commitment
                  </h4>

                  {/* Billing Cycle Switcher */}
                  <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
                    <button
                      type="button"
                      onClick={() => setNewCustomer({ ...newCustomer, billingCycle: 'Monthly' })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        newCustomer.billingCycle === 'Monthly'
                          ? 'bg-white text-indigo-600 shadow-xs font-extrabold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Monthly Billing
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewCustomer({ ...newCustomer, billingCycle: 'Annual' })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        newCustomer.billingCycle === 'Annual'
                          ? 'bg-indigo-600 text-white shadow-xs font-extrabold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>Annual Contract</span>
                      <span className="px-1.5 py-0.2 bg-amber-400 text-slate-950 rounded-full text-[9px] font-black">
                        15% OFF
                      </span>
                    </button>
                  </div>
                </div>

                {/* Tier Grid Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    {
                      id: 'Trial',
                      name: 'Trial Period',
                      price: 0,
                      storage: '500 GB Allocated',
                      nodes: '1 Shared Node',
                    },
                    {
                      id: 'Starter',
                      name: 'Starter Plan',
                      price: 2500,
                      storage: '5 TB Allocated',
                      nodes: '1 Worker Node',
                    },
                    {
                      id: 'Professional',
                      name: 'Professional',
                      price: 7500,
                      storage: '20 TB Allocated',
                      nodes: '2 Worker Nodes',
                    },
                    {
                      id: 'Enterprise',
                      name: 'Enterprise Tier',
                      price: 18500,
                      storage: '100 TB Allocated',
                      nodes: '8 Worker Nodes',
                    },
                    {
                      id: 'Partner',
                      name: 'Partner Tier',
                      price: 35000,
                      storage: '500 TB Allocated',
                      nodes: '16 Dedicated Nodes',
                    },
                    {
                      id: 'Unlimited',
                      name: 'Unlimited Tier',
                      price: 75000,
                      storage: 'Unlimited Storage',
                      nodes: 'Autoscaling Nodes',
                    },
                  ].map((t) => {
                    const isSelected = newCustomer.tier === t.id;
                    const tierPrice = newCustomer.billingCycle === 'Annual' ? Math.round(t.price * 0.85) : t.price;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setNewCustomer({ ...newCustomer, tier: t.id as any })}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                          isSelected
                            ? 'bg-indigo-50/80 border-indigo-600 ring-2 ring-indigo-500/30 shadow-md'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-xs text-slate-900">{t.name}</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />}
                        </div>

                        <div className="text-base font-black text-indigo-600 font-mono">
                          ${tierPrice.toLocaleString()}
                          <span className="text-[10px] text-slate-500 font-normal"> /mo</span>
                        </div>

                        <div className="text-[10px] text-slate-500 font-mono space-y-0.5 border-t border-slate-200/60 pt-1.5">
                          <div>&bull; {t.storage}</div>
                          <div>&bull; {t.nodes}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 3: PAYMENT METHOD & INVOICING CONFIGURATION */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider font-mono flex items-center gap-2 text-indigo-600">
                  <Receipt className="w-4 h-4 text-indigo-600" />
                  3. Payment Method &amp; Purchase Order Authorization
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <label className="block font-bold text-slate-700 mb-1">Primary Payment Method</label>
                    <select
                      value={newCustomer.paymentMethod}
                      onChange={(e) => setNewCustomer({ ...newCustomer, paymentMethod: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                    >
                      <option value="Corporate PO / Invoice">Corporate PO / Invoice (NET 30)</option>
                      <option value="ACH Direct Wire Transfer">ACH Direct Wire Transfer</option>
                      <option value="Credit Card (*4242)">Corporate Credit Card (Visa / MC / Amex)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">PO / Reference Number</label>
                    <input
                      type="text"
                      placeholder="e.g. PO-2026-9921"
                      value={newCustomer.poNumber}
                      onChange={(e) => setNewCustomer({ ...newCustomer, poNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tax / VAT ID (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. US-9982312"
                      value={newCustomer.taxId}
                      onChange={(e) => setNewCustomer({ ...newCustomer, taxId: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: ENTERPRISE ADD-ONS */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider font-mono flex items-center gap-2 text-indigo-600">
                  <Zap className="w-4 h-4 text-indigo-600" />
                  4. Enterprise Add-ons
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'priority_sla', label: '24/7 Priority SLA & TAM', price: 1500 },
                    { id: 'anonymization', label: 'PII Anonymization Suite', price: 2000 },
                    { id: 'cdc_relay', label: 'Multi-Region CDC Relay', price: 2500 },
                  ].map((addon) => {
                    const isChecked = newCustomer.selectedAddons.includes(addon.id);
                    return (
                      <label
                        key={addon.id}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isChecked ? 'bg-indigo-50/70 border-indigo-400 font-bold' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <span className="text-slate-800 text-[11px]">{addon.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-indigo-600 font-mono font-black text-[11px]">+${addon.price}/mo</span>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewCustomer({ ...newCustomer, selectedAddons: [...newCustomer.selectedAddons, addon.id] });
                              } else {
                                setNewCustomer({
                                  ...newCustomer,
                                  selectedAddons: newCustomer.selectedAddons.filter((id) => id !== addon.id),
                                });
                              }
                            }}
                            className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                          />
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 5: LIVE CALCULATED INITIAL MRR SUMMARY */}
              <div className="bg-indigo-50 border border-indigo-200 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-[10px] text-indigo-300 font-mono uppercase font-bold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    Calculated Initial Monthly Recurring Revenue (MRR)
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-emerald-600 font-mono">
                      ${calculateNewCustomerMrr().toLocaleString()}
                      <span className="text-xs text-indigo-200 font-normal"> / month</span>
                    </span>
                    {newCustomer.billingCycle === 'Annual' && (
                      <span className="text-[10px] text-amber-300 font-bold bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                        Annual 15% Discount Applied
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-700">
                    Tier: <strong className="text-slate-900">{newCustomer.tier}</strong> | Payment Method: <strong className="text-slate-900">{newCustomer.paymentMethod}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowAddCustomerModal(false)}
                    className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl shadow-lg cursor-pointer transition-all flex items-center gap-1.5 text-xs"
                  >
                    <CheckCircle2 className="w-4 h-4 text-slate-950" />
                    <span>Authorize Billing &amp; Onboard Customer</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PROVISION NEW TENANT */}
      {showProvisionTenantModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Server className="w-5 h-5 text-indigo-600" />
                Provision Customer Tenant
              </h3>
              <button
                onClick={() => setShowProvisionTenantModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isProvisioning ? (
              <div className="py-8 space-y-4 text-center">
                <RefreshCcw className="w-10 h-10 text-indigo-600 animate-spin mx-auto" />
                <div className="space-y-1">
                  <h4 className="font-extrabold text-sm text-slate-900">Provisioning Isolated Tenant Engine</h4>
                  <p className="text-xs text-slate-500">{provisionStepText}</p>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${provisionProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <form onSubmit={handleProvisionTenant} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Customer Account</label>
                  <select
                    value={newTenant.customerId}
                    onChange={(e) => setNewTenant({ ...newTenant, customerId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tenant Cluster Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Acme-SAP-Production-Node"
                    value={newTenant.tenantName}
                    onChange={(e) => setNewTenant({ ...newTenant, tenantName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Cloud Region</label>
                    <select
                      value={newTenant.cloudRegion}
                      onChange={(e) => setNewTenant({ ...newTenant, cloudRegion: e.target.value as any })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                    >
                      <option value="Azure US East">Azure US East</option>
                      <option value="Azure EU West">Azure EU West</option>
                      <option value="AWS us-east-1">AWS us-east-1</option>
                      <option value="AWS eu-central-1">AWS eu-central-1</option>
                      <option value="GCP asia-east1">GCP asia-east1</option>
                      <option value="On-Prem Hybrid Agent">On-Prem Hybrid Agent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Cluster Worker Nodes</label>
                    <input
                      type="number"
                      min={2}
                      max={64}
                      value={newTenant.allocatedNodes}
                      onChange={(e) => setNewTenant({ ...newTenant, allocatedNodes: parseInt(e.target.value) || 4 })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowProvisionTenantModal(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md cursor-pointer"
                  >
                    Deploy Tenant Instance
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: STORAGE LIMIT ALERTS & AUTOMATED EMAIL ENGINE */}
      {showStorageAlertModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm max-w-4xl w-full max-h-[92vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="bg-white text-slate-900 p-6 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold uppercase flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                    Automated Alert Trigger Engine
                  </span>
                  <span className="text-xs text-slate-500 font-mono">SMTP &amp; System Integration</span>
                </div>
                <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  Data Migration Storage Quota &amp; Email Alert System
                </h3>
              </div>
              <button
                onClick={() => setShowStorageAlertModal(false)}
                className="p-1.5 rounded-xl hover:bg-white text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs bg-slate-50/50 flex-1">
              {/* Top Controls: Threshold & Channels */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Threshold Slider Card */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="font-extrabold text-slate-900 flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-indigo-600" />
                      Alert Threshold
                    </label>
                    <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-mono font-black text-sm border border-amber-200">
                      {storageAlertThresholdPct}% Quota
                    </span>
                  </div>
                  <input
                    type="range"
                    min={60}
                    max={95}
                    step={5}
                    value={storageAlertThresholdPct}
                    onChange={(e) => setStorageAlertThresholdPct(parseInt(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500 font-bold">
                    <span>60% (Early Warning)</span>
                    <span>80% (Default)</span>
                    <span>95% (Critical)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Triggers automated warnings when customer migration data reaches {storageAlertThresholdPct}% of allocated tenant capacity.
                  </p>
                </div>

                {/* Automation Toggles */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <label className="font-extrabold text-slate-900 block flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-indigo-600" />
                    Dispatch Channels
                  </label>

                  <div className="space-y-2">
                    <label className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100/70">
                      <span className="font-bold text-slate-700 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-indigo-600" /> Auto Email Customer &amp; Partner
                      </span>
                      <input
                        type="checkbox"
                        checked={enableAutoEmailAlerts}
                        onChange={(e) => setEnableAutoEmailAlerts(e.target.checked)}
                        className="w-4 h-4 accent-indigo-600 rounded"
                      />
                    </label>

                    <label className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100/70">
                      <span className="font-bold text-slate-700 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-emerald-600" /> Slack &amp; Teams Webhook
                      </span>
                      <input
                        type="checkbox"
                        checked={enableSlackAlerts}
                        onChange={(e) => setEnableSlackAlerts(e.target.checked)}
                        className="w-4 h-4 accent-indigo-600 rounded"
                      />
                    </label>
                  </div>
                </div>

                {/* Immediate Audit Trigger Action */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-slate-900 flex flex-col justify-between space-y-3 shadow-md">
                  <div>
                    <span className="text-[10px] font-mono uppercase font-bold text-indigo-300 block">Real-time Evaluator</span>
                    <h4 className="font-extrabold text-sm text-slate-900">Manual Audit &amp; Dispatch</h4>
                    <p className="text-[11px] text-slate-700 mt-1">
                      Instantly scan all customer accounts and dispatch warning emails for any exceeding {storageAlertThresholdPct}%.
                    </p>
                  </div>

                  <button
                    onClick={triggerStorageAuditAndAlerts}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" /> Run Quota Audit Now
                  </button>
                </div>
              </div>

              {/* Email Template Preview Studio */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <Mail className="w-4 h-4 text-indigo-600" />
                    Automated Notification Email Template Config
                  </h4>
                  <span className="text-[10px] font-mono text-slate-500">Merge tags: {"{{customer_code}}"}, {"{{pct_used}}"}, {"{{contact_name}}"}</span>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Email Subject Line</label>
                    <input
                      type="text"
                      value={emailTemplate.subject}
                      onChange={(e) => setEmailTemplate({ ...emailTemplate, subject: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 font-semibold"
                    />
                  </div>

                  <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 text-[11px] font-mono text-slate-800 space-y-1">
                    <div className="font-bold text-amber-900">Email Body Live Preview (Simulated Dispatch):</div>
                    <p className="text-slate-700">
                      Dear Customer Admin,<br />
                      Your ERP data migration storage buffer for <strong>[Customer Name]</strong> has reached <strong>[Storage %]</strong> of allocated capacity ([Used TB] TB / [Allocated TB] TB). To avoid migration throttling or sync suspension, please review your allocation or contact your partner team to provision additional storage nodes.
                    </p>
                  </div>
                </div>
              </div>

              {/* Managed Customer Storage Quota Matrix */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-3 p-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-600" />
                    Customer Storage Quotas &amp; Direct Email Dispatch
                  </h4>
                  <span className="text-xs text-amber-700 font-bold bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                    {customersNearingLimit.length} Accounts Near Threshold ({storageAlertThresholdPct}%+)
                  </span>
                </div>

                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-indigo-500/30">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono font-bold uppercase">
                        <th className="p-2.5">Code</th>
                        <th className="p-2.5">Customer Name</th>
                        <th className="p-2.5">Contact Email</th>
                        <th className="p-2.5">Used / Quota (TB)</th>
                        <th className="p-2.5">Utilization %</th>
                        <th className="p-2.5">Alert Status</th>
                        <th className="p-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {customers.map((c) => {
                        const info = getCustomerQuotaInfo(c);
                        return (
                          <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-2.5 font-mono font-bold text-indigo-600">{c.code}</td>
                            <td className="p-2.5 font-bold text-slate-900">{c.name}</td>
                            <td className="p-2.5 font-mono text-slate-600">{c.contactEmail}</td>
                            <td className="p-2.5 font-mono font-bold text-slate-800">
                              {info.usedTb.toFixed(1)} / {info.quotaTb} TB
                            </td>
                            <td className="p-2.5 min-w-[120px]">
                              <div className="flex items-center gap-2">
                                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      info.pctUsed >= 90 ? 'bg-red-500' : info.isNearingLimit ? 'bg-amber-500' : 'bg-indigo-600'
                                    }`}
                                    style={{ width: `${Math.min(100, info.pctUsed)}%` }}
                                  />
                                </div>
                                <span className="font-mono font-bold text-[11px]">{info.pctUsed}%</span>
                              </div>
                            </td>
                            <td className="p-2.5">
                              {info.isNearingLimit ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1 w-fit">
                                  <AlertTriangle className="w-3 h-3 text-amber-600" /> Near Limit
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 w-fit">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Normal
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 text-right">
                              <button
                                onClick={() => sendManualStorageWarningEmail(c)}
                                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-[11px] cursor-pointer inline-flex items-center gap-1 border border-indigo-200 transition-colors"
                              >
                                <Mail className="w-3 h-3 text-indigo-600" /> Send Email
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Automated Email Alert Dispatch History Log */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    Automated Alert Dispatch Log ({storageAlertLogs.length})
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono">Live SMTP Delivery Logs</span>
                </div>

                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-indigo-500/30 max-h-48 overflow-y-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse font-mono">
                    <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 text-slate-600 font-bold">
                      <tr>
                        <th className="p-2">Timestamp</th>
                        <th className="p-2">Customer</th>
                        <th className="p-2">Storage Usage</th>
                        <th className="p-2">Recipients</th>
                        <th className="p-2">Channel</th>
                        <th className="p-2 text-right">Delivery Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                      {storageAlertLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50">
                          <td className="p-2 text-slate-500">{log.timestamp}</td>
                          <td className="p-2 font-bold text-slate-900">
                            {log.customerName} ({log.customerCode})
                          </td>
                          <td className="p-2 font-bold text-amber-700">
                            {log.storageUsedTb} / {log.storageQuotaTb} TB ({log.pctUsed}%)
                          </td>
                          <td className="p-2 text-slate-600">{log.recipients.join(', ')}</td>
                          <td className="p-2">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]">
                              {log.channel}
                            </span>
                          </td>
                          <td className="p-2 text-right">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {log.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-100 p-4 border-t border-slate-200 flex items-center justify-between shrink-0 text-xs">
              <span className="text-slate-500 font-medium">
                Automated Storage Limits Engine &bull; Active Threshold: <strong>{storageAlertThresholdPct}%</strong>
              </span>
              <button
                onClick={() => setShowStorageAlertModal(false)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md cursor-pointer transition-colors"
              >
                Close Engine
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMER DETAILS & BILLING PLAN MANAGEMENT MODAL */}
      {selectedCustomerForDrawer && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="bg-white text-slate-900 p-5 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {selectedCustomerForDrawer.code}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Stage: {selectedCustomerForDrawer.deploymentStage}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Health {selectedCustomerForDrawer.healthScore}%
                  </span>
                </div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                  {selectedCustomerForDrawer.name}
                </h2>
                <p className="text-slate-500 text-xs">
                  ERP Ecosystem: <strong className="text-slate-900">{selectedCustomerForDrawer.erpEcosystem}</strong> | Region: <strong className="text-slate-900">{selectedCustomerForDrawer.region}</strong> | Account Manager: <strong className="text-slate-900">{selectedCustomerForDrawer.accountManager}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedAuditCustomerId(selectedCustomerForDrawer.id);
                    setActiveSubTab('activity');
                    setSelectedCustomerForDrawer(null);
                  }}
                  className="px-3 py-2 bg-indigo-600/90 hover:bg-indigo-500 text-slate-900 font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer flex items-center gap-1.5 border border-indigo-400/40"
                  title="View isolated real-time configuration changes and migration starts for this customer"
                >
                  <Radio className="w-3.5 h-3.5 text-indigo-200 animate-pulse" />
                  <span>Live Activity Feed</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedAuditCustomerId(selectedCustomerForDrawer.id);
                    setActiveSubTab('audit');
                    setSelectedCustomerForDrawer(null);
                  }}
                  className="px-3 py-2 bg-emerald-600/90 hover:bg-emerald-500 text-slate-900 font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer flex items-center gap-1.5 border border-emerald-400/40"
                  title="View complete compliance migration audit logs for this customer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Audit Logs</span>
                </button>

                <button
                  onClick={() => handleLaunchCustomerDashboard(selectedCustomerForDrawer)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Launch Customer Dashboard</span>
                </button>
                <button
                  onClick={() => setSelectedCustomerForDrawer(null)}
                  className="p-2 text-slate-500 hover:text-slate-900 hover:bg-white rounded-xl transition-colors cursor-pointer"
                  title="Close Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs bg-slate-50/50 flex-1 scrollbar-thin scrollbar-thumb-indigo-500/30">
              {(() => {
                const info = getCustomerQuotaInfo(selectedCustomerForDrawer);
                const currentMrr = calculatePlanMrr(editingBillingTier, editingBillingCycle, editingAddons);

                return (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Storage Quota Card */}
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                        <div className="flex items-center justify-between text-slate-500 font-bold uppercase text-[10px] font-mono">
                          <span className="flex items-center gap-1">
                            <Database className="w-3.5 h-3.5 text-indigo-500" /> Allocated Storage
                          </span>
                          <span className={info.isNearingLimit ? 'text-amber-600' : 'text-slate-700'}>
                            {info.pctUsed}% Used
                          </span>
                        </div>
                        <div className="text-xl font-black text-slate-900 font-mono">
                          {info.usedTb.toFixed(1)} / {info.quotaTb} TB
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              info.pctUsed >= 90 ? 'bg-red-500' : info.isNearingLimit ? 'bg-amber-500' : 'bg-indigo-600'
                            }`}
                            style={{ width: `${Math.min(100, info.pctUsed)}%` }}
                          />
                        </div>
                      </div>

                      {/* Calculated MRR Card */}
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                        <div className="flex items-center justify-between text-slate-500 font-bold uppercase text-[10px] font-mono">
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Active Monthly MRR
                          </span>
                          <span className="text-emerald-600 font-bold">{editingBillingCycle}</span>
                        </div>
                        <div className="text-xl font-black text-emerald-600 font-mono">
                          ${currentMrr.toLocaleString()}/mo
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          Tier: <strong className="text-slate-800">{editingBillingTier}</strong>
                        </div>
                      </div>

                      {/* Active Jobs & CDC Operations */}
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                        <div className="flex items-center justify-between text-slate-500 font-bold uppercase text-[10px] font-mono">
                          <span className="flex items-center gap-1">
                            <Activity className="w-3.5 h-3.5 text-indigo-500" /> CDC Migration Stream
                          </span>
                          <span className="text-indigo-600 font-bold animate-pulse">Live</span>
                        </div>
                        <div className="text-xl font-black text-slate-900 font-mono">
                          {(liveThroughputGbSec * 0.38).toFixed(2)} GB/s
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Active Jobs: <strong className="text-slate-800">{selectedCustomerForDrawer.activeJobs} Running</strong>
                        </div>
                      </div>

                      {/* Assigned Licenses & Tenants */}
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                        <div className="flex items-center justify-between text-slate-500 font-bold uppercase text-[10px] font-mono">
                          <span className="flex items-center gap-1">
                            <KeyRound className="w-3.5 h-3.5 text-indigo-500" /> Licenses &amp; Tenant
                          </span>
                          <span className="text-emerald-600 font-bold">Active</span>
                        </div>
                        <div className="text-xl font-black text-slate-900 font-mono">
                          {selectedCustomerForDrawer.assignedLicenses} Seats
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono truncate">
                          ID: {selectedCustomerForDrawer.tenantId}
                        </div>
                      </div>
                    </div>

                    {/* BILLING PLAN & COMMERCIAL TIER CONFIGURATION STUDIO */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                        <div>
                          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-indigo-600" />
                            Commercial Billing Plan &amp; Tier Management
                          </h3>
                          <p className="text-slate-500 text-xs">
                            Select the ERP migration capacity tier, billing frequency commitment, and enterprise add-ons.
                          </p>
                        </div>

                        {/* Billing Cycle Toggle */}
                        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 shrink-0">
                          <button
                            type="button"
                            onClick={() => setEditingBillingCycle('Monthly')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              editingBillingCycle === 'Monthly'
                                ? 'bg-white text-indigo-600 shadow-xs font-extrabold'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Monthly Billing
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingBillingCycle('Annual')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                              editingBillingCycle === 'Annual'
                                ? 'bg-indigo-600 text-white shadow-xs font-extrabold'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <span>Annual Commitment</span>
                            <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-amber-400 text-slate-900 font-black">
                              15% OFF
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Tier Options Selection */}
                      <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wider">
                          Select Service Tier &amp; Capacity Allocation:
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
                          {[
                            {
                              id: 'Trial',
                              name: 'Trial Period',
                              price: 0,
                              storage: '500 GB Storage',
                              nodes: '1 Shared Node',
                              support: 'Self-Service Support',
                            },
                            {
                              id: 'Starter',
                              name: 'Starter Plan',
                              price: 2500,
                              storage: '5 TB Storage',
                              nodes: '1 Worker Node',
                              support: 'Email Ticket Support',
                            },
                            {
                              id: 'Professional',
                              name: 'Professional',
                              price: 7500,
                              storage: '20 TB Storage',
                              nodes: '2 Worker Nodes',
                              support: '8x5 Business SLA',
                            },
                            {
                              id: 'Enterprise',
                              name: 'Enterprise Tier',
                              price: 18500,
                              storage: '100 TB Storage',
                              nodes: '8 Worker Nodes',
                              support: 'Dedicated TAM SLA',
                            },
                            {
                              id: 'Partner',
                              name: 'Partner Tier',
                              price: 35000,
                              storage: '500 TB Storage',
                              nodes: '16 Worker Nodes',
                              support: 'Global Success SLA',
                            },
                            {
                              id: 'Unlimited',
                              name: 'Unlimited Tier',
                              price: 75000,
                              storage: 'Unlimited Storage',
                              nodes: 'Autoscaling Nodes',
                              support: 'VIP Priority SLA',
                            },
                          ].map((t) => {
                            const isSelected = editingBillingTier === t.id;
                            const tierPrice = editingBillingCycle === 'Annual' ? Math.round(t.price * 0.85) : t.price;
                            return (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => setEditingBillingTier(t.id as any)}
                                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                                  isSelected
                                    ? 'bg-indigo-50/80 border-indigo-600 ring-2 ring-indigo-500/30 shadow-md'
                                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                                }`}
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-extrabold text-xs text-slate-900">{t.name}</span>
                                    {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />}
                                  </div>
                                  <div className="text-lg font-black text-indigo-600 font-mono">
                                    ${tierPrice.toLocaleString()}
                                    <span className="text-[10px] text-slate-500 font-normal">/mo</span>
                                  </div>
                                </div>

                                <div className="space-y-1 text-[11px] text-slate-600 border-t border-slate-200/60 pt-2">
                                  <div className="flex items-center gap-1 font-medium">
                                    <Database className="w-3 h-3 text-slate-500" /> {t.storage}
                                  </div>
                                  <div className="flex items-center gap-1 font-medium">
                                    <Cpu className="w-3 h-3 text-slate-500" /> {t.nodes}
                                  </div>
                                  <div className="flex items-center gap-1 font-medium text-slate-500">
                                    <Shield className="w-3 h-3 text-slate-500" /> {t.support}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Enterprise Add-ons Selection */}
                      <div className="space-y-3 border-t border-slate-100 pt-4">
                        <label className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wider">
                          Select Optional Enterprise Add-ons:
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                          {[
                            {
                              id: 'priority_sla',
                              label: '24/7 Priority SLA & Dedicated TAM',
                              price: 1500,
                              desc: 'Guaranteed 15-min response SLA and direct TAM hotline.',
                            },
                            {
                              id: 'anonymization',
                              label: 'Automated PII Anonymization Suite',
                              price: 2000,
                              desc: 'Real-time masking for GDPR & HIPAA compliant migrations.',
                            },
                            {
                              id: 'cdc_relay',
                              label: 'Dedicated Multi-Region CDC Relay',
                              price: 2500,
                              desc: 'High-speed encrypted cross-region streaming nodes.',
                            },
                            {
                              id: 'replay_buffer',
                              label: '30-Day Historical Replay Buffer',
                              price: 1000,
                              desc: 'Point-in-time transaction rollbacks & audit logs.',
                            },
                          ].map((addon) => {
                            const isChecked = editingAddons.includes(addon.id);
                            return (
                              <label
                                key={addon.id}
                                className={`p-3.5 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                                  isChecked
                                    ? 'bg-indigo-50/60 border-indigo-400 shadow-xs'
                                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setEditingAddons((prev) => [...prev, addon.id]);
                                    } else {
                                      setEditingAddons((prev) => prev.filter((id) => id !== addon.id));
                                    }
                                  }}
                                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                                />
                                <div className="space-y-0.5">
                                  <div className="font-bold text-slate-900 text-xs flex items-center justify-between">
                                    <span>{addon.label}</span>
                                    <span className="text-indigo-600 font-mono font-black shrink-0 ml-1">
                                      +${addon.price}/mo
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 leading-normal">{addon.desc}</p>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* Real-time Calculated MRR Box & Action Button */}
                      <div className="bg-indigo-50 border border-indigo-200 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="text-xs text-indigo-300 font-mono uppercase font-bold flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-600" />
                            Recalibrated Customer Monthly Recurring Revenue (MRR)
                          </div>
                          <div className="flex items-baseline gap-3">
                            <span className="text-3xl font-black text-emerald-600 font-mono">
                              ${currentMrr.toLocaleString()}
                              <span className="text-xs text-indigo-200 font-normal"> / month</span>
                            </span>
                            {editingBillingCycle === 'Annual' && (
                              <span className="text-xs text-amber-300 font-bold bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                                Annual Discount 15% Applied
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-700">
                            Includes base <strong className="text-slate-900">{editingBillingTier}</strong> tier + {editingAddons.length} enterprise add-on(s) ({editingBillingCycle} commitment).
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={handleSaveBillingPlan}
                          className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl shadow-lg transition-all transform hover:scale-102 cursor-pointer shrink-0 flex items-center justify-center gap-2 text-xs"
                        >
                          <CheckCircle2 className="w-4 h-4 text-slate-950" />
                          <span>Save &amp; Apply Billing Plan</span>
                        </button>
                      </div>
                    </div>

                    {/* PAYMENT METHOD & INVOICING HISTORY */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Payment & Contract Config */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                        <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                          <Receipt className="w-4 h-4 text-indigo-600" />
                          Payment Method &amp; Contract Terms
                        </h4>

                        <div className="space-y-3">
                          <div>
                            <label className="text-[11px] font-bold text-slate-600 block mb-1">
                              Primary Billing / Payment Method
                            </label>
                            <select
                              value={editingPaymentMethod}
                              onChange={(e) => setEditingPaymentMethod(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                            >
                              <option value="Corporate PO / Invoice">Corporate Invoice / Purchase Order (NET 30)</option>
                              <option value="ACH Direct Debit">ACH Direct Bank Transfer (*8821)</option>
                              <option value="Credit Card (*4242)">Corporate Credit Card (Visa *4242)</option>
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                                Next Invoice Date
                              </label>
                              <input
                                type="text"
                                readOnly
                                value="2026-09-01"
                                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-700"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                                Contract Expiration
                              </label>
                              <input
                                type="text"
                                readOnly
                                value={selectedCustomerForDrawer.contractRenewalDate}
                                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-700"
                              />
                            </div>
                          </div>

                          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                            <span className="font-bold text-slate-700 text-xs">Auto-Renew Annual Contract:</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editingAutoRenew}
                                onChange={(e) => setEditingAutoRenew(e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Recent Invoices Table */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-indigo-600" />
                            Recent Billing Invoices
                          </h4>
                          <span className="text-[10px] text-slate-500 font-mono">Paid (NET 30)</span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="border-b border-slate-200 text-slate-500 font-mono font-bold">
                                <th className="pb-2">Invoice #</th>
                                <th className="pb-2">Date</th>
                                <th className="pb-2">Amount</th>
                                <th className="pb-2">Status</th>
                                <th className="pb-2 text-right">PDF</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {[
                                { id: 'INV-2026-08', date: '2026-08-01', amount: `$${currentMrr.toLocaleString()}`, status: 'Paid' },
                                { id: 'INV-2026-07', date: '2026-07-01', amount: `$${selectedCustomerForDrawer.mrrAmount.toLocaleString()}`, status: 'Paid' },
                                { id: 'INV-2026-06', date: '2026-06-01', amount: `$${selectedCustomerForDrawer.mrrAmount.toLocaleString()}`, status: 'Paid' },
                              ].map((inv) => (
                                <tr key={inv.id} className="hover:bg-slate-50">
                                  <td className="py-2 font-mono font-bold text-slate-800">{inv.id}</td>
                                  <td className="py-2 text-slate-600 font-mono">{inv.date}</td>
                                  <td className="py-2 font-mono font-bold text-slate-900">{inv.amount}</td>
                                  <td className="py-2">
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                      {inv.status}
                                    </span>
                                  </td>
                                  <td className="py-2 text-right">
                                    <button
                                      type="button"
                                      onClick={() => showToast(`📥 Downloaded PDF Statement ${inv.id}`)}
                                      className="p-1 hover:bg-slate-200 rounded text-slate-600 cursor-pointer"
                                      title="Download PDF Invoice"
                                    >
                                      <Download className="w-3.5 h-3.5 text-indigo-600" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-100 p-4 border-t border-slate-200 flex items-center justify-between shrink-0 text-xs">
              <span className="text-slate-500 font-medium flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-emerald-600" /> Enterprise Partner SLA &amp; Billing Encryption Verified
              </span>
              <button
                type="button"
                onClick={() => setSelectedCustomerForDrawer(null)}
                className="px-5 py-2 bg-white hover:bg-slate-50 text-slate-900 font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REGISTER NEW PARTNER ORGANIZATION */}
      {showAddPartnerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm max-w-2xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="bg-white text-slate-900 p-6 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="space-y-1">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono font-bold uppercase flex items-center gap-1 w-max">
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                  Ecosystem Expansion
                </span>
                <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-indigo-600" />
                  Register New Implementation Partner
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddPartnerModal(false)}
                className="p-1.5 rounded-xl hover:bg-white text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleCreatePartner} className="p-6 space-y-4 text-xs bg-slate-50/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Partner Organization Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Capgemini Global Solutions"
                    value={newPartner.name}
                    onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Partner Code</label>
                  <input
                    type="text"
                    placeholder="e.g. CAPG-001"
                    value={newPartner.code}
                    onChange={(e) => setNewPartner({ ...newPartner, code: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Partner Tier</label>
                  <select
                    value={newPartner.tier}
                    onChange={(e) => setNewPartner({ ...newPartner, tier: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    <option value="Platinum Global Strategic Partner">Platinum Global Strategic Partner</option>
                    <option value="Gold Implementation Partner">Gold Implementation Partner</option>
                    <option value="Silver Regional Partner">Silver Regional Partner</option>
                    <option value="Managed Service Provider (MSP)">Managed Service Provider (MSP)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Region</label>
                  <select
                    value={newPartner.region}
                    onChange={(e) => setNewPartner({ ...newPartner, region: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    <option value="Global">Global</option>
                    <option value="EMEA">EMEA (Europe, Middle East, Africa)</option>
                    <option value="North America">North America</option>
                    <option value="APAC">APAC (Asia Pacific)</option>
                    <option value="Latin America">Latin America</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Account Manager / Director</label>
                  <input
                    type="text"
                    placeholder="e.g. Sarah Jenkins (Global Partner VP)"
                    value={newPartner.accountManager}
                    onChange={(e) => setNewPartner({ ...newPartner, accountManager: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Partner Contact Email</label>
                  <input
                    type="email"
                    placeholder="partner-ops@capgemini.com"
                    value={newPartner.contactEmail}
                    onChange={(e) => setNewPartner({ ...newPartner, contactEmail: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Custom CNAME Domain</label>
                <input
                  type="text"
                  placeholder="migration.capgemini.com"
                  value={newPartner.cnameDomain}
                  onChange={(e) => setNewPartner({ ...newPartner, cnameDomain: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-indigo-600 font-bold"
                />
              </div>

              <div className="p-3 bg-indigo-50/80 rounded-2xl border border-indigo-200 text-[11px] text-indigo-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
                <span>
                  Registering a new partner automatically creates an isolated Virtual Tenant Pool with custom SSL certificate bindings.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddPartnerModal(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-800 font-bold rounded-xl hover:bg-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register &amp; Isolate Partner Workspace</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: FINE-GRAINED ROLE ACCESS CONTROL (RBAC) POLICY MATRIX */}
      {showRbacMatrixModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm max-w-4xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 my-8">
            {/* Modal Header */}
            <div className="bg-white text-slate-900 p-6 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="space-y-1">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold uppercase flex items-center gap-1 w-max">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  Ecosystem Security Policy
                </span>
                <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-indigo-600" />
                  Fine-Grained Role-Based Access Control (RBAC) Matrix
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRbacMatrixModal(false)}
                className="p-1.5 rounded-xl hover:bg-white text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Table */}
            <div className="p-6 space-y-6 text-xs bg-slate-50/50 overflow-y-auto max-h-[75vh]">
              <div className="p-4 bg-indigo-50/80 rounded-2xl border border-indigo-200 text-indigo-950 space-y-1">
                <div className="font-extrabold text-sm flex items-center gap-2 text-indigo-900">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  Multi-Tenant Security &amp; Role Segmentation Architecture
                </div>
                <p className="text-xs text-indigo-800 leading-relaxed">
                  Permissions are strictly partitioned at runtime across organizational roles. Admins maintain full administrative governance, Analysts receive read-only strategy telemetries, and Support Engineers operate tenant health nodes with restricted access to financial MRR.
                </p>
              </div>

              {/* Active Role Selector Strip */}
              <div className="bg-white text-slate-900 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-mono font-bold uppercase text-[11px]">Simulate Active Session Role:</span>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold font-mono text-xs">
                    {userRole}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {(['Partner Admin', 'Partner Analyst', 'Partner Support'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        setUserRole(r);
                        showToast(`🔒 Role Switched to '${r}'`);
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                        userRole === r
                          ? 'bg-indigo-600 text-white shadow-md font-black'
                          : 'bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Matrix Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-mono font-bold uppercase text-[11px]">
                      <th className="p-3.5">Capability / Action</th>
                      <th className="p-3.5 text-center bg-indigo-50/50 text-indigo-900">
                        👑 Partner Admin
                      </th>
                      <th className="p-3.5 text-center bg-blue-50/50 text-blue-900">
                        📊 Partner Analyst
                      </th>
                      <th className="p-3.5 text-center bg-amber-50/50 text-amber-900">
                        🛠️ Partner Support
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      {
                        action: 'Onboard Partner Organizations',
                        desc: 'Create new partner entities and custom domain CNAME isolation',
                        admin: true,
                        analyst: false,
                        support: false,
                      },
                      {
                        action: 'Onboard & License Customers',
                        desc: 'Configure billing terms, POs, and add-on subscriptions',
                        admin: true,
                        analyst: false,
                        support: false,
                      },
                      {
                        action: 'Provision Tenant Clusters',
                        desc: 'Spin up dedicated migration worker nodes and TLS endpoints',
                        admin: true,
                        analyst: false,
                        support: true,
                      },
                      {
                        action: 'Restart Cluster Nodes & Operations',
                        desc: 'Execute real-time node restarts and CDC worker flushes',
                        admin: true,
                        analyst: false,
                        support: true,
                      },
                      {
                        action: 'Assign Enterprise License Packages',
                        desc: 'Grant feature entitlements and seats across customers',
                        admin: true,
                        analyst: false,
                        support: false,
                      },
                      {
                        action: 'Configure White-Label Branding',
                        desc: 'Edit partner logos, theme colors, and custom header banners',
                        admin: true,
                        analyst: false,
                        support: false,
                      },
                      {
                        action: 'View Reseller Financials & Revenue',
                        desc: 'Access MRR calculations, margins, and payout statements',
                        admin: true,
                        analyst: true,
                        support: false,
                      },
                      {
                        action: 'View Customer Health Dashboards',
                        desc: 'Monitor health scores, data volumes, and active jobs',
                        admin: true,
                        analyst: true,
                        support: true,
                      },
                      {
                        action: 'Access Migration Audit Logs',
                        desc: 'Inspect SOC 2 compliance trail and administrative events',
                        admin: true,
                        analyst: true,
                        support: true,
                      },
                      {
                        action: 'Assigned Customer Projects Filter',
                        desc: 'Restrict support view to specific assigned client projects',
                        admin: 'Global Scope',
                        analyst: 'Global Scope',
                        support: '🎯 Filter Active',
                      },
                    ].map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="p-3.5 space-y-0.5">
                          <div className="font-extrabold text-slate-900">{row.action}</div>
                          <div className="text-[10px] text-slate-500">{row.desc}</div>
                        </td>
                        <td className="p-3.5 text-center bg-indigo-50/20 font-bold">
                          {typeof row.admin === 'boolean' ? (
                            row.admin ? (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Full Access
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-[10px] font-mono font-bold inline-flex items-center gap-1">
                                <X className="w-3.5 h-3.5 text-red-600" /> Restricted
                              </span>
                            )
                          ) : (
                            <span className="font-mono text-indigo-700 font-extrabold">{row.admin}</span>
                          )}
                        </td>
                        <td className="p-3.5 text-center bg-blue-50/20 font-bold">
                          {typeof row.analyst === 'boolean' ? (
                            row.analyst ? (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Read Only
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-[10px] font-mono font-bold inline-flex items-center gap-1">
                                <X className="w-3.5 h-3.5 text-red-600" /> Restricted
                              </span>
                            )
                          ) : (
                            <span className="font-mono text-blue-700 font-extrabold">{row.analyst}</span>
                          )}
                        </td>
                        <td className="p-3.5 text-center bg-amber-50/20 font-bold">
                          {typeof row.support === 'boolean' ? (
                            row.support ? (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Ops Access
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-mono font-bold inline-flex items-center gap-1">
                                <Lock className="w-3 h-3 text-amber-600" /> Restricted
                              </span>
                            )
                          ) : (
                            <span className="font-mono text-amber-700 font-extrabold">{row.support}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
              <div className="text-[11px] text-slate-600 font-mono flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>RBAC Engine Status: <strong>Enforced via Runtime Guard Clauses</strong></span>
              </div>
              <button
                type="button"
                onClick={() => setShowRbacMatrixModal(false)}
                className="px-5 py-2 bg-white hover:bg-white text-slate-900 font-bold rounded-xl text-xs cursor-pointer"
              >
                Close Policy Matrix
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REAL-TIME CUSTOMER WORKSPACE DASHBOARD */}
      {selectedCustomerWorkspace && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm max-w-5xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 my-6 max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-slate-50 p-6 border-b border-slate-200 text-slate-900 flex items-center justify-between shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold flex items-center gap-1">
                    <Radio className={`w-3 h-3 text-emerald-600 ${isLiveStreaming ? 'animate-pulse' : ''}`} />
                    {isLiveStreaming ? '⚡ REAL-TIME STREAM ACTIVE' : '⏸ STREAM PAUSED'}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-[10px] font-mono font-bold">
                    Code: {selectedCustomerWorkspace.code}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white text-slate-700 border border-slate-100 text-[10px] font-bold">
                    Partner: {selectedCustomerWorkspace.partnerName || 'Avanade'}
                  </span>
                </div>
                <h3 className="font-black text-xl text-slate-900 flex items-center gap-2">
                  <Building2 className="w-6 h-6 text-indigo-600" />
                  {selectedCustomerWorkspace.name} Workspace
                </h3>
                <p className="text-xs text-slate-700">
                  ERP Ecosystem: <strong className="text-slate-900">{selectedCustomerWorkspace.erpEcosystem}</strong> | Deployment Stage: <strong className="text-amber-300">{selectedCustomerWorkspace.deploymentStage}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (onNavigateTab) onNavigateTab('dashboard');
                    setSelectedCustomerWorkspace(null);
                    showToast(`⚡ Redirecting to Main Migration Dashboard with ${selectedCustomerWorkspace.name} active context.`);
                  }}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer border border-indigo-400/40"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Main App Dashboard</span>
                </button>
                <button
                  onClick={() => setSelectedCustomerWorkspace(null)}
                  className="p-2 text-slate-500 hover:text-slate-900 hover:bg-white rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Real-time Telemetry Controls & Live Gauges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase font-mono text-indigo-700">Data Volume Migrated</span>
                  <div className="text-2xl font-black text-indigo-900 font-mono">
                    {selectedCustomerWorkspace.dataMigratedTb.toFixed(2)} TB
                  </div>
                  <div className="text-[11px] text-indigo-600 font-medium">
                    Quota: {getCustomerQuotaInfo(selectedCustomerWorkspace).quotaTb} TB ({getCustomerQuotaInfo(selectedCustomerWorkspace).pctUsed}% used)
                  </div>
                  <div className="w-full bg-indigo-200 h-1.5 rounded-full overflow-hidden mt-2">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, getCustomerQuotaInfo(selectedCustomerWorkspace).pctUsed)}%` }}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase font-mono text-emerald-700">Live CDC Throughput</span>
                  <div className="text-2xl font-black text-emerald-900 font-mono flex items-center gap-1.5">
                    <Zap className="w-5 h-5 text-emerald-600" />
                    {((selectedCustomerWorkspace.dataMigratedTb * 0.04) + 1.25).toFixed(2)} GB/s
                  </div>
                  <div className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                    <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
                    Peak Burst ~2.8 GB/s
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase font-mono text-slate-500">CDC Engine Event Rate</span>
                  <div className="text-2xl font-black text-slate-900 font-mono">
                    {(14200 + Math.floor(selectedCustomerWorkspace.dataMigratedTb * 120)).toLocaleString()} ops/s
                  </div>
                  <div className="text-[11px] text-slate-500">Zero sync delta backlog</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase font-mono text-slate-500">SLA Health Score</span>
                  <div className="text-2xl font-black text-emerald-600 font-mono">
                    {selectedCustomerWorkspace.healthScore}%
                  </div>
                  <div className="text-[11px] text-emerald-600 font-bold">100% SLA Uptime Guaranteed</div>
                </div>
              </div>

              {/* Real-time Controls Toolbar */}
              <div className="p-4 rounded-2xl bg-white text-slate-900 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Radio className={`w-4 h-4 text-emerald-600 ${isLiveStreaming ? 'animate-pulse' : ''}`} />
                    <span className="font-bold">Streaming State:</span>
                    <strong className="text-emerald-600 font-mono">{isLiveStreaming ? 'ACTIVE' : 'PAUSED'}</strong>
                  </div>
                  <span className="text-slate-500">|</span>
                  <div className="text-slate-700">
                    Last CDC Checkpoint: <strong className="text-slate-900 font-mono">{lastLiveUpdate}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsLiveStreaming(!isLiveStreaming);
                      showToast(isLiveStreaming ? '⏸ Streaming paused for customer.' : '▶ Streaming resumed for customer.');
                    }}
                    className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-900 font-bold rounded-xl border border-slate-100 cursor-pointer flex items-center gap-1"
                  >
                    {isLiveStreaming ? <Pause className="w-3.5 h-3.5 text-amber-600" /> : <Play className="w-3.5 h-3.5 text-emerald-600" />}
                    <span>{isLiveStreaming ? 'Pause Streaming' : 'Resume Streaming'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedCustomerWorkspace((prev) =>
                        prev ? { ...prev, dataMigratedTb: +(prev.dataMigratedTb + 0.05).toFixed(2) } : null
                      );
                      setCustomers((prev) =>
                        prev.map((c) =>
                          c.id === selectedCustomerWorkspace.id
                            ? { ...c, dataMigratedTb: +(c.dataMigratedTb + 0.05).toFixed(2) }
                            : c
                        )
                      );
                      showToast(`⚡ Real-Time Delta Burst Executed! Added +0.05 TB to ${selectedCustomerWorkspace.name}.`);
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    <span>Simulate CDC Burst (+0.05 TB)</span>
                  </button>
                </div>
              </div>

              {/* Active Pipeline Jobs & Connector Nodes */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-600" />
                    Active Migration Pipelines for {selectedCustomerWorkspace.name}
                  </h4>
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-mono text-[10px] font-bold">
                    {selectedCustomerWorkspace.activeJobs} Jobs Provisioned
                  </span>
                </div>

                <div className="space-y-3">
                  {[
                    { name: `${selectedCustomerWorkspace.erpEcosystem} Finance & GL Delta Engine`, target: 'Business Central Production', rps: '1,840 RPS', progress: 88, status: 'Running' },
                    { name: 'Customer Master & AR Replication Stream', target: 'Business Central Data Lake', rps: '2,150 RPS', progress: 94, status: 'Running' },
                    { name: 'Inventory & Warehouse Balances CDC', target: 'Azure SQL Staging', rps: '920 RPS', progress: 76, status: 'Running' },
                  ].map((pipe, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{pipe.name}</span>
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono">
                            {pipe.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Target Endpoint: <strong className="text-slate-700">{pipe.target}</strong> | Rate: <strong className="text-emerald-600 font-mono">{pipe.rps}</strong>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-48 shrink-0">
                        <div className="w-full space-y-1">
                          <div className="flex justify-between text-[10px] font-mono text-slate-500">
                            <span>Pipeline Sync</span>
                            <span>{pipe.progress}%</span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${pipe.progress}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Account Metadata & Infrastructure Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <h5 className="font-extrabold text-slate-900 flex items-center gap-2">
                    <Server className="w-4 h-4 text-indigo-600" /> Tenant Infrastructure Settings
                  </h5>
                  <div className="space-y-1.5 text-slate-600 text-[11px]">
                    <div className="flex justify-between">
                      <span>Tenant Instance ID:</span>
                      <strong className="font-mono text-slate-900">{selectedCustomerWorkspace.tenantId}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Region:</span>
                      <strong className="text-slate-900">{selectedCustomerWorkspace.region}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Cloud SLA Guarantee:</span>
                      <strong className="text-emerald-600">99.98% High Availability</strong>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <h5 className="font-extrabold text-slate-900 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-indigo-600" /> Commercial Contract & Plan
                  </h5>
                  <div className="space-y-1.5 text-slate-600 text-[11px]">
                    <div className="flex justify-between">
                      <span>Subscription Tier:</span>
                      <strong className="text-indigo-600 font-bold">{selectedCustomerWorkspace.tier}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Monthly Revenue (MRR):</span>
                      <strong className="text-slate-900 font-bold">${selectedCustomerWorkspace.mrrAmount.toLocaleString()}/mo</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Account Manager:</span>
                      <strong className="text-slate-900">{selectedCustomerWorkspace.accountManager}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Isolated Real-Time Activity Feed for this Customer */}
              <div className="border-t border-slate-200 pt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <Radio className="w-4 h-4 text-indigo-600 animate-pulse" />
                    Isolated Customer Activity &amp; Configuration Log
                  </h4>
                  <span className="text-xs text-slate-500 font-mono">
                    Tracking real-time configuration changes &amp; migration starts for {selectedCustomerWorkspace.code}
                  </span>
                </div>

                <LiveActivityFeed
                  events={liveActivityEvents}
                  customers={customers}
                  isolatedCustomerId={selectedCustomerWorkspace.id}
                  currentRole={userRole}
                  isLiveStreaming={isLiveStreaming}
                  onToggleStreaming={() => setIsLiveStreaming(!isLiveStreaming)}
                  onSimulateConfigChange={() => {
                    if (!selectedCustomerWorkspace) return;
                    pushActivityEvent(
                      'CONFIG_CHANGE',
                      'Storage Quota & SLA Upgrade Applied',
                      `Storage quota for ${selectedCustomerWorkspace.name} increased by +10.0 TB with 24/7 Priority SLA enabled.`,
                      selectedCustomerWorkspace,
                      'Elena Rostova (Account Mgr)',
                      'Partner Analyst',
                      {
                        'Action': 'Quota Boost',
                        'Added Quota': '+10 TB',
                        'SLA Level': '24/7 Dedicated TAM',
                      },
                      'info'
                    );
                    showToast(`⚙️ Config change event recorded for ${selectedCustomerWorkspace.name}!`);
                  }}
                  onSimulateMigrationStart={() => {
                    if (!selectedCustomerWorkspace) return;
                    pushActivityEvent(
                      'MIGRATION_START',
                      'Real-Time CDC Delta Synchronization Started',
                      `CDC pipeline stream initiated for ${selectedCustomerWorkspace.name} (${selectedCustomerWorkspace.erpEcosystem}).`,
                      selectedCustomerWorkspace,
                      'Marcus Vance (Partner Lead)',
                      'Partner Admin',
                      {
                        'ERP Source': selectedCustomerWorkspace.erpEcosystem,
                        'Target Cloud': selectedCustomerWorkspace.region,
                        'Worker Thread Count': 8,
                        'Initial Rate': '2.18 GB/s',
                      },
                      'success'
                    );
                    showToast(`🚀 Migration start event recorded for ${selectedCustomerWorkspace.name}!`);
                  }}
                />
              </div>
            </div>


            {/* Modal Footer */}
            <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-500 font-mono">
                Real-Time Telemetry Pipeline ID: <strong className="text-slate-800">rt-pipe-{selectedCustomerWorkspace.id}</strong>
              </span>
              <button
                type="button"
                onClick={() => setSelectedCustomerWorkspace(null)}
                className="px-5 py-2 bg-white hover:bg-white text-slate-900 font-bold rounded-xl text-xs cursor-pointer shadow-xs"
              >
                Close Customer Workspace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerPortalView;
