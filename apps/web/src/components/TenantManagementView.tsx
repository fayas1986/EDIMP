import React, { useState, useEffect } from 'react';
import { MultiTenantArchitectureHub } from './MultiTenantArchitectureHub';
import {
  Users,
  Shield,
  Server,
  RefreshCw,
  Layers,
  Sliders,
  Database,
  CreditCard,
  Play,
  Plus,
  Trash2,
  Edit3,
  Settings,
  ShieldCheck,
  AlertCircle,
  CheckCircle,
  Info,
  Download,
  Save,
  Check,
  Search,
  Lock,
  KeyRound,
  Globe,
  FileText,
  ChevronRight,
  Activity,
  Cpu,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Eye,
  Settings2,
  BookOpen,
  TrendingUp,
  AlertTriangle,
  Upload,
  Image,
  X,
  QrCode,
  Smartphone,
  Building2,
  Briefcase,
  Plug,
  LayoutDashboard,
  BarChart3,
  Clock,
  ArrowUpRight,
  PieChart,
  Copy,
  SearchCode,
  Pause,
  Mail,
  FileSpreadsheet,
  Table,
  CheckCircle2,
  Terminal,
  Send,
  Calendar
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { UserRole } from '../types';

// Define structures for our multi-tenant models
interface TenantBranding {
  portalTitle: string;
  themeColor: 'sapphire' | 'emerald' | 'amber' | 'rose' | 'slate';
  logoText: string;
  logoUrl?: string;
  customCss?: string;
}

interface TenantResources {
  memoryGb: number;
  vCpus: number;
  storageGb: number;
  apiRateLimitRps: number;
  maxUserAccounts: number;
}

interface TenantConfig {
  subdomain: string;
  ssoProvider: 'None' | 'Google Workspace' | 'Microsoft Entra ID' | 'Okta SAML';
  ssoMetadataUrl: string;
  webhookCallbackUrl: string;
  dbClusterHost: string;
}

interface TenantBackup {
  id: string;
  timestamp: string;
  sizeMb: number;
  status: 'Completed' | 'Restored' | 'Failed';
  triggeredBy: string;
  checksum: string;
}

interface TenantInvoice {
  id: string;
  date: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue';
  paymentMethod: string;
}

interface MfaDevice {
  id: string;
  name: string;
  type: 'Authenticator App' | 'Hardware Key';
  appName?: 'Google Authenticator' | 'Microsoft Authenticator' | 'Authy' | 'Duo Mobile';
  pairedAt: string;
  lastUsedAt?: string;
  isActive: boolean;
}

interface TenantSubscription {
  tier: 'Trial' | 'Starter' | 'Professional' | 'Enterprise' | 'Partner' | 'Unlimited';
  status: 'Active' | 'Suspended' | 'Expired';
  priceMonthly: number;
  billingCycle: 'Monthly' | 'Yearly';
  startDate: string;
  nextRenewalDate: string;
  autoRenew: boolean;
}

interface Tenant {
  id: string;
  name: string;
  partnerId: string;
  partnerName: string;
  isActive: boolean;
  status: 'Active' | 'Deactivated' | 'Provisioning';
  createdAt: string;
  primaryContact: string;
  adminEmail: string;
  region: 'US-East' | 'EU-Central' | 'AP-South' | 'SA-East';
  subscription: TenantSubscription;
  branding: TenantBranding;
  resources: TenantResources;
  config: TenantConfig;
  backups: TenantBackup[];
  invoices: TenantInvoice[];
}

export interface OrgProject {
  id: string;
  name: string;
  status: 'In Progress' | 'Completed' | 'Delayed' | 'Planned';
  progress: number;
  lastSync: string;
}

export interface OrgUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Inactive';
}

export interface OrgConnector {
  id: string;
  name: string;
  type: string;
  status: 'Healthy' | 'Warning' | 'Error';
  throughput: string;
}

export interface OrgReport {
  id: string;
  title: string;
  type: 'Financial Audit' | 'Compliance Log' | 'Operational Analytics' | 'System Health';
  generatedAt: string;
  size: string;
}

export interface Organization {
  id: string;
  name: string;
  erp: string;
  erpHost: string;
  erpStatus: 'Active' | 'Synced' | 'Error' | 'Pending';
  createdAt: string;
  projects: OrgProject[];
  users: OrgUser[];
  connectors: OrgConnector[];
  reports: OrgReport[];
}

interface TenantAuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  category: 'Provisioning' | 'Configuration' | 'Security' | 'Billing' | 'Backup';
  severity: 'Info' | 'Success' | 'Warning' | 'Danger';
  description: string;
}

const INITIAL_AUDIT_LOGS: Record<string, TenantAuditLog[]> = {
  'tenant-acme': [
    {
      id: 'log-acme-1',
      timestamp: '2026-08-07 10:15:30',
      actor: 'Wile E. Coyote (Primary Admin)',
      action: 'Branding Reconfigured',
      category: 'Configuration',
      severity: 'Success',
      description: 'Main color theme updated to sapphire. Logo text synchronized.'
    },
    {
      id: 'log-acme-2',
      timestamp: '2026-08-06 14:02:11',
      actor: 'System Scheduler',
      action: 'Automatic Backup Executed',
      category: 'Backup',
      severity: 'Success',
      description: 'Scheduled backup snapshot bak-001 created (1.24 GB) with hash checksum verification.'
    },
    {
      id: 'log-acme-3',
      timestamp: '2026-08-05 09:44:22',
      actor: 'Sarah Jenkins (Super Admin)',
      action: 'Database Storage Resized',
      category: 'Configuration',
      severity: 'Info',
      description: 'Dedicated database storage limit scaled up to 2000 GB.'
    },
    {
      id: 'log-acme-4',
      timestamp: '2026-08-04 16:30:15',
      actor: 'System Gateway',
      action: 'SSO Provider Synced',
      category: 'Security',
      severity: 'Success',
      description: 'SAML 2.0 configuration verified with Google Workspace at accounts.google.com.'
    },
    {
      id: 'log-acme-5',
      timestamp: '2025-01-15 08:30:00',
      actor: 'System Provisioning Engine',
      action: 'Workspace Provisioned',
      category: 'Provisioning',
      severity: 'Success',
      description: 'Isolated PostgreSQL schema bounds established in US-East with initial Enterprise subscription.'
    }
  ],
  'tenant-globex': [
    {
      id: 'log-globex-1',
      timestamp: '2026-08-07 09:40:12',
      actor: 'David Vance (Platform Admin)',
      action: 'API Throttling Limits Modified',
      category: 'Configuration',
      severity: 'Warning',
      description: 'API gateway transaction rate limit elevated from 500 req/s to 1000 req/s to accommodate heavy webhook traffic.'
    },
    {
      id: 'log-globex-2',
      timestamp: '2026-08-05 03:00:00',
      actor: 'System Scheduler',
      action: 'Automatic Backup Executed',
      category: 'Backup',
      severity: 'Success',
      description: 'Scheduled backup snapshot bak-003 completed (680 MB).'
    },
    {
      id: 'log-globex-3',
      timestamp: '2026-08-03 11:23:45',
      actor: 'Hank Scorpio (Primary Admin)',
      action: 'SSO Integration Authenticated',
      category: 'Security',
      severity: 'Success',
      description: 'Federated Microsoft Entra ID authentication verified and locked to globex.com.'
    },
    {
      id: 'log-globex-4',
      timestamp: '2025-04-10 14:15:00',
      actor: 'System Provisioning Engine',
      action: 'Workspace Provisioned',
      category: 'Provisioning',
      severity: 'Success',
      description: 'Isolated PostgreSQL schema bounds established in EU-Central on Standard tier.'
    }
  ],
  'tenant-initech': [
    {
      id: 'log-initech-1',
      timestamp: '2026-04-01 00:00:00',
      actor: 'Billing Engine',
      action: 'Workspace Suspended',
      category: 'Billing',
      severity: 'Danger',
      description: 'Tenant deactivated due to past-due invoice inv-301 ($300.00).'
    },
    {
      id: 'log-initech-2',
      timestamp: '2026-03-15 10:00:00',
      actor: 'Peter Gibbons (Primary Admin)',
      action: 'Manual Snapshot Triggered',
      category: 'Backup',
      severity: 'Success',
      description: 'Manual snapshot bak-004 created successfully (245 MB).'
    },
    {
      id: 'log-initech-3',
      timestamp: '2025-09-01 11:00:00',
      actor: 'System Provisioning Engine',
      action: 'Workspace Provisioned',
      category: 'Provisioning',
      severity: 'Success',
      description: 'Isolated database schema established on US-East cloud cluster on Standard tier.'
    }
  ],
  'tenant-weyland': [
    {
      id: 'log-weyland-1',
      timestamp: '2026-08-07 08:12:05',
      actor: 'Elena Rostova (Partner Admin)',
      action: 'Compute Resources Rescaled',
      category: 'Configuration',
      severity: 'Success',
      description: 'Provisioned vCPUs scaled to 32 vCPUs. Allocated memory limit scaled to 128 GB.'
    },
    {
      id: 'log-weyland-2',
      timestamp: '2026-08-03 01:15:00',
      actor: 'System Scheduler',
      action: 'Automatic Backup Executed',
      category: 'Backup',
      severity: 'Success',
      description: 'Scheduled backup snapshot bak-005 completed (4.52 GB).'
    },
    {
      id: 'log-weyland-3',
      timestamp: '2025-03-22 06:12:00',
      actor: 'System Provisioning Engine',
      action: 'Workspace Provisioned',
      category: 'Provisioning',
      severity: 'Success',
      description: 'Isolated enterprise cluster space established in AP-South with unlimited user caps.'
    }
  ]
};

const INITIAL_MFA_DEVICES: Record<string, MfaDevice[]> = {
  'tenant-acme': [
    {
      id: 'mfa-acme-1',
      name: "Wile E's Pixel 9 Pro",
      type: 'Authenticator App',
      appName: 'Google Authenticator',
      pairedAt: '2026-08-04 16:30:15',
      lastUsedAt: '2026-08-07 09:12:45',
      isActive: true
    }
  ],
  'tenant-globex': [
    {
      id: 'mfa-globex-1',
      name: "Primary Security Key (Admin)",
      type: 'Hardware Key',
      pairedAt: '2026-07-15 11:10:00',
      lastUsedAt: '2026-08-06 18:33:10',
      isActive: true
    }
  ],
  'tenant-initech': [],
  'tenant-weyland': [
    {
      id: 'mfa-weyland-1',
      name: "Weyland Admin iPhone 16 Pro",
      type: 'Authenticator App',
      appName: 'Microsoft Authenticator',
      pairedAt: '2026-08-01 08:45:10',
      lastUsedAt: '2026-08-07 06:15:30',
      isActive: true
    }
  ]
};

// Initial organizations database map segmented by tenant ID
export const INITIAL_ORGANIZATIONS: Record<string, Organization[]> = {
  'tenant-acme': [
    {
      id: 'org-acme-mfg',
      name: 'Acme Manufacturing',
      erp: 'SAP S/4HANA (v2023)',
      erpHost: 'sap-ecc.mfg.acme.internal:443',
      erpStatus: 'Synced',
      createdAt: '2025-02-10',
      projects: [
        { id: 'proj-acme-1', name: 'S/4HANA Finance Integration', status: 'In Progress', progress: 65, lastSync: '2026-08-07 14:30:22' },
        { id: 'proj-acme-2', name: 'Supply Chain Sync', status: 'Completed', progress: 100, lastSync: '2026-08-06 09:12:15' },
        { id: 'proj-acme-3', name: 'CO-PA Reconciliation', status: 'Delayed', progress: 35, lastSync: '2026-08-05 18:45:00' }
      ],
      users: [
        { id: 'usr-acme-1', name: 'Wile E. Coyote', email: 'wcoyote@acme.com', role: 'Global Admin', status: 'Active' },
        { id: 'usr-acme-2', name: 'Road Runner', email: 'rrunner@acme.com', role: 'Auditor', status: 'Active' },
        { id: 'usr-acme-3', name: 'Elmer Fudd', email: 'efudd@acme.com', role: 'Data Engineer', status: 'Inactive' }
      ],
      connectors: [
        { id: 'conn-acme-1', name: 'SAP RFC Connector', type: 'SAP RFC', status: 'Healthy', throughput: '450 records/sec' },
        { id: 'conn-acme-2', name: 'AWS S3 Glacier Sink', type: 'S3 Target', status: 'Healthy', throughput: '1.2 GB/hr' },
        { id: 'conn-acme-3', name: 'Event Bridge Webhook', type: 'Webhook', status: 'Healthy', throughput: '15 req/min' }
      ],
      reports: [
        { id: 'rep-acme-1', title: 'Q2 Ledger Reconciliation Audit', type: 'Financial Audit', generatedAt: '2026-08-01 12:00:00', size: '4.8 MB' },
        { id: 'rep-acme-2', title: 'CO-PA Sync Completeness Logs', type: 'System Health', generatedAt: '2026-08-07 02:30:00', size: '12.4 MB' }
      ]
    },
    {
      id: 'org-acme-rtl',
      name: 'Acme Retail',
      erp: 'Oracle Fusion Cloud ERP',
      erpHost: 'oracle-fusion.rtl.acme.oraclecloud.com',
      erpStatus: 'Active',
      createdAt: '2025-05-18',
      projects: [
        { id: 'proj-acme-4', name: 'POS Ledger Consolidation', status: 'In Progress', progress: 80, lastSync: '2026-08-07 15:10:00' },
        { id: 'proj-acme-5', name: 'Customer Loyalty Database Sync', status: 'Planned', progress: 0, lastSync: 'Never' }
      ],
      users: [
        { id: 'usr-acme-4', name: 'Bugs Bunny', email: 'bbunny@acme.com', role: 'Business Owner', status: 'Active' },
        { id: 'usr-acme-5', name: 'Daffy Duck', email: 'dduck@acme.com', role: 'Billing Manager', status: 'Active' }
      ],
      connectors: [
        { id: 'conn-acme-4', name: 'Oracle REST Gateway', type: 'REST Endpoint', status: 'Healthy', throughput: '180 records/sec' },
        { id: 'conn-acme-5', name: 'Snowflake Analytics Sink', type: 'Snowflake Load', status: 'Warning', throughput: 'Intermittent' }
      ],
      reports: [
        { id: 'rep-acme-3', title: 'Global Retail Tax Alignment Log', type: 'Compliance Log', generatedAt: '2026-07-15 08:00:00', size: '2.1 MB' }
      ]
    },
    {
      id: 'org-acme-log',
      name: 'Acme Logistics',
      erp: 'Microsoft Dynamics 365 Finance',
      erpHost: 'dynamics-ax.logistics.acme.dynamics.com',
      erpStatus: 'Synced',
      createdAt: '2025-08-22',
      projects: [
        { id: 'proj-acme-6', name: 'Fleet Depreciation Alignment', status: 'Completed', progress: 100, lastSync: '2026-08-04 11:20:10' }
      ],
      users: [
        { id: 'usr-acme-6', name: 'Tasmanian Devil', email: 'tdevil@acme.com', role: 'Operator', status: 'Active' }
      ],
      connectors: [
        { id: 'conn-acme-6', name: 'Dynamics OData Connector', type: 'OData feed', status: 'Healthy', throughput: '320 records/sec' }
      ],
      reports: [
        { id: 'rep-acme-4', title: 'Asset Depreciation Schedule', type: 'Financial Audit', generatedAt: '2026-08-01 09:00:00', size: '1.4 MB' }
      ]
    }
  ],
  'tenant-globex': [
    {
      id: 'org-globex-mfg',
      name: 'Globex Manufacturing',
      erp: 'SAP ERP Central Component (ECC 6.0)',
      erpHost: 'sap-ecc.mfg.globex.internal:443',
      erpStatus: 'Synced',
      createdAt: '2025-04-12',
      projects: [
        { id: 'proj-globex-1', name: 'ECC to Iceberg Pipeline', status: 'In Progress', progress: 95, lastSync: '2026-08-07 16:00:15' }
      ],
      users: [
        { id: 'usr-globex-1', name: 'Hank Scorpio', email: 'scorpio@globex.com', role: 'Owner', status: 'Active' }
      ],
      connectors: [
        { id: 'conn-globex-1', name: 'Globex Staging Bus', type: 'Kafka Stream', status: 'Healthy', throughput: '1,500 records/sec' }
      ],
      reports: [
        { id: 'rep-globex-1', title: 'Staging Bus Parity Report', type: 'System Health', generatedAt: '2026-08-07 01:00:00', size: '25.6 MB' }
      ]
    },
    {
      id: 'org-globex-chem',
      name: 'Globex Retail & Supply',
      erp: 'NetSuite ERP (SuiteCloud)',
      erpHost: 'system.netsuite.globex-retail.com',
      erpStatus: 'Active',
      createdAt: '2025-06-25',
      projects: [
        { id: 'proj-globex-2', name: 'NetSuite Ledger Consolidation', status: 'Planned', progress: 0, lastSync: 'Never' }
      ],
      users: [
        { id: 'usr-globex-2', name: 'Gloria Scorpio', email: 'gscorpio@globex.com', role: 'Auditor', status: 'Active' }
      ],
      connectors: [
        { id: 'conn-globex-2', name: 'NetSuite SuiteTalk API', type: 'SOAP Client', status: 'Healthy', throughput: '50 records/sec' }
      ],
      reports: []
    }
  ],
  'tenant-initech': [
    {
      id: 'org-initech-fin',
      name: 'Initech Financials',
      erp: 'Oracle JD Edwards EnterpriseOne',
      erpHost: 'jde.fin.initech.com',
      erpStatus: 'Error',
      createdAt: '2025-09-10',
      projects: [
        { id: 'proj-ini-1', name: 'Y2K Auditing Pipeline', status: 'Delayed', progress: 12, lastSync: '2026-03-12 10:15:30' }
      ],
      users: [
        { id: 'usr-ini-1', name: 'Peter Gibbons', email: 'pgibbons@initech.com', role: 'Business Administrator', status: 'Active' },
        { id: 'usr-ini-2', name: 'Milton Waddams', email: 'mwaddams@initech.com', role: 'Inventory Specialist', status: 'Inactive' }
      ],
      connectors: [
        { id: 'conn-ini-1', name: 'Legacy ODBC Bridge', type: 'ODBC JDBC', status: 'Error', throughput: '0 records/sec' }
      ],
      reports: [
        { id: 'rep-ini-1', title: 'TPS Report Compilation Audit', type: 'Compliance Log', generatedAt: '2026-03-01 08:30:00', size: '840 KB' }
      ]
    }
  ],
  'tenant-weyland': [
    {
      id: 'org-weyland-mining',
      name: 'Weyland Terran Mining',
      erp: 'SAP S/4HANA Custom Instance',
      erpHost: 's4.terran-mining.weyland.corp',
      erpStatus: 'Synced',
      createdAt: '2025-03-30',
      projects: [
        { id: 'proj-wey-1', name: 'Ore Throughput Ledger Consolidation', status: 'In Progress', progress: 50, lastSync: '2026-08-07 10:45:00' },
        { id: 'proj-wey-2', name: 'Heavy Machinery Asset Depreciation', status: 'Completed', progress: 100, lastSync: '2026-08-02 08:00:00' }
      ],
      users: [
        { id: 'usr-wey-1', name: 'Carter Burke', email: 'burke@weyland.com', role: 'Enterprise Administrator', status: 'Active' },
        { id: 'usr-wey-2', name: 'Ellen Ripley', email: 'ripley@weyland.com', role: 'Operations Auditor', status: 'Active' }
      ],
      connectors: [
        { id: 'conn-wey-1', name: 'Deep Space RPC Bridge', type: 'RPC Gateway', status: 'Healthy', throughput: '2,540 records/sec' },
        { id: 'conn-wey-2', name: 'Centauri Postgres Sink', type: 'Postgres DB', status: 'Healthy', throughput: '4.5 GB/hr' }
      ],
      reports: [
        { id: 'rep-wey-1', title: 'Terran Ore Extraction Audit Log', type: 'Financial Audit', generatedAt: '2026-08-05 23:15:00', size: '18.4 MB' },
        { id: 'rep-wey-2', title: 'Colonial Labor Quota Alignment', type: 'Compliance Log', generatedAt: '2026-08-01 10:00:00', size: '4.2 MB' }
      ]
    },
    {
      id: 'org-weyland-bio',
      name: 'Weyland Bio-Weapons R&D',
      erp: 'Custom Bio-Ledger In-house ERP',
      erpHost: 'bio.rd.weyland.corp',
      erpStatus: 'Synced',
      createdAt: '2025-07-04',
      projects: [
        { id: 'proj-wey-3', name: 'Specimen Xenomorph Ledger Sync', status: 'In Progress', progress: 85, lastSync: '2026-08-07 17:15:22' }
      ],
      users: [
        { id: 'usr-wey-3', name: 'Ash Android', email: 'ash@weyland.com', role: 'Security Inspector', status: 'Active' }
      ],
      connectors: [
        { id: 'conn-wey-3', name: 'Classified CDC Sink', type: 'Classified HTTPS S3', status: 'Healthy', throughput: '120 records/sec' }
      ],
      reports: [
        { id: 'rep-wey-3', title: 'Classified Organism DNA Log', type: 'Compliance Log', generatedAt: '2026-08-07 05:00:00', size: '64.5 MB' }
      ]
    }
  ]
};

// Initial mock data pre-populated with tenants
const INITIAL_TENANTS: Tenant[] = [
  {
    id: 'tenant-acme',
    name: 'Acme Global Corp',
    partnerId: 'partner-alpha',
    partnerName: 'Alpha Cloud Solutions',
    isActive: true,
    status: 'Active',
    createdAt: '2025-01-15 08:30:00',
    primaryContact: 'Wile E. Coyote',
    adminEmail: 'admin@acme.com',
    region: 'US-East',
    subscription: {
      tier: 'Enterprise',
      status: 'Active',
      priceMonthly: 1200,
      billingCycle: 'Monthly',
      startDate: '2025-01-15',
      nextRenewalDate: '2026-09-15',
      autoRenew: true
    },
    branding: {
      portalTitle: 'Acme Enterprise Migration Portal',
      themeColor: 'sapphire',
      logoText: 'ACME INTEGRATIONS'
    },
    resources: {
      memoryGb: 64,
      vCpus: 16,
      storageGb: 2000,
      apiRateLimitRps: 2500,
      maxUserAccounts: 150
    },
    config: {
      subdomain: 'acme-migration',
      ssoProvider: 'Google Workspace',
      ssoMetadataUrl: 'https://accounts.google.com/o/saml2/metadata',
      webhookCallbackUrl: 'https://api.acme.com/v1/migration-updates',
      dbClusterHost: 'db-us-east-1a.cluster.edimp.internal'
    },
    backups: [
      { id: 'bak-001', timestamp: '2026-08-01 02:00:00', sizeMb: 1240, status: 'Completed', triggeredBy: 'System Schedule', checksum: 'sha256:5ef39c18...' },
      { id: 'bak-002', timestamp: '2026-07-01 02:00:00', sizeMb: 1180, status: 'Completed', triggeredBy: 'Super Admin', checksum: 'sha256:92fdc02a...' }
    ],
    invoices: [
      { id: 'inv-101', date: '2026-08-01', amount: 1200, status: 'Paid', paymentMethod: 'Visa ending in 4242' },
      { id: 'inv-102', date: '2026-07-01', amount: 1200, status: 'Paid', paymentMethod: 'Visa ending in 4242' },
      { id: 'inv-103', date: '2026-06-01', amount: 1200, status: 'Paid', paymentMethod: 'Visa ending in 4242' }
    ]
  },
  {
    id: 'tenant-globex',
    name: 'Globex Industries',
    partnerId: 'partner-alpha',
    partnerName: 'Alpha Cloud Solutions',
    isActive: true,
    status: 'Active',
    createdAt: '2025-04-10 14:15:00',
    primaryContact: 'Hank Scorpio',
    adminEmail: 'scorpio@globex.com',
    region: 'EU-Central',
    subscription: {
      tier: 'Professional',
      status: 'Active',
      priceMonthly: 650,
      billingCycle: 'Monthly',
      startDate: '2025-04-10',
      nextRenewalDate: '2026-09-10',
      autoRenew: true
    },
    branding: {
      portalTitle: 'Globex Synapse Engine',
      themeColor: 'emerald',
      logoText: 'GLOBEX SYNAPSE'
    },
    resources: {
      memoryGb: 32,
      vCpus: 8,
      storageGb: 800,
      apiRateLimitRps: 1000,
      maxUserAccounts: 50
    },
    config: {
      subdomain: 'globex-sync',
      ssoProvider: 'Microsoft Entra ID',
      ssoMetadataUrl: 'https://login.microsoftonline.com/globex/federationmetadata',
      webhookCallbackUrl: 'https://hooks.globex.com/edimp/receiver',
      dbClusterHost: 'db-eu-central-1b.cluster.edimp.internal'
    },
    backups: [
      { id: 'bak-003', timestamp: '2026-08-05 03:00:00', sizeMb: 680, status: 'Completed', triggeredBy: 'System Schedule', checksum: 'sha256:88a6d2c4...' }
    ],
    invoices: [
      { id: 'inv-201', date: '2026-08-01', amount: 650, status: 'Paid', paymentMethod: 'Mastercard ending in 8891' },
      { id: 'inv-202', date: '2026-07-01', amount: 650, status: 'Paid', paymentMethod: 'Mastercard ending in 8891' }
    ]
  },
  {
    id: 'tenant-initech',
    name: 'Initech Solutions',
    partnerId: 'partner-beta',
    partnerName: 'Beta Consulting Ltd',
    isActive: false,
    status: 'Deactivated',
    createdAt: '2025-09-01 11:00:00',
    primaryContact: 'Peter Gibbons',
    adminEmail: 'pgibbons@initech.com',
    region: 'US-East',
    subscription: {
      tier: 'Starter',
      status: 'Suspended',
      priceMonthly: 300,
      billingCycle: 'Monthly',
      startDate: '2025-09-01',
      nextRenewalDate: '2026-04-01',
      autoRenew: false
    },
    branding: {
      portalTitle: 'Initech Legacy Conduit',
      themeColor: 'amber',
      logoText: 'INITECH CONDUIT'
    },
    resources: {
      memoryGb: 16,
      vCpus: 4,
      storageGb: 400,
      apiRateLimitRps: 500,
      maxUserAccounts: 20
    },
    config: {
      subdomain: 'initech-pipeline',
      ssoProvider: 'Okta SAML',
      ssoMetadataUrl: 'https://initech.okta.com/app/exk...',
      webhookCallbackUrl: 'https://initech.com/api/migration-hook',
      dbClusterHost: 'db-us-east-1b.cluster.edimp.internal'
    },
    backups: [
      { id: 'bak-004', timestamp: '2026-03-15 10:00:00', sizeMb: 245, status: 'Completed', triggeredBy: 'Partner Admin', checksum: 'sha256:732ae11c...' }
    ],
    invoices: [
      { id: 'inv-301', date: '2026-04-01', amount: 300, status: 'Overdue', paymentMethod: 'ACH Bank Transfer' },
      { id: 'inv-302', date: '2026-03-01', amount: 300, status: 'Paid', paymentMethod: 'ACH Bank Transfer' }
    ]
  },
  {
    id: 'tenant-weyland',
    name: 'Weyland-Yutani Corp',
    partnerId: 'partner-delta',
    partnerName: 'Weyland Strategic Partners',
    isActive: true,
    status: 'Active',
    createdAt: '2025-03-22 06:12:00',
    primaryContact: 'Carter Burke',
    adminEmail: 'burke@weyland.com',
    region: 'AP-South',
    subscription: {
      tier: 'Enterprise',
      status: 'Active',
      priceMonthly: 1200,
      billingCycle: 'Yearly',
      startDate: '2025-03-22',
      nextRenewalDate: '2027-03-22',
      autoRenew: true
    },
    branding: {
      portalTitle: 'Weyland Bio-Sync Portal',
      themeColor: 'slate',
      logoText: 'BUILDING BETTER WORLDS'
    },
    resources: {
      memoryGb: 128,
      vCpus: 32,
      storageGb: 8000,
      apiRateLimitRps: 5000,
      maxUserAccounts: 500
    },
    config: {
      subdomain: 'weyland-biosync',
      ssoProvider: 'Microsoft Entra ID',
      ssoMetadataUrl: 'https://login.microsoftonline.com/weyland/metadata',
      webhookCallbackUrl: 'https://api.weyland.com/cdc/migration-receiver',
      dbClusterHost: 'db-ap-south-1a.cluster.edimp.internal'
    },
    backups: [
      { id: 'bak-005', timestamp: '2026-08-03 01:15:00', sizeMb: 4520, status: 'Completed', triggeredBy: 'System Schedule', checksum: 'sha256:f12a38ec...' }
    ],
    invoices: [
      { id: 'inv-401', date: '2026-03-22', amount: 14400, status: 'Paid', paymentMethod: 'Corporate Wire Transfer' }
    ]
  }
];

interface TenantManagementViewProps {
  userRole?: UserRole;
}

const MfaQrCode: React.FC<{ secret: string; themeColor: string; size?: number }> = ({ secret, themeColor, size = 160 }) => {
  const getPixelGrid = () => {
    let hash = 0;
    for (let i = 0; i < secret.length; i++) {
      hash = (hash << 5) - hash + secret.charCodeAt(i);
      hash |= 0;
    }
    
    const grid: boolean[][] = [];
    const size = 21;
    for (let r = 0; r < size; r++) {
      grid[r] = [];
      for (let c = 0; c < size; c++) {
        const isTopLeftFinder = r < 7 && c < 7;
        const isTopRightFinder = r < 7 && c >= 14;
        const isBottomLeftFinder = r >= 14 && c < 7;
        
        if (isTopLeftFinder || isTopRightFinder || isBottomLeftFinder) {
          grid[r][c] = false;
          continue;
        }
        
        const isCenterLogo = r >= 9 && r <= 11 && c >= 9 && c <= 11;
        if (isCenterLogo) {
          grid[r][c] = false;
          continue;
        }

        const val = Math.abs(Math.sin((r * 12.9898 + c * 78.233 + hash) * 43758.5453));
        grid[r][c] = val > 0.45;
      }
    }
    return grid;
  };

  const grid = getPixelGrid();
  
  const colorMap = {
    sapphire: '#4f46e5',
    emerald: '#059669',
    amber: '#d97706',
    rose: '#e11d48',
    slate: '#475569',
    indigo: '#4f46e5'
  };
  const activeColor = colorMap[themeColor as keyof typeof colorMap] || colorMap.sapphire;

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 21 21" 
      className="bg-white p-2 rounded-xl border border-slate-200/80 shadow-3xs shrink-0"
      style={{ shapeRendering: 'crispEdges' }}
    >
      {grid.map((row, r) => 
        row.map((active, c) => {
          if (!active) return null;
          return (
            <rect 
              key={`px-${r}-${c}`} 
              x={c} 
              y={r} 
              width="1" 
              height="1" 
              fill={activeColor} 
            />
          );
        })
      )}

      {/* Finder Patterns */}
      <rect x="0" y="0" width="7" height="7" fill={activeColor} />
      <rect x="1" y="1" width="5" height="5" fill="#ffffff" />
      <rect x="2" y="2" width="3" height="3" fill={activeColor} />

      <rect x="14" y="0" width="7" height="7" fill={activeColor} />
      <rect x="15" y="1" width="5" height="5" fill="#ffffff" />
      <rect x="16" y="2" width="3" height="3" fill={activeColor} />

      <rect x="0" y="14" width="7" height="7" fill={activeColor} />
      <rect x="1" y="15" width="5" height="5" fill="#ffffff" />
      <rect x="2" y="16" width="3" height="3" fill={activeColor} />

      {/* Center Shield Area */}
      <rect x="9" y="9" width="3" height="3" fill="#ffffff" />
      <circle cx="10.5" cy="10.5" r="1.1" fill={activeColor} />
      <path d="M10 10.5h1v1h-1z" fill={activeColor} />
    </svg>
  );
};

export const TenantManagementView: React.FC<TenantManagementViewProps> = ({ userRole = 'Admin' }) => {
  // Let user switch role dynamically in workspace to see difference
  const [activeRole, setActiveRole] = useState<UserRole>(userRole);

  // Sync internal activeRole if prop changes
  useEffect(() => {
    setActiveRole(userRole);
  }, [userRole]);

  // Background interval to simulate live-rotating Google Authenticator 30s TOTP codes
  useEffect(() => {
    const interval = setInterval(() => {
      setTotpSecondsLeft((prev) => {
        if (prev <= 1) {
          const newCode = Math.floor(100000 + Math.random() * 900000).toString();
          setTotpCode(newCode);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Main state
  const [tenants, setTenants] = useState<Tenant[]>(INITIAL_TENANTS);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('tenant-acme');
  const [activeTab, setActiveTab] = useState<'summary' | 'organizations' | 'directory' | 'resources' | 'branding' | 'backup' | 'analytics' | 'billing' | 'migration' | 'audit' | 'comparison' | 'security'>('summary');
  const [organizationsMap, setOrganizationsMap] = useState<Record<string, Organization[]>>(INITIAL_ORGANIZATIONS);

  // Organization Management states
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [activeOrgSubTab, setActiveOrgSubTab] = useState<'dashboard' | 'erp' | 'projects' | 'users' | 'connectors' | 'reports'>('dashboard');
  const [orgSearchQuery, setOrgSearchQuery] = useState('');
  const [orgErpFilter, setOrgErpFilter] = useState('All');
  
  // Organization Form state
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [formOrgName, setFormOrgName] = useState('');
  const [formOrgErp, setFormOrgErp] = useState('SAP S/4HANA');
  const [formOrgErpHost, setFormOrgErpHost] = useState('');
  const [formOrgErpStatus, setFormOrgErpStatus] = useState<'Active' | 'Synced' | 'Error' | 'Pending'>('Active');
  
  // Connection Testing simulation state
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'failed' | null>(null);

  // Enhanced Organization Workflow States
  const [isSyncingAllOrgs, setIsSyncingAllOrgs] = useState(false);
  const [syncAllProgress, setSyncAllProgress] = useState(0);

  // Schema Discovery Modal State
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);
  const [isSchemaScanning, setIsSchemaScanning] = useState(false);
  const [schemaScanProgress, setSchemaScanProgress] = useState(0);
  const [schemaScanCompleted, setSchemaScanCompleted] = useState(false);

  // Clone Organization Modal State
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [cloneSourceOrg, setCloneSourceOrg] = useState<Organization | null>(null);
  const [cloneTargetName, setCloneTargetName] = useState('');

  // Diagnostic Test Bench Modal State
  const [isDiagnosticModalOpen, setIsDiagnosticModalOpen] = useState(false);
  const [diagnosticConnector, setDiagnosticConnector] = useState<OrgConnector | null>(null);
  const [isDiagnosticRunning, setIsDiagnosticRunning] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<{ status: number; latencyMs: number; payload: string } | null>(null);

  // Scheduled Reports Modal State
  const [isScheduleReportModalOpen, setIsScheduleReportModalOpen] = useState(false);
  const [reportToSchedule, setReportToSchedule] = useState<OrgReport | null>(null);
  const [scheduleFrequency, setScheduleFrequency] = useState<'Daily' | 'Weekly' | 'Monthly'>('Weekly');
  const [scheduleEmail, setScheduleEmail] = useState('');

  // Report Preview Modal State
  const [previewReportModal, setPreviewReportModal] = useState<OrgReport | null>(null);

  // Project Syncing State
  const [syncingProjectId, setSyncingProjectId] = useState<string | null>(null);

  // New sub-item inline form states (for adding dynamic projects, users, connectors, etc.)
  const [newProjName, setNewProjName] = useState('');
  const [newProjStatus, setNewProjStatus] = useState<'In Progress' | 'Completed' | 'Delayed' | 'Planned'>('In Progress');
  const [newProjProgress, setNewProjProgress] = useState(10);
  
  const [newUsrName, setNewUsrName] = useState('');
  const [newUsrEmail, setNewUsrEmail] = useState('');
  const [newUsrRole, setNewUsrRole] = useState('Data Engineer');
  
  const [newConnName, setNewConnName] = useState('');
  const [newConnType, setNewConnType] = useState('REST API Endpoint');
  const [newConnThroughput, setNewConnThroughput] = useState('250 records/sec');
  
  const [newRepTitle, setNewRepTitle] = useState('');
  const [newRepType, setNewRepType] = useState<'Financial Audit' | 'Compliance Log' | 'Operational Analytics' | 'System Health'>('Financial Audit');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  
  // Cross-tenant resource comparison states
  const [comparisonMetric, setComparisonMetric] = useState<'cpu' | 'ram' | 'storage' | 'api'>('cpu');
  const [comparisonSort, setComparisonSort] = useState<'name' | 'allocated' | 'consumed' | 'utilization'>('utilization');
  const [comparisonSortDir, setComparisonSortDir] = useState<'asc' | 'desc'>('desc');
  const [customTenantUtils, setCustomTenantUtils] = useState<Record<string, { cpu: number; ram: number; storage: number; api: number }>>({
    'tenant-acme': { cpu: 42, ram: 68, storage: 74, api: 55 },
    'tenant-globex': { cpu: 58, ram: 72, storage: 68, api: 85 },
    'tenant-initech': { cpu: 82, ram: 88, storage: 54, api: 40 },
    'tenant-weyland': { cpu: 28, ram: 45, storage: 56, api: 62 },
  });

  const getTenantUtil = (tenantId: string) => {
    const custom = customTenantUtils[tenantId] || { cpu: 45, ram: 60, storage: 72, api: 50 };
    if (tenantId === selectedTenantId) {
      return {
        cpu: usageStats.avgCpuUtilPct,
        ram: usageStats.avgRamUtilPct,
        storage: Math.round((usageStats.dbStorageConsumedGb / currentTenant.resources.storageGb) * 100),
        api: custom.api
      };
    }
    return custom;
  };

  const getComparisonChartData = () => {
    const rawData = tenants.map(t => {
      const utils = getTenantUtil(t.id);
      let allocated = 0;
      let consumed = 0;
      let utilPct = 0;
      let unit = '';

      if (comparisonMetric === 'cpu') {
        allocated = t.resources.vCpus;
        utilPct = utils.cpu;
        consumed = parseFloat((allocated * (utilPct / 100)).toFixed(1));
        unit = 'vCPUs';
      } else if (comparisonMetric === 'ram') {
        allocated = t.resources.memoryGb;
        utilPct = utils.ram;
        consumed = parseFloat((allocated * (utilPct / 100)).toFixed(1));
        unit = 'GB';
      } else if (comparisonMetric === 'storage') {
        allocated = t.resources.storageGb;
        utilPct = utils.storage;
        consumed = parseFloat((allocated * (utilPct / 100)).toFixed(1));
        unit = 'GB';
      } else {
        allocated = t.resources.apiRateLimitRps;
        utilPct = utils.api;
        consumed = parseFloat((allocated * (utilPct / 100)).toFixed(1));
        unit = 'req/s';
      }

      return {
        id: t.id,
        name: t.name,
        shortName: t.name.length > 12 ? `${t.name.substring(0, 10)}...` : t.name,
        allocated,
        consumed,
        utilPct,
        unit,
        isActive: t.isActive,
        tier: t.subscription.tier
      };
    });

    return rawData.sort((a, b) => {
      let valA: any = a.name;
      let valB: any = b.name;

      if (comparisonSort === 'allocated') {
        valA = a.allocated;
        valB = b.allocated;
      } else if (comparisonSort === 'consumed') {
        valA = a.consumed;
        valB = b.consumed;
      } else if (comparisonSort === 'utilization') {
        valA = a.utilPct;
        valB = b.utilPct;
      }

      if (valA < valB) return comparisonSortDir === 'asc' ? -1 : 1;
      if (valA > valB) return comparisonSortDir === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const handleAutoOptimizeAllocation = () => {
    let optimizedCount = 0;
    setTenants(prev => prev.map(t => {
      const utils = getTenantUtil(t.id);
      let currentUtil = 0;
      if (comparisonMetric === 'cpu') currentUtil = utils.cpu;
      else if (comparisonMetric === 'ram') currentUtil = utils.ram;
      else if (comparisonMetric === 'storage') currentUtil = utils.storage;
      else currentUtil = utils.api;

      if (currentUtil >= 80) {
        optimizedCount++;
        const nextResources = { ...t.resources };
        if (comparisonMetric === 'cpu') nextResources.vCpus = Math.min(64, Math.round(t.resources.vCpus * 1.5));
        else if (comparisonMetric === 'ram') nextResources.memoryGb = Math.min(256, Math.round(t.resources.memoryGb * 1.5));
        else if (comparisonMetric === 'storage') nextResources.storageGb = Math.min(10000, Math.round(t.resources.storageGb * 1.5));
        else nextResources.apiRateLimitRps = Math.min(10000, Math.round(t.resources.apiRateLimitRps * 1.5));

        const nextUtil = Math.round(currentUtil / 1.5);
        setCustomTenantUtils(prevUtils => ({
          ...prevUtils,
          [t.id]: {
            ...prevUtils[t.id] || { cpu: 45, ram: 60, storage: 72, api: 50 },
            [comparisonMetric]: nextUtil
          }
        }));

        addAuditLog(
          t.id,
          'SLA Threshold Resource Optimized',
          'Configuration',
          'Success',
          `Automated Quota scaling: elevated ${comparisonMetric.toUpperCase()} limit of "${t.name}" by 50% to mitigate a simulated ${currentUtil}% congestion saturation.`
        );

        return {
          ...t,
          resources: nextResources
        };
      }
      return t;
    }));

    if (optimizedCount > 0) {
      alert(`Successfully optimized allocation for ${optimizedCount} saturated tenant(s). Quotas scaled up and workloads re-balanced.`);
    } else {
      alert("All tenant systems are operating within healthy parameters (<80% load). No automated optimization required.");
    }
  };
  
  // Audit Log state
  const [auditLogs, setAuditLogs] = useState<Record<string, TenantAuditLog[]>>(INITIAL_AUDIT_LOGS);

  // Audit Tab search/filter state
  const [auditSearch, setAuditSearch] = useState<string>('');
  const [auditCategory, setAuditCategory] = useState<string>('All');
  const [auditSeverity, setAuditSeverity] = useState<string>('All');

  // Audit Log Simulation State
  const [simAction, setSimAction] = useState<string>('');
  const [simCategory, setSimCategory] = useState<'Provisioning' | 'Configuration' | 'Security' | 'Billing' | 'Backup'>('Configuration');
  const [simSeverity, setSimSeverity] = useState<'Info' | 'Success' | 'Warning' | 'Danger'>('Info');
  const [simDescription, setSimDescription] = useState<string>('');
  const [isSimulatingAudit, setIsSimulatingAudit] = useState<boolean>(false);

  const addAuditLog = (
    tenantId: string,
    action: string,
    category: 'Provisioning' | 'Configuration' | 'Security' | 'Billing' | 'Backup',
    severity: 'Info' | 'Success' | 'Warning' | 'Danger',
    description: string
  ) => {
    const newLog: TenantAuditLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      actor: `${activeRole} (User)`,
      action,
      category,
      severity,
      description
    };
    setAuditLogs(prev => ({
      ...prev,
      [tenantId]: [newLog, ...(prev[tenantId] || [])]
    }));
  };

  const handleSimulateAuditEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simAction || !simDescription) return;
    setIsSimulatingAudit(true);
    setTimeout(() => {
      addAuditLog(
        selectedTenantId,
        simAction,
        simCategory,
        simSeverity,
        simDescription
      );
      setIsSimulatingAudit(false);
      setSimAction('');
      setSimDescription('');
    }, 800);
  };

  const handleExportAuditLogs = () => {
    const logs = auditLogs[selectedTenantId] || [];
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `audit-log-${selectedTenantId}-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };
  
  // Search and filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [tierFilter, setTierFilter] = useState<string>('All');

  // Create Tenant Modal & Provisioning simulation State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [newTenantName, setNewTenantName] = useState<string>('');
  const [newTenantDomain, setNewTenantDomain] = useState<string>('');
  const [newTenantTier, setNewTenantTier] = useState<'Trial' | 'Starter' | 'Professional' | 'Enterprise' | 'Partner' | 'Unlimited'>('Starter');
  const [newTenantRegion, setNewTenantRegion] = useState<'US-East' | 'EU-Central' | 'AP-South' | 'SA-East'>('US-East');
  const [newTenantContact, setNewTenantContact] = useState<string>('');
  const [newTenantEmail, setNewTenantEmail] = useState<string>('');
  
  // Provisioning Logs simulation state
  const [isProvisioning, setIsProvisioning] = useState<boolean>(false);
  const [provisionProgress, setProvisionProgress] = useState<number>(0);
  const [provisionLogs, setProvisionLogs] = useState<string[]>([]);

  // Backup & Restore simulation logs
  const [isBackingUp, setIsBackingUp] = useState<boolean>(false);
  const [backupProgress, setBackupProgress] = useState<number>(0);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [restoreProgress, setRestoreProgress] = useState<number>(0);
  const [restoreLogs, setRestoreLogs] = useState<string[]>([]);
  const [showRestoreModal, setShowRestoreModal] = useState<boolean>(false);
  const [selectedBackupToRestore, setSelectedBackupToRestore] = useState<TenantBackup | null>(null);

  // Heatmap UI States
  const [heatmapMetricFilter, setHeatmapMetricFilter] = useState<'all' | 'CPU' | 'RAM' | 'API' | 'DB IOPS'>('all');
  const [heatmapSpikeActive, setHeatmapSpikeActive] = useState<boolean>(false);
  const [hoveredHeatmapCell, setHoveredHeatmapCell] = useState<{ row: string; hour: number; value: number } | null>(null);

  // Billing Forecast UI States
  const [forecastModel, setForecastModel] = useState<'linear' | 'conservative' | 'aggressive' | 'seasonal'>('linear');
  const [growthRate, setGrowthRate] = useState<number>(12);
  const [budgetThresholds, setBudgetThresholds] = useState<Record<string, number>>({
    'tenant-acme': 1800,
    'tenant-globex': 1000,
    'tenant-initech': 450,
    'tenant-weyland': 2500,
  });
  const [autoThrottleEnabled, setAutoThrottleEnabled] = useState<Record<string, boolean>>({
    'tenant-acme': false,
    'tenant-globex': true,
    'tenant-initech': false,
    'tenant-weyland': false,
  });
  const [optimizationApplied, setOptimizationApplied] = useState<Record<string, boolean>>({});
  const [isExportingBudgetAdvisory, setIsExportingBudgetAdvisory] = useState<boolean>(false);

  // Security & MFA States
  const [mfaDevices, setMfaDevices] = useState<Record<string, MfaDevice[]>>(INITIAL_MFA_DEVICES);
  const [mfaRequired, setMfaRequired] = useState<Record<string, boolean>>({
    'tenant-acme': true,
    'tenant-globex': true,
    'tenant-initech': false,
    'tenant-weyland': true,
  });
  const [mfaAllowFido, setMfaAllowFido] = useState<Record<string, boolean>>({
    'tenant-acme': true,
    'tenant-globex': true,
    'tenant-initech': false,
    'tenant-weyland': true,
  });
  const [mfaIpWhitelist, setMfaIpWhitelist] = useState<Record<string, string>>({
    'tenant-acme': '192.168.1.0/24, 10.0.0.0/8',
    'tenant-globex': '172.16.0.0/12',
    'tenant-initech': '',
    'tenant-weyland': '8.8.8.8/32',
  });
  const [mfaGracePeriod, setMfaGracePeriod] = useState<Record<string, string>>({
    'tenant-acme': 'Immediate',
    'tenant-globex': 'Immediate',
    'tenant-initech': '7 Days',
    'tenant-weyland': 'Immediate',
  });

  // Pairing wizard state
  const [isPairingActive, setIsPairingActive] = useState<boolean>(false);
  const [pairingStep, setPairingStep] = useState<number>(1);
  const [pairingDeviceName, setPairingDeviceName] = useState<string>('Admin Primary Device');
  const [pairingDeviceType, setPairingDeviceType] = useState<'Authenticator App' | 'Hardware Key'>('Authenticator App');
  const [pairingAppName, setPairingAppName] = useState<'Google Authenticator' | 'Microsoft Authenticator' | 'Authy' | 'Duo Mobile'>('Google Authenticator');
  const [pairingManualKey, setPairingManualKey] = useState<string>('');
  const [pairingCodeInput, setPairingCodeInput] = useState<string>('');
  const [pairingError, setPairingError] = useState<string | null>(null);
  const [pairingSuccessCodes, setPairingSuccessCodes] = useState<string[]>([]);

  // Live TOTP state (updates every second)
  const [totpCode, setTotpCode] = useState<string>('542891');
  const [totpSecondsLeft, setTotpSecondsLeft] = useState<number>(30);

  // Portal login challenge simulation states
  const [simulatedDeviceTab, setSimulatedDeviceTab] = useState<'app' | 'login'>('app');
  const [loginStep, setLoginStep] = useState<'credentials' | 'mfa' | 'success'>('credentials');
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginMfaCode, setLoginMfaCode] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccessMessage, setLoginSuccessMessage] = useState<string | null>(null);
  const [qrScanningActive, setQrScanningActive] = useState<boolean>(false);

  // Branding Logo Upload & Preset States
  const [isDraggingLogo, setIsDraggingLogo] = useState<boolean>(false);
  const [logoUploadProgress, setLogoUploadProgress] = useState<number | null>(null);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);

  // Bulk Migration Utility States
  const [selectedMigrateSourcePool, setSelectedMigrateSourcePool] = useState<string>('db-us-east-1a.cluster.edimp.internal');
  const [selectedMigrateTargetPool, setSelectedMigrateTargetPool] = useState<string>('db-us-east-highmem-1a.cluster.edimp.internal');
  const [selectedMigrateType, setSelectedMigrateType] = useState<string>('Schema Update');
  const [selectedTenantIdsForMigration, setSelectedTenantIdsForMigration] = useState<string[]>([]);
  const [isBulkMigrating, setIsBulkMigrating] = useState<boolean>(false);

  // Pre-Flight Check States
  const [isPreFlightScanning, setIsPreFlightScanning] = useState<boolean>(false);
  const [preFlightStatus, setPreFlightStatus] = useState<'idle' | 'scanning' | 'passed' | 'warning'>('idle');
  const [preFlightLogs, setPreFlightLogs] = useState<string[]>([]);
  const [preFlightResults, setPreFlightResults] = useState<{
    connectivityOk: boolean;
    schemaParityOk: boolean;
    resourceValidationOk: boolean;
    details: Array<{
      tenantName: string;
      connectivity: string;
      schemaParity: string;
      status: 'success' | 'warning';
    }>;
  } | null>(null);

  // Reset pre-flight check status when migration inputs change
  useEffect(() => {
    setPreFlightStatus('idle');
    setPreFlightResults(null);
    setPreFlightLogs([]);
  }, [
    selectedTenantIdsForMigration.length,
    selectedTenantIdsForMigration.join(','),
    selectedMigrateSourcePool,
    selectedMigrateTargetPool,
    selectedMigrateType
  ]);
  const [bulkMigrationProgress, setBulkMigrationProgress] = useState<number>(0);
  const [bulkMigrationLogs, setBulkMigrationLogs] = useState<string[]>([]);
  const [bulkMigrationHistory, setBulkMigrationHistory] = useState<Array<{
    id: string;
    timestamp: string;
    type: string;
    sourcePool: string;
    targetPool: string;
    tenantsMigratedCount: number;
    tenantsMigratedNames: string;
    status: 'Completed' | 'Failed';
  }>>([
    {
      id: 'mig-001',
      timestamp: '2026-08-01 14:22:15',
      type: 'PostgreSQL Version Upgrade',
      sourcePool: 'db-us-east-1b.cluster.edimp.internal',
      targetPool: 'db-us-east-1b-v17.cluster.edimp.internal',
      tenantsMigratedCount: 1,
      tenantsMigratedNames: 'Initech Solutions',
      status: 'Completed'
    },
    {
      id: 'mig-002',
      timestamp: '2026-07-15 03:10:00',
      type: 'Cluster Realignment',
      sourcePool: 'db-us-east-legacy.cluster.edimp.internal',
      targetPool: 'db-us-east-1a.cluster.edimp.internal',
      tenantsMigratedCount: 1,
      tenantsMigratedNames: 'Acme Global Corp',
      status: 'Completed'
    }
  ]);

  // Auto-select all active tenants in the source pool when the source pool changes
  useEffect(() => {
    const tenantsInPool = tenants.filter(t => t.config.dbClusterHost === selectedMigrateSourcePool).map(t => t.id);
    setSelectedTenantIdsForMigration(tenantsInPool);
  }, [selectedMigrateSourcePool]);

  // Find currently selected tenant details
  const currentTenant = tenants.find(t => t.id === selectedTenantId) || tenants[0];

  // Calculated Usage Stats for selected Tenant
  const [usageStats, setUsageStats] = useState({
    activeUsers: 84,
    apiRequestsCount: 145890,
    dbStorageConsumedGb: 1480,
    avgCpuUtilPct: 42,
    avgRamUtilPct: 68,
    activeCdcQueries: 12
  });

  // Regenerate random metrics periodically to look live
  useEffect(() => {
    if (!currentTenant) return;
    
    // Base stats depend on tier
    const baseUsers = currentTenant.subscription.tier === 'Enterprise' ? 120 :
                      currentTenant.subscription.tier === 'Professional' ? 45 : 12;
    const baseStorage = currentTenant.resources.storageGb * 0.72; // ~72% full
    
    const interval = setInterval(() => {
      setUsageStats({
        activeUsers: Math.round(baseUsers + (Math.random() * 12 - 6)),
        apiRequestsCount: Math.round(150000 + Math.random() * 25000),
        dbStorageConsumedGb: parseFloat((baseStorage + Math.random() * 2).toFixed(1)),
        avgCpuUtilPct: Math.round(35 + Math.random() * 20),
        avgRamUtilPct: Math.round(55 + Math.random() * 15),
        activeCdcQueries: Math.round(8 + Math.random() * 6)
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [selectedTenantId, currentTenant]);

  // Is Super Admin? Super Admin is defined as 'Super Admin' or 'Admin' in this system
  const isSuperAdmin = activeRole === 'Super Admin' || activeRole === 'Admin';
  // Partner Admin can manage, but has limits
  const isPartnerAdmin = activeRole === 'Partner Admin';

  // --- ORGANIZATION HANDLERS ---
  const handleOpenAddOrg = () => {
    setEditingOrg(null);
    setFormOrgName('');
    setFormOrgErp('SAP S/4HANA (v2023)');
    setFormOrgErpHost('sap-ecc.mfg.acme.internal:443');
    setFormOrgErpStatus('Active');
    setTestResult(null);
    setIsOrgModalOpen(true);
  };

  const handleOpenEditOrg = (org: Organization) => {
    setEditingOrg(org);
    setFormOrgName(org.name);
    setFormOrgErp(org.erp);
    setFormOrgErpHost(org.erpHost);
    setFormOrgErpStatus(org.erpStatus);
    setTestResult(null);
    setIsOrgModalOpen(true);
  };

  const handleSaveOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formOrgName.trim()) return;

    const tenantId = selectedTenantId || 'tenant-acme';
    const currentOrgs = organizationsMap[tenantId] || [];

    if (editingOrg) {
      // Edit existing org
      const updatedOrgs = currentOrgs.map(o => {
        if (o.id === editingOrg.id) {
          return {
            ...o,
            name: formOrgName,
            erp: formOrgErp,
            erpHost: formOrgErpHost,
            erpStatus: formOrgErpStatus
          };
        }
        return o;
      });
      setOrganizationsMap(prev => ({
        ...prev,
        [tenantId]: updatedOrgs
      }));
      addAuditLog(
        tenantId,
        'Organization Details Updated',
        'Configuration',
        'Success',
        `Organization "${formOrgName}" details and ERP integration parameters modified.`
      );
    } else {
      // Create new org
      const newOrg: Organization = {
        id: `org-${tenantId}-${Date.now().toString(36)}`,
        name: formOrgName,
        erp: formOrgErp,
        erpHost: formOrgErpHost,
        erpStatus: formOrgErpStatus,
        createdAt: new Date().toISOString().split('T')[0],
        projects: [
          { id: `proj-${Date.now()}-1`, name: 'Initial Environment Diagnostics', status: 'In Progress', progress: 20, lastSync: new Date().toISOString().replace('T', ' ').substring(0, 19) }
        ],
        users: [
          { id: `usr-${Date.now()}-1`, name: 'Primary Admin Contact', email: `admin@${formOrgName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'org'}.com`, role: 'Org Admin', status: 'Active' }
        ],
        connectors: [
          { id: `conn-${Date.now()}-1`, name: `${formOrgErp.split(' ')[0]} Primary API Bridge`, type: 'API Gateway', status: 'Healthy', throughput: '100 records/sec' }
        ],
        reports: []
      };
      setOrganizationsMap(prev => ({
        ...prev,
        [tenantId]: [...currentOrgs, newOrg]
      }));
      addAuditLog(
        tenantId,
        'New Tenant Organization Created',
        'Provisioning',
        'Success',
        `Newly defined business unit "${formOrgName}" has been provisioned and mapped to tenant container.`
      );
    }

    setIsOrgModalOpen(false);
    setEditingOrg(null);
  };

  const handleDeleteOrg = (orgId: string) => {
    const tenantId = selectedTenantId || 'tenant-acme';
    const orgToDelete = (organizationsMap[tenantId] || []).find(o => o.id === orgId);
    if (!orgToDelete) return;

    if (!window.confirm(`Are you sure you want to delete the organization "${orgToDelete.name}" and all its integrated ERP nodes, projects, connectors, and reports? This action is irreversible.`)) {
      return;
    }

    setOrganizationsMap(prev => ({
      ...prev,
      [tenantId]: (prev[tenantId] || []).filter(o => o.id !== orgId)
    }));

    if (selectedOrgId === orgId) {
      setSelectedOrgId(null);
    }

    addAuditLog(
      tenantId,
      'Tenant Organization Purged',
      'Configuration',
      'Warning',
      `Business unit "${orgToDelete.name}" and all its mapped projects/users have been completely pruned from the registry.`
    );
  };

  const handleTestConnection = () => {
    setIsTestingConnection(true);
    setTestResult(null);
    setTimeout(() => {
      setIsTestingConnection(false);
      setTestResult(Math.random() > 0.15 ? 'success' : 'failed');
    }, 1200);
  };

  // Batch Sync All ERP Connections Workflow
  const handleSyncAllOrgs = () => {
    setIsSyncingAllOrgs(true);
    setSyncAllProgress(10);
    const interval = setInterval(() => {
      setSyncAllProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 100;
        }
        return prev + 25;
      });
    }, 250);

    setTimeout(() => {
      clearInterval(interval);
      setIsSyncingAllOrgs(false);
      setSyncAllProgress(0);
      const tenantId = selectedTenantId || 'tenant-acme';
      setOrganizationsMap(prev => ({
        ...prev,
        [tenantId]: (prev[tenantId] || []).map(o => ({
          ...o,
          erpStatus: 'Synced'
        }))
      }));
      addAuditLog(
        tenantId,
        'Batch ERP Schema Synchronization',
        'Provisioning',
        'Success',
        'Executed global health ping and schema refresh across all registered subsidiary organization nodes.'
      );
    }, 1200);
  };

  // Export Organization Manifest Workflow
  const handleExportOrgManifest = () => {
    const tenantId = selectedTenantId || 'tenant-acme';
    const orgs = organizationsMap[tenantId] || [];
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(orgs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `organization-manifest-${tenantId}-${new Date().toISOString().substring(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    addAuditLog(
      tenantId,
      'Organization Manifest Exported',
      'Configuration',
      'Success',
      `Exported JSON schema manifest for ${orgs.length} subsidiary organization entities.`
    );
  };

  // Clone Organization Workflow
  const handleOpenCloneModal = (org: Organization) => {
    setCloneSourceOrg(org);
    setCloneTargetName(`${org.name} - APAC Division`);
    setIsCloneModalOpen(true);
  };

  const handleExecuteCloneOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloneSourceOrg || !cloneTargetName.trim()) return;

    const tenantId = selectedTenantId || 'tenant-acme';
    const clonedOrg: Organization = {
      ...cloneSourceOrg,
      id: `org-${tenantId}-${Date.now().toString(36)}`,
      name: cloneTargetName,
      createdAt: new Date().toISOString().split('T')[0],
      erpStatus: 'Pending',
      projects: cloneSourceOrg.projects.map((p, idx) => ({
        ...p,
        id: `proj-clone-${Date.now()}-${idx}`,
        status: 'Planned',
        progress: 0,
        lastSync: 'Pending Initial Run'
      }))
    };

    setOrganizationsMap(prev => ({
      ...prev,
      [tenantId]: [...(prev[tenantId] || []), clonedOrg]
    }));

    addAuditLog(
      tenantId,
      'Subsidiary Organization Cloned',
      'Provisioning',
      'Success',
      `Cloned schema baseline from "${cloneSourceOrg.name}" to create new subsidiary unit "${cloneTargetName}".`
    );

    setIsCloneModalOpen(false);
    setCloneSourceOrg(null);
  };

  // Schema Discovery Scan Simulation
  const handleStartSchemaScan = () => {
    setIsSchemaScanning(true);
    setSchemaScanProgress(0);
    setSchemaScanCompleted(false);

    let current = 0;
    const interval = setInterval(() => {
      current += 20;
      setSchemaScanProgress(current);
      if (current >= 100) {
        clearInterval(interval);
        setIsSchemaScanning(false);
        setSchemaScanCompleted(true);
      }
    }, 200);
  };

  // Connector Diagnostic Workflow
  const handleRunDiagnostic = (connector: OrgConnector) => {
    setDiagnosticConnector(connector);
    setIsDiagnosticModalOpen(true);
    setIsDiagnosticRunning(true);
    setDiagnosticResult(null);

    setTimeout(() => {
      setIsDiagnosticRunning(false);
      setDiagnosticResult({
        status: 200,
        latencyMs: Math.floor(Math.random() * 25) + 12,
        payload: JSON.stringify({
          status: "HEALTHY_OK",
          endpoint: connector.name,
          transport: connector.type,
          throughputCapacity: connector.throughput,
          activeSockets: 16,
          tlsCipher: "TLS_AES_256_GCM_SHA384",
          uptimeSeconds: 849200
        }, null, 2)
      });
    }, 1000);
  };

  // Project Manual Incremental Sync Workflow
  const handleSyncProject = (projId: string) => {
    setSyncingProjectId(projId);
    setTimeout(() => {
      const tenantId = selectedTenantId || 'tenant-acme';
      setOrganizationsMap(prev => ({
        ...prev,
        [tenantId]: (prev[tenantId] || []).map(o => {
          if (o.id === selectedOrgId) {
            return {
              ...o,
              projects: o.projects.map(p => {
                if (p.id === projId) {
                  return {
                    ...p,
                    progress: Math.min(100, p.progress + 15),
                    status: p.progress + 15 >= 100 ? 'Completed' : 'In Progress',
                    lastSync: new Date().toISOString().replace('T', ' ').substring(0, 19)
                  };
                }
                return p;
              })
            };
          }
          return o;
        })
      }));
      setSyncingProjectId(null);
    }, 800);
  };

  // User Toggle Active/Suspended Status Workflow
  const handleToggleUserStatus = (usrId: string) => {
    const tenantId = selectedTenantId || 'tenant-acme';
    setOrganizationsMap(prev => ({
      ...prev,
      [tenantId]: (prev[tenantId] || []).map(o => {
        if (o.id === selectedOrgId) {
          return {
            ...o,
            users: o.users.map(u => {
              if (u.id === usrId) {
                return {
                  ...u,
                  status: u.status === 'Active' ? 'Inactive' : 'Active'
                };
              }
              return u;
            })
          };
        }
        return o;
      })
    }));
  };

  // Schedule Report Submit Workflow
  const handleScheduleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportToSchedule) return;

    const tenantId = selectedTenantId || 'tenant-acme';
    addAuditLog(
      tenantId,
      'Automated Report Schedule Configured',
      'Configuration',
      'Success',
      `Scheduled ${scheduleFrequency} automated delivery of "${reportToSchedule.title}" to ${scheduleEmail || 'configured admin recipients'}.`
    );

    setIsScheduleReportModalOpen(false);
    setReportToSchedule(null);
  };

  const handleAddProject = () => {
    if (!newProjName.trim()) return;
    const tenantId = selectedTenantId || 'tenant-acme';
    const currentOrgs = organizationsMap[tenantId] || [];
    
    const updatedOrgs = currentOrgs.map(o => {
      if (o.id === selectedOrgId) {
        const newProj: OrgProject = {
          id: `proj-${Date.now()}`,
          name: newProjName,
          status: newProjStatus,
          progress: newProjProgress,
          lastSync: new Date().toISOString().replace('T', ' ').substring(0, 19)
        };
        return {
          ...o,
          projects: [...o.projects, newProj]
        };
      }
      return o;
    });

    setOrganizationsMap(prev => ({
      ...prev,
      [tenantId]: updatedOrgs
    }));
    setNewProjName('');
    setNewProjProgress(10);
  };

  const handleDeleteProject = (projId: string) => {
    const tenantId = selectedTenantId || 'tenant-acme';
    const updatedOrgs = (organizationsMap[tenantId] || []).map(o => {
      if (o.id === selectedOrgId) {
        return {
          ...o,
          projects: o.projects.filter(p => p.id !== projId)
        };
      }
      return o;
    });
    setOrganizationsMap(prev => ({
      ...prev,
      [tenantId]: updatedOrgs
    }));
  };

  const handleAddUser = () => {
    if (!newUsrName.trim() || !newUsrEmail.trim()) return;
    const tenantId = selectedTenantId || 'tenant-acme';
    const currentOrgs = organizationsMap[tenantId] || [];
    
    const updatedOrgs = currentOrgs.map(o => {
      if (o.id === selectedOrgId) {
        const newUsr: OrgUser = {
          id: `usr-${Date.now()}`,
          name: newUsrName,
          email: newUsrEmail,
          role: newUsrRole,
          status: 'Active'
        };
        return {
          ...o,
          users: [...o.users, newUsr]
        };
      }
      return o;
    });

    setOrganizationsMap(prev => ({
      ...prev,
      [tenantId]: updatedOrgs
    }));
    setNewUsrName('');
    setNewUsrEmail('');
  };

  const handleDeleteUser = (usrId: string) => {
    const tenantId = selectedTenantId || 'tenant-acme';
    const updatedOrgs = (organizationsMap[tenantId] || []).map(o => {
      if (o.id === selectedOrgId) {
        return {
          ...o,
          users: o.users.filter(u => u.id !== usrId)
        };
      }
      return o;
    });
    setOrganizationsMap(prev => ({
      ...prev,
      [tenantId]: updatedOrgs
    }));
  };

  const handleAddConnector = () => {
    if (!newConnName.trim()) return;
    const tenantId = selectedTenantId || 'tenant-acme';
    const currentOrgs = organizationsMap[tenantId] || [];
    
    const updatedOrgs = currentOrgs.map(o => {
      if (o.id === selectedOrgId) {
        const newConn: OrgConnector = {
          id: `conn-${Date.now()}`,
          name: newConnName,
          type: newConnType,
          status: 'Healthy',
          throughput: newConnThroughput
        };
        return {
          ...o,
          connectors: [...o.connectors, newConn]
        };
      }
      return o;
    });

    setOrganizationsMap(prev => ({
      ...prev,
      [tenantId]: updatedOrgs
    }));
    setNewConnName('');
  };

  const handleDeleteConnector = (connId: string) => {
    const tenantId = selectedTenantId || 'tenant-acme';
    const updatedOrgs = (organizationsMap[tenantId] || []).map(o => {
      if (o.id === selectedOrgId) {
        return {
          ...o,
          connectors: o.connectors.filter(c => c.id !== connId)
        };
      }
      return o;
    });
    setOrganizationsMap(prev => ({
      ...prev,
      [tenantId]: updatedOrgs
    }));
  };

  const handleGenerateReport = () => {
    if (!newRepTitle.trim()) return;
    setIsGeneratingReport(true);
    
    setTimeout(() => {
      const tenantId = selectedTenantId || 'tenant-acme';
      const currentOrgs = organizationsMap[tenantId] || [];
      
      const updatedOrgs = currentOrgs.map(o => {
        if (o.id === selectedOrgId) {
          const newRep: OrgReport = {
            id: `rep-${Date.now()}`,
            title: newRepTitle,
            type: newRepType,
            generatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
            size: `${(Math.random() * 8 + 1).toFixed(1)} MB`
          };
          return {
            ...o,
            reports: [newRep, ...o.reports]
          };
        }
        return o;
      });

      setOrganizationsMap(prev => ({
        ...prev,
        [tenantId]: updatedOrgs
      }));
      setIsGeneratingReport(false);
      setNewRepTitle('');
    }, 1000);
  };

  const handleDeleteReport = (repId: string) => {
    const tenantId = selectedTenantId || 'tenant-acme';
    const updatedOrgs = (organizationsMap[tenantId] || []).map(o => {
      if (o.id === selectedOrgId) {
        return {
          ...o,
          reports: o.reports.filter(r => r.id !== repId)
        };
      }
      return o;
    });
    setOrganizationsMap(prev => ({
      ...prev,
      [tenantId]: updatedOrgs
    }));
  };

  // Handler for tenant toggle (Activation / Deactivation)
  const handleToggleTenantStatus = (id: string) => {
    if (!isSuperAdmin) {
      alert("Permission Denied: Only Super Admins can activate or deactivate core system tenants.");
      return;
    }
    setTenants(prev => prev.map(t => {
      if (t.id === id) {
        const nextActive = !t.isActive;
        addAuditLog(
          id,
          nextActive ? 'Tenant Workspace Activated' : 'Tenant Workspace Deactivated',
          'Security',
          nextActive ? 'Success' : 'Warning',
          nextActive 
            ? `Tenant workspace "${t.name}" has been manually activated. Routing and access rules restored.`
            : `Tenant workspace "${t.name}" has been manually deactivated. Access keys suspended and routing severed.`
        );
        return {
          ...t,
          isActive: nextActive,
          status: nextActive ? 'Active' : 'Deactivated',
          subscription: {
            ...t.subscription,
            status: nextActive ? 'Active' : 'Suspended'
          }
        };
      }
      return t;
    }));
  };

  // Create new SaaS tenant workflow simulation
  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantName || !newTenantDomain) return;

    // Start provisioning simulation
    setIsProvisioning(true);
    setProvisionProgress(5);
    setProvisionLogs(['Initiating multi-tenant provisioning worker...']);

    const steps = [
      { progress: 15, log: 'Creating isolated PostgreSQL schema "tenant_' + newTenantDomain.toLowerCase() + '"...' },
      { progress: 30, log: 'Provisioning dedicated Redis cache clusters in region ' + newTenantRegion + '...' },
      { progress: 50, log: 'Registering DNS subdomain "' + newTenantDomain.toLowerCase() + '.edimp.com" in system CDN...' },
      { progress: 65, log: 'Establishing secure SSO integrations with IdP metadata keys...' },
      { progress: 80, log: 'Generating encrypted tenant-specific JWT keys and API tokens...' },
      { progress: 95, log: 'Seeding standard CDC configuration metadata to cluster database...' },
      { progress: 100, log: 'Tenant ' + newTenantName + ' successfully provisioned and verified!' }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setProvisionProgress(steps[currentStep].progress);
        setProvisionLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${steps[currentStep].log}`]);
        currentStep++;
      } else {
        clearInterval(interval);
        
        // Add new tenant to state
        const pricingMap = { Trial: 0, Starter: 499, Professional: 1999, Enterprise: 4999, Partner: 8999, Unlimited: 25000 };
        const storageLimitMap = { Trial: 10, Starter: 1000, Professional: 10000, Enterprise: 50000, Partner: 100000, Unlimited: 500000 };
        const vCpusMap = { Trial: 2, Starter: 4, Professional: 8, Enterprise: 16, Partner: 32, Unlimited: 64 };
        const memoryMap = { Trial: 8, Starter: 16, Professional: 32, Enterprise: 64, Partner: 128, Unlimited: 256 };
        const apiMap = { Trial: 100, Starter: 500, Professional: 1000, Enterprise: 2500, Partner: 5000, Unlimited: 10000 };

        const newlyCreatedTenant: Tenant = {
          id: `tenant-${Date.now()}`,
          name: newTenantName,
          partnerId: isPartnerAdmin ? 'partner-assigned' : 'partner-direct',
          partnerName: isPartnerAdmin ? 'My Assigned Partner Org' : 'Alpha Cloud Solutions',
          isActive: true,
          status: 'Active',
          createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
          primaryContact: newTenantContact || 'N/A',
          adminEmail: newTenantEmail || 'admin@' + newTenantDomain + '.com',
          region: newTenantRegion,
          subscription: {
            tier: newTenantTier,
            status: 'Active',
            priceMonthly: pricingMap[newTenantTier],
            billingCycle: 'Monthly',
            startDate: new Date().toISOString().split('T')[0],
            nextRenewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            autoRenew: true
          },
          branding: {
            portalTitle: `${newTenantName} Migration Hub`,
            themeColor: 'sapphire',
            logoText: newTenantName.toUpperCase()
          },
          resources: {
            memoryGb: memoryMap[newTenantTier],
            vCpus: vCpusMap[newTenantTier],
            storageGb: storageLimitMap[newTenantTier],
            apiRateLimitRps: apiMap[newTenantTier],
            maxUserAccounts: 100
          },
          config: {
            subdomain: newTenantDomain,
            ssoProvider: 'None',
            ssoMetadataUrl: '',
            webhookCallbackUrl: '',
            dbClusterHost: `db-${newTenantRegion.toLowerCase()}.cluster.edimp.internal`
          },
          backups: [
            { id: `bak-${Date.now()}`, timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19), sizeMb: 45, status: 'Completed', triggeredBy: activeRole, checksum: 'sha256:init_checksum' }
          ],
          invoices: [
            { id: `inv-${Date.now()}`, date: new Date().toISOString().split('T')[0], amount: pricingMap[newTenantTier], status: 'Paid', paymentMethod: 'Mastercard ending in 0000' }
          ]
        };

        setTenants(prev => [newlyCreatedTenant, ...prev]);
        setSelectedTenantId(newlyCreatedTenant.id);

        // SEED AUDIT LOGS FOR NEW TENANT
        setAuditLogs(prev => ({
          ...prev,
          [newlyCreatedTenant.id]: [
            {
              id: `log-prov-${Date.now()}-1`,
              timestamp: newlyCreatedTenant.createdAt,
              actor: 'System Provisioning Engine',
              action: 'Workspace Provisioned',
              category: 'Provisioning',
              severity: 'Success',
              description: `Multi-tenant workspace allocated for "${newlyCreatedTenant.name}" in region ${newlyCreatedTenant.region} with subdomain ${newlyCreatedTenant.config.subdomain}.edimp.com.`
            },
            {
              id: `log-prov-${Date.now()}-2`,
              timestamp: newlyCreatedTenant.createdAt,
              actor: 'System Provisioning Engine',
              action: 'Database Schema Generated',
              category: 'Provisioning',
              severity: 'Success',
              description: `Isolated PostgreSQL schema "edimp_schema_${newlyCreatedTenant.id.replace('tenant-', '')}" created on host cluster ${newlyCreatedTenant.config.dbClusterHost}.`
            }
          ]
        }));

        setTimeout(() => {
          setIsProvisioning(false);
          setIsCreateModalOpen(false);
          // Reset fields
          setNewTenantName('');
          setNewTenantDomain('');
          setNewTenantContact('');
          setNewTenantEmail('');
          setNewTenantTier('Starter');
        }, 1200);
      }
    }, 800);
  };

  // Perform a proactive validation check before bulk migration execution
  const handlePreFlightCheck = () => {
    if (selectedTenantIdsForMigration.length === 0) {
      alert("Please select at least one tenant to run a pre-flight check.");
      return;
    }

    setIsPreFlightScanning(true);
    setPreFlightStatus('scanning');
    setPreFlightLogs([
      `[${new Date().toLocaleTimeString()}] Initializing pre-flight validation pipeline...`,
      `[${new Date().toLocaleTimeString()}] Analyzing migration parameters: Source [${selectedMigrateSourcePool.split('.')[0]}], Target [${selectedMigrateTargetPool.split('.')[0]}], Type [${selectedMigrateType}]`,
    ]);

    const activeTenants = tenants.filter(t => selectedTenantIdsForMigration.includes(t.id));

    // Stage 1: Connectivity scan simulation
    setTimeout(() => {
      setPreFlightLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Stage 1: Establishing database cluster socket connections...`,
        ...activeTenants.map(t => `[${new Date().toLocaleTimeString()}] [Tenant: ${t.name}] Pinged host ${selectedMigrateSourcePool} ➔ Latency: ${Math.floor(10 + Math.random() * 20)}ms. Connection ESTABLISHED.`)
      ]);
    }, 450);

    // Stage 2: Schema parity simulation
    setTimeout(() => {
      setPreFlightLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Stage 2: Performing DDL Schema Parity & pg_catalog introspection...`,
        ...activeTenants.map(t => `[${new Date().toLocaleTimeString()}] [Tenant: ${t.name}] Verified column schema definitions (indices, primary keys, relational triggers).`),
        `[${new Date().toLocaleTimeString()}] Comparing active database extensions between cluster pools...`
      ]);
    }, 900);

    // Stage 3: Resource check & report synthesis
    setTimeout(() => {
      const details = activeTenants.map(t => {
        let isWarn = false;
        let schemaMsg = "Schema Parity Verified (100% Match)";

        // Create some interesting real-world warning scenarios
        if (selectedMigrateTargetPool.includes('v17') && selectedMigrateType !== 'PostgreSQL Version Upgrade') {
          isWarn = true;
          schemaMsg = "Schema matches, but target pool is on modern PG v17. Major engine upgrade suggested.";
        } else if (t.subscription.tier === 'Enterprise' && selectedMigrateTargetPool.includes('premium-shared')) {
          isWarn = true;
          schemaMsg = "Enterprise tenant mapped to shared cluster. Headroom density warning.";
        }

        return {
          tenantName: t.name,
          connectivity: "Online (Verified socket)",
          schemaParity: schemaMsg,
          status: (isWarn ? 'warning' : 'success') as 'success' | 'warning'
        };
      });

      const hasAnyWarning = details.some(d => d.status === 'warning');

      setPreFlightLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Stage 3: Verifying target cluster compute limits (vCPU / Memory limits)...`,
        `[${new Date().toLocaleTimeString()}] Target pool capacity: 16 vCPUs / 64GB RAM. Check: PASSED.`,
        `[${new Date().toLocaleTimeString()}] Pre-flight validation completed with status: ${hasAnyWarning ? 'WARNING' : 'PASSED'}.`
      ]);

      setPreFlightResults({
        connectivityOk: true,
        schemaParityOk: !hasAnyWarning,
        resourceValidationOk: true,
        details
      });

      setPreFlightStatus(hasAnyWarning ? 'warning' : 'passed');
      setIsPreFlightScanning(false);

      // Log a security audit log showing the action was validated
      addAuditLog(
        selectedTenantId || activeTenants[0]?.id || 'system',
        'Pre-Flight Validation Performed',
        'Security',
        hasAnyWarning ? 'Warning' : 'Success',
        `Completed pre-flight check on ${activeTenants.length} target tenants from source "${selectedMigrateSourcePool.split('.')[0]}" to target "${selectedMigrateTargetPool.split('.')[0]}". Status: ${hasAnyWarning ? 'COMPLETED WITH WARNINGS' : 'VERIFIED PASSED'}.`
      );

    }, 1400);
  };

  // Start simultaneous bulk migration job for selected tenants
  const handleStartBulkMigration = () => {
    if (selectedTenantIdsForMigration.length === 0) {
      alert("Please select at least one tenant to migrate.");
      return;
    }
    if (selectedMigrateSourcePool === selectedMigrateTargetPool) {
      alert("Target shared resource pool cannot be the same as the source resource pool.");
      return;
    }
    if (!isSuperAdmin) {
      alert("Permission Denied: Only Super Admins can execute bulk cluster migration operations.");
      return;
    }

    setIsBulkMigrating(true);
    setBulkMigrationProgress(5);
    setBulkMigrationLogs([
      `[${new Date().toLocaleTimeString()}] Starting simultaneous migration job for ${selectedTenantIdsForMigration.length} tenants...`,
      `[${new Date().toLocaleTimeString()}] Source Resource Pool: [${selectedMigrateSourcePool}]`,
      `[${new Date().toLocaleTimeString()}] Target Resource Pool: [${selectedMigrateTargetPool}]`,
      `[${new Date().toLocaleTimeString()}] Migration Scope: [${selectedMigrateType}]`,
      `[${new Date().toLocaleTimeString()}] Acquiring cluster synchronization lock ... OK`
    ]);

    const activeTenantObjects = tenants.filter(t => selectedTenantIdsForMigration.includes(t.id));

    const steps = [
      {
        progress: 20,
        log: () => [
          `[${new Date().toLocaleTimeString()}] Transitioning tenants to read-only buffer mode...`,
          ...activeTenantObjects.map(t => `[${new Date().toLocaleTimeString()}] [Tenant: ${t.name}] Set state READONLY. Buffered transactions active.`)
        ]
      },
      {
        progress: 45,
        log: () => [
          `[${new Date().toLocaleTimeString()}] Extracting active PostgreSQL schemas and relational definitions...`,
          ...activeTenantObjects.map(t => `[${new Date().toLocaleTimeString()}] [Tenant: ${t.name}] Schema dump complete: edimp_schema_${t.id.replace('tenant-', '')} (${t.resources.storageGb * 0.15} MB)`)
        ]
      },
      {
        progress: 70,
        log: () => [
          `[${new Date().toLocaleTimeString()}] Deploying resource containers to target host: ${selectedMigrateTargetPool}...`,
          ...activeTenantObjects.map(t => `[${new Date().toLocaleTimeString()}] [Tenant: ${t.name}] Allocated ${t.resources.vCpus} vCPUs / ${t.resources.memoryGb}GB RAM in pool container group.`),
          `[${new Date().toLocaleTimeString()}] Checking target health parameters... OK.`
        ]
      },
      {
        progress: 85,
        log: () => [
          `[${new Date().toLocaleTimeString()}] Restoring database tables and synchronizing incremental write-ahead logs (WAL)...`,
          ...activeTenantObjects.map(t => `[${new Date().toLocaleTimeString()}] [Tenant: ${t.name}] Synced 100% of tables. Swapping connection strings.`)
        ]
      },
      {
        progress: 95,
        log: () => [
          `[${new Date().toLocaleTimeString()}] Updating DNS proxy route directives inside edge routers...`,
          ...activeTenantObjects.map(t => `[${new Date().toLocaleTimeString()}] [Tenant: ${t.name}] Re-routed ${t.config.subdomain}.edimp.com to host [${selectedMigrateTargetPool}]`)
        ]
      },
      {
        progress: 100,
        log: () => [
          `[${new Date().toLocaleTimeString()}] Confirming platform-wide healthy response state...`,
          `[${new Date().toLocaleTimeString()}] All ${activeTenantObjects.length} tenants successfully migrated without system interruption!`,
          `[${new Date().toLocaleTimeString()}] Releasing synchronization locks... OK. Migration JOB COMPLETE.`
        ]
      }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        const step = steps[currentStep];
        setBulkMigrationProgress(step.progress);
        setBulkMigrationLogs(prev => [...prev, ...step.log()]);
        currentStep++;
      } else {
        clearInterval(interval);
        setIsBulkMigrating(false);

        // Actual State update! Update matching tenants' dbClusterHost
        setTenants(prev => prev.map(t => {
          if (selectedTenantIdsForMigration.includes(t.id)) {
            return {
              ...t,
              config: {
                ...t.config,
                dbClusterHost: selectedMigrateTargetPool
              }
            };
          }
          return t;
        }));

        // Log audit event for each migrated tenant
        selectedTenantIdsForMigration.forEach(id => {
          const tenantObj = tenants.find(t => t.id === id);
          if (tenantObj) {
            addAuditLog(
              id,
              'Tenant Migration Executed',
              'Configuration',
              'Success',
              `Executed bulk migration: transitioned from host pool "${selectedMigrateSourcePool.split('.')[0]}" to target cluster host "${selectedMigrateTargetPool.split('.')[0]}". Scope: "${selectedMigrateType}".`
            );
          }
        });

        // Append to history
        const names = activeTenantObjects.map(t => t.name).join(', ');
        setBulkMigrationHistory(prev => [
          {
            id: `mig-${Date.now().toString().slice(-4)}`,
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
            type: selectedMigrateType,
            sourcePool: selectedMigrateSourcePool,
            targetPool: selectedMigrateTargetPool,
            tenantsMigratedCount: activeTenantObjects.length,
            tenantsMigratedNames: names,
            status: 'Completed'
          },
          ...prev
        ]);
      }
    }, 1500);
  };

  // Modify currently selected Tenant details
  const handleUpdateBranding = (branding: Partial<TenantBranding>) => {
    setTenants(prev => prev.map(t => {
      if (t.id === selectedTenantId) {
        // If logoUrl is updated, don't output full base64 to audit log to avoid bloated logs
        const logBranding = { ...branding };
        if (logBranding.logoUrl && logBranding.logoUrl.startsWith('data:')) {
          logBranding.logoUrl = 'Serialized Base64 Logo Asset';
        }
        const changes = Object.entries(logBranding).map(([k, v]) => `${k} updated to "${v}"`).join(', ');
        addAuditLog(
          selectedTenantId,
          'Branding Reconfigured',
          'Configuration',
          'Success',
          `Custom portal branding modified: ${changes}.`
        );
        return {
          ...t,
          branding: { ...t.branding, ...branding }
        };
      }
      return t;
    }));
  };

  // Custom Logo File handler (read and serialize to Base64)
  const handleLogoFile = (file: File) => {
    setLogoUploadError(null);
    
    // File verification checks
    const allowedTypes = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setLogoUploadError('Unsupported file format. Please upload SVG, PNG, JPG, or WebP.');
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      setLogoUploadError('Logo asset exceeds 2MB limit. Please upload a lighter image.');
      return;
    }
    
    setLogoUploadProgress(10);
    const reader = new FileReader();
    
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const pct = Math.round((event.loaded / event.total) * 90) + 10;
        setLogoUploadProgress(Math.min(95, pct));
      }
    };
    
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setLogoUploadProgress(100);
      setTimeout(() => {
        handleUpdateBranding({ logoUrl: dataUrl });
        addAuditLog(
          selectedTenantId,
          'Logo Uploaded',
          'Configuration',
          'Success',
          `Successfully uploaded and active-serialized branding logo file "${file.name}" (${(file.size / 1024).toFixed(1)} KB).`
        );
        setLogoUploadProgress(null);
      }, 350);
    };
    
    reader.onerror = () => {
      setLogoUploadError('Failed reading custom brand logo file.');
      setLogoUploadProgress(null);
    };
    
    reader.readAsDataURL(file);
  };

  // Dynamic Preset logo handler
  const handlePresetSelect = (presetName: string, presetDataUrl: string) => {
    handleUpdateBranding({ logoUrl: presetDataUrl });
    addAuditLog(
      selectedTenantId,
      'Preset Logo Selected',
      'Configuration',
      'Success',
      `Assigned dynamic brand visual asset template: "${presetName}".`
    );
  };

  const handleUpdateConfig = (config: Partial<TenantConfig>) => {
    setTenants(prev => prev.map(t => {
      if (t.id === selectedTenantId) {
        const changes = Object.entries(config).map(([k, v]) => `${k} set to "${v}"`).join(', ');
        addAuditLog(
          selectedTenantId,
          'SaaS Domain & Config Updated',
          'Configuration',
          'Info',
          `Tenant configuration modified: ${changes}.`
        );
        return {
          ...t,
          config: { ...t.config, ...config }
        };
      }
      return t;
    }));
  };

  // Start Multi-Factor Pairing wizard
  const startPairingMfa = () => {
    setPairingDeviceName("Admin Primary Device");
    setPairingDeviceType("Authenticator App");
    setPairingAppName("Google Authenticator");
    setPairingStep(1);
    setIsPairingActive(true);
    setPairingError(null);
    setPairingCodeInput("");
    
    // Generate randomized pairing secret key
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let keyStr = 'EDIMP-MFA-';
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        keyStr += chars[Math.floor(Math.random() * chars.length)];
      }
      if (i < 3) keyStr += '-';
    }
    setPairingManualKey(keyStr);
  };

  // Verify code input and pair the device
  const verifyAndEnrollDevice = () => {
    setPairingError(null);
    if (!pairingCodeInput || pairingCodeInput.replace(/\s/g, '').length !== 6) {
      setPairingError("Verification code must be exactly 6 digits.");
      return;
    }

    const cleanInput = pairingCodeInput.replace(/\s/g, '');
    const cleanTotp = totpCode.replace(/\s/g, '');

    if (cleanInput === cleanTotp) {
      // Correct! Generate standard offline backup codes
      const codes: string[] = [];
      for (let i = 0; i < 8; i++) {
        const randHex = Math.floor(1000 + Math.random() * 9000).toString() + '-' + Math.floor(1000 + Math.random() * 9000).toString();
        codes.push(randHex);
      }
      setPairingSuccessCodes(codes);
      
      // Build the device object
      const newDevice: MfaDevice = {
        id: `mfa-${selectedTenantId}-${Date.now()}`,
        name: pairingDeviceName,
        type: pairingDeviceType,
        appName: pairingDeviceType === 'Authenticator App' ? pairingAppName : undefined,
        pairedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        lastUsedAt: 'Never Used',
        isActive: true
      };

      // Update active devices
      setMfaDevices(prev => ({
        ...prev,
        [selectedTenantId]: [...(prev[selectedTenantId] || []), newDevice]
      }));

      // Append Audit Log
      addAuditLog(
        selectedTenantId,
        'MFA Device Registered',
        'Security',
        'Success',
        `Successfully paired and cryptographically enrolled administrative token "${pairingDeviceName}" (${pairingDeviceType}${pairingDeviceType === 'Authenticator App' ? ` - ${pairingAppName}` : ''}).`
      );

      setPairingStep(4);
    } else {
      setPairingError("Verification challenge failed. The 6-digit code entered does not match our system servers. Please verify that your system timezone is set to automatic.");
    }
  };

  // Revoke paired MFA Device
  const revokeMfaDevice = (deviceId: string, name: string) => {
    if (!isSuperAdmin) {
      alert("Permission Denied: Only Super Admins can revoke administrative security credentials.");
      return;
    }
    setMfaDevices(prev => ({
      ...prev,
      [selectedTenantId]: (prev[selectedTenantId] || []).filter(d => d.id !== deviceId)
    }));
    
    addAuditLog(
      selectedTenantId,
      'MFA Device Revoked',
      'Security',
      'Warning',
      `Administrative MFA security token "${name}" (ID: ${deviceId}) was manually revoked by the Super Admin.`
    );
  };

  // Login Simulator: submit credentials
  const handleGatewaySubmitCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (!loginEmail) {
      setLoginError("Please enter a valid administrator email address.");
      return;
    }
    
    setLoginStep('mfa');
    setLoginMfaCode('');
  };

  // Login Simulator: verify TOTP
  const handleGatewayVerifyMfa = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (!loginMfaCode || loginMfaCode.replace(/\s/g, '').length !== 6) {
      setLoginError("Code must be exactly 6 digits.");
      return;
    }

    const cleanInput = loginMfaCode.replace(/\s/g, '');
    const cleanTotp = totpCode.replace(/\s/g, '');

    if (cleanInput === cleanTotp) {
      setMfaDevices(prev => {
        const devices = prev[selectedTenantId] || [];
        const updated = devices.map(d => {
          if (d.type === 'Authenticator App') {
            return { ...d, lastUsedAt: new Date().toISOString().replace('T', ' ').substring(0, 19) };
          }
          return d;
        });
        return { ...prev, [selectedTenantId]: updated };
      });

      addAuditLog(
        selectedTenantId,
        'Gateway Authentication Success',
        'Security',
        'Success',
        `Access granted to isolation namespace subdomain. Admin email: "${loginEmail}" completed secure MFA authorization check.`
      );

      setLoginStep('success');
    } else {
      setLoginError("Verification code mismatch. Access gateway denied authorization.");
    }
  };

  // Login Simulator: scan QR code
  const handleGatewayAutoScanQr = () => {
    setQrScanningActive(true);
    setTimeout(() => {
      setLoginMfaCode(totpCode);
      setQrScanningActive(false);
      setMfaDevices(prev => {
        const devices = prev[selectedTenantId] || [];
        const updated = devices.map(d => {
          if (d.type === 'Authenticator App') {
            return { ...d, lastUsedAt: new Date().toISOString().replace('T', ' ').substring(0, 19) };
          }
          return d;
        });
        return { ...prev, [selectedTenantId]: updated };
      });

      addAuditLog(
        selectedTenantId,
        'Gateway Scan-to-Login Completed',
        'Security',
        'Success',
        `Instant scan-to-login pairing challenge completed successfully. User camera synchronized with gateway JWT.`
      );

      setLoginStep('success');
    }, 1200);
  };

  // Login Simulator: reset
  const resetGatewaySimulator = () => {
    setLoginStep('credentials');
    setLoginEmail('');
    setLoginPassword('');
    setLoginMfaCode('');
    setLoginError(null);
  };

  const handleUpdateResources = (resources: Partial<TenantResources>) => {
    // Partner admin cannot increase resources past a cap
    if (isPartnerAdmin) {
      if (resources.vCpus && resources.vCpus > 16) {
        alert("Partner limits exceeded: Partner Admins cannot allocate more than 16 vCPUs per tenant.");
        return;
      }
      if (resources.memoryGb && resources.memoryGb > 64) {
        alert("Partner limits exceeded: Partner Admins cannot allocate more than 64GB memory per tenant.");
        return;
      }
    }

    setTenants(prev => prev.map(t => {
      if (t.id === selectedTenantId) {
        const changes = Object.entries(resources).map(([k, v]) => `${k} scaled to ${v}`).join(', ');
        addAuditLog(
          selectedTenantId,
          'Resource Limit Reconfigured',
          'Configuration',
          'Info',
          `Dynamic hardware scaling: ${changes}. Changes provisioned within 2 minutes.`
        );
        return {
          ...t,
          resources: { ...t.resources, ...resources }
        };
      }
      return t;
    }));
  };

  const handleUpdateSubscription = (sub: Partial<TenantSubscription>) => {
    setTenants(prev => prev.map(t => {
      if (t.id === selectedTenantId) {
        const changes = Object.entries(sub).map(([k, v]) => `${k} updated to ${v}`).join(', ');
        addAuditLog(
          selectedTenantId,
          'Subscription Billing Modified',
          'Billing',
          'Info',
          `SaaS subscription parameter modified: ${changes}.`
        );
        return {
          ...t,
          subscription: { ...t.subscription, ...sub }
        };
      }
      return t;
    }));
  };

  // Manual Backup Simulation
  const handleTriggerBackup = () => {
    if (isBackingUp) return;
    setIsBackingUp(true);
    setBackupProgress(5);

    const interval = setInterval(() => {
      setBackupProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          
          // Complete backup and append to list
          const newBackup: TenantBackup = {
            id: `bak-${Math.floor(100 + Math.random() * 900)}`,
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
            sizeMb: Math.round(500 + Math.random() * 2000),
            status: 'Completed',
            triggeredBy: activeRole,
            checksum: `sha256:${Math.random().toString(36).substring(2, 10)}...`
          };

          addAuditLog(
            selectedTenantId,
            'Manual Snapshot Triggered',
            'Backup',
            'Success',
            `Ad-hoc disaster recovery snapshot "${newBackup.id}" created successfully (size: ${newBackup.sizeMb} MB) by ${activeRole}.`
          );

          setTenants(prevTenants => prevTenants.map(t => {
            if (t.id === selectedTenantId) {
              return {
                ...t,
                backups: [newBackup, ...t.backups]
              };
            }
            return t;
          }));

          setIsBackingUp(false);
          return 100;
        }
        return prev + 15;
      });
    }, 300);
  };

  // Restore Backup Simulation
  const handleTriggerRestore = (backup: TenantBackup) => {
    setSelectedBackupToRestore(backup);
    setShowRestoreModal(true);
  };

  const confirmAndRunRestore = () => {
    if (!selectedBackupToRestore) return;
    setIsRestoring(true);
    setRestoreProgress(0);
    setRestoreLogs(['[System] Initializing restore task cluster...', `[System] Target backup payload: ${selectedBackupToRestore.id} (${selectedBackupToRestore.sizeMb} MB)`]);

    const steps = [
      'Taking protective snap of active data...',
      'De-routing active tenant CDC transaction traffic...',
      'Flushing query pool connection channels...',
      'Dropping active schema keys for re-population...',
      'Re-assembling relational partition tables from cold backup snapshot...',
      'Running data consistency checkers and checksum verifications...',
      'Restructuring secure API gateway indexes...',
      'Re-routing active transaction traffic (Optimal)...',
      'Data restore fully complete and healthy!'
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        const nextProgress = Math.round(((currentStep + 1) / steps.length) * 100);
        setRestoreProgress(nextProgress);
        setRestoreLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${steps[currentStep]}`]);
        currentStep++;
      } else {
        clearInterval(interval);
        
        // Update backup status in list
        setTenants(prevTenants => prevTenants.map(t => {
          if (t.id === selectedTenantId) {
            return {
              ...t,
              backups: t.backups.map(b => b.id === selectedBackupToRestore.id ? { ...b, status: 'Restored' } : b)
            };
          }
          return t;
        }));

        addAuditLog(
          selectedTenantId,
          'Cold Snapshot Restored',
          'Backup',
          'Warning',
          `Initiated total disaster recovery restore from snapshot "${selectedBackupToRestore.id}" (${selectedBackupToRestore.sizeMb} MB). Workspace state rolled back.`
        );

        setTimeout(() => {
          setIsRestoring(false);
          setShowRestoreModal(false);
          setSelectedBackupToRestore(null);
        }, 1200);
      }
    }, 600);
  };

  // Filter tenants list
  const filteredTenants = tenants.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.config.subdomain.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.adminEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' ? true : t.status === statusFilter;
    const matchesTier = tierFilter === 'All' ? true : t.subscription.tier === tierFilter;
    
    // In partner-admin mode, we restrict access: let's pretend Partner Admin belongs to partner-alpha
    if (isPartnerAdmin) {
      return matchesSearch && matchesStatus && matchesTier && t.partnerId === 'partner-alpha';
    }
    
    return matchesSearch && matchesStatus && matchesTier;
  });

  // Recharts Chart Data Calculations
  const getTrafficChartData = () => {
    const multiplier = currentTenant.subscription.tier === 'Enterprise' ? 2.5 :
                       currentTenant.subscription.tier === 'Professional' ? 1.2 : 0.5;
    return [
      { name: '00:00', requests: Math.round(12000 * multiplier), errors: Math.round(20 * multiplier) },
      { name: '04:00', requests: Math.round(8000 * multiplier), errors: Math.round(10 * multiplier) },
      { name: '08:00', requests: Math.round(22000 * multiplier), errors: Math.round(45 * multiplier) },
      { name: '12:00', requests: Math.round(35000 * multiplier), errors: Math.round(98 * multiplier) },
      { name: '16:00', requests: Math.round(41000 * multiplier), errors: Math.round(112 * multiplier) },
      { name: '20:00', requests: Math.round(28000 * multiplier), errors: Math.round(55 * multiplier) },
      { name: '24:00', requests: Math.round(15000 * multiplier), errors: Math.round(25 * multiplier) }
    ];
  };

  const getResourceChartData = () => {
    return [
      { name: 'CPU Load (%)', Utilized: usageStats.avgCpuUtilPct, Limit: 100 },
      { name: 'RAM Load (%)', Utilized: usageStats.avgRamUtilPct, Limit: 100 },
      { name: 'DB Space (%)', Utilized: Math.round((usageStats.dbStorageConsumedGb / currentTenant.resources.storageGb) * 100), Limit: 100 }
    ];
  };

  const getHeatmapCellValue = (tenantId: string | undefined, rowName: string, hour: number) => {
    const tier = currentTenant?.subscription.tier || 'Starter';
    const tierBase = tier === 'Enterprise' ? 55 :
                     tier === 'Professional' ? 40 :
                     tier === 'Starter' ? 25 : 15;

    let peakFactor = 0;
    const id = tenantId || 'tenant-acme';
    if (id === 'tenant-acme') {
      if ((hour >= 10 && hour <= 12) || (hour >= 14 && hour <= 16)) {
        peakFactor = 35;
      } else if (hour >= 9 && hour <= 18) {
        peakFactor = 15;
      } else {
        peakFactor = -10;
      }
    } else if (id === 'tenant-globex') {
      if ((hour >= 8 && hour <= 10) || (hour >= 15 && hour <= 18)) {
        peakFactor = 40;
      } else if (hour >= 7 && hour <= 21) {
        peakFactor = 20;
      } else {
        peakFactor = -5;
      }
    } else if (id === 'tenant-initech') {
      if (hour >= 1 && hour <= 4) {
        peakFactor = 55;
      } else if (hour >= 9 && hour <= 17) {
        peakFactor = 10;
      } else {
        peakFactor = -15;
      }
    } else {
      if (hour >= 11 && hour <= 15) {
        peakFactor = 30;
      } else if (hour >= 8 && hour <= 18) {
        peakFactor = 12;
      } else {
        peakFactor = -8;
      }
    }

    let rowMultiplier = 1.0;
    if (rowName === 'CPU Utilization') {
      rowMultiplier = 0.95;
    } else if (rowName === 'RAM Allocation') {
      rowMultiplier = 1.1;
      if (peakFactor < 0) peakFactor = peakFactor * 0.3;
    } else if (rowName === 'API Throughput') {
      rowMultiplier = 0.85;
    } else if (rowName === 'DB Write IOPS') {
      rowMultiplier = 0.75;
    }

    let val = (tierBase + peakFactor) * rowMultiplier;

    if (heatmapSpikeActive) {
      val = val * 1.55;
    }

    val = val + (Math.sin(hour * 1.5) * 5);
    val = Math.max(5, Math.min(98, val));
    return Math.round(val);
  };

  const getHeatmapCellColor = (value: number, themeColor: string | undefined) => {
    if (value > 90) {
      return 'bg-rose-500';
    }
    
    const theme = themeColor || 'indigo';
    
    if (theme === 'emerald') {
      if (value > 75) return 'bg-emerald-600';
      if (value > 50) return 'bg-emerald-400';
      if (value > 25) return 'bg-emerald-200';
      return 'bg-slate-100';
    } else if (theme === 'amber') {
      if (value > 75) return 'bg-amber-500';
      if (value > 50) return 'bg-amber-300';
      if (value > 25) return 'bg-amber-100';
      return 'bg-slate-100';
    } else if (theme === 'rose' || theme === 'ruby') {
      if (value > 75) return 'bg-rose-600';
      if (value > 50) return 'bg-rose-400';
      if (value > 25) return 'bg-rose-200';
      return 'bg-slate-100';
    } else {
      if (value > 75) return 'bg-indigo-600';
      if (value > 50) return 'bg-indigo-400';
      if (value > 25) return 'bg-indigo-200';
      return 'bg-slate-100';
    }
  };

  const getHeatmapInsights = (tenantId: string | undefined, tier: string | undefined) => {
    const id = tenantId || 'tenant-acme';
    if (id === 'tenant-acme') {
      return [
        {
          badge: 'SLA Warning',
          badgeStyle: 'bg-amber-50 text-amber-700 border-amber-200',
          time: '14:00 - 16:00 Daily',
          title: 'Peak Workday Congestion',
          description: 'CPU & API requests approach 82% of the total allocated limits. Standard workday traffic creates sustained load.'
        },
        {
          badge: 'Recommendation',
          badgeStyle: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          time: 'Active Optimization',
          title: 'Shift Non-Critical Crons',
          description: 'Migrating internal analytical exports from 14:30 to 22:00 would lower core peak usage by up to 15%.'
        }
      ];
    } else if (id === 'tenant-globex') {
      return [
        {
          badge: 'Multi-Region Peak',
          badgeStyle: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          time: '08:00 & 16:00 Daily',
          title: 'Transatlantic Shift Peaks',
          description: 'High concurrency identified at 08:00 (EU Morning login) and 16:00 (US login overlap). Load is well-balanced across pools.'
        },
        {
          badge: 'Auto-scale Check',
          badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          time: 'Active Auto-scalers',
          title: 'Container Scaling Active',
          description: 'Dynamic resource groups auto-expanded 2x containers at 08:05 to buffer memory footprint. Re-consolidated at 11:30.'
        }
      ];
    } else if (id === 'tenant-initech') {
      return [
        {
          badge: 'Critical Peak',
          badgeStyle: 'bg-rose-50 text-rose-700 border-rose-200',
          time: '01:00 - 04:00 Daily',
          title: 'Intense Batch ETL Pipeline',
          description: 'Database IOPS spikes to 92% of standard allocation during massive legacy night syncs. Compute load is near-critical.'
        },
        {
          badge: 'Resource Limit',
          badgeStyle: 'bg-amber-50 text-amber-700 border-amber-200',
          time: 'ETL Optimization',
          title: 'Upgrade Standard Tier Proposed',
          description: 'Transitioning to Professional tier would allocate double the DB connection limit and resolve nightly bottlenecks.'
        }
      ];
    } else {
      return [
        {
          badge: 'Baseline Phase',
          badgeStyle: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          time: 'Gathering Telemetry',
          title: 'Gathering Telemetry Profiles',
          description: 'System is cataloging baseline transaction behavior. Standard workload shows optimal 30-45% average load.'
        },
        {
          badge: 'Optimal SLA',
          badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          time: 'Continuous Check',
          title: 'All Resource Caps Healthy',
          description: 'No saturation risks or throttling patterns detected over the last 24 hours. Performance remains pristine.'
        }
      ];
    }
  };

  // Budget and Cost Predictor helper calculations
  const getBillingForecast = (tenant: Tenant) => {
    const baseFee = tenant.subscription.priceMonthly;
    const threshold = budgetThresholds[tenant.id] || 1000;
    
    // Storage overage calculation
    const storageLimit = tenant.resources.storageGb;
    const storageConsumed = usageStats.dbStorageConsumedGb * (1 + growthRate / 100);
    const overStorage = Math.max(0, storageConsumed - storageLimit);
    let storageSurcharge = parseFloat((overStorage * 0.15).toFixed(2));
    
    // API overage calculation
    const apiLimit = tenant.subscription.tier === 'Enterprise' ? 200000000 :
                     tenant.subscription.tier === 'Professional' ? 50000000 :
                     tenant.subscription.tier === 'Starter' ? 10000000 : 1000000;
                     
    // Estimated monthly requests based on current rate and model
    const baseMonthlyRequests = usageStats.apiRequestsCount * 30;
    let runRateMultiplier = 1.0;
    if (forecastModel === 'conservative') runRateMultiplier = 0.90;
    if (forecastModel === 'aggressive') runRateMultiplier = 1.35;
    if (forecastModel === 'seasonal') runRateMultiplier = 1.18;
    
    const projectedRequests = baseMonthlyRequests * runRateMultiplier * (1 + growthRate / 100);
    const overApiRequests = Math.max(0, projectedRequests - apiLimit);
    let apiSurcharge = parseFloat(((overApiRequests / 10000) * 0.10).toFixed(2)); // $0.10 per 10,000 requests over limit
    
    // Compute Load surcharge
    const cpuOver = Math.max(0, usageStats.avgCpuUtilPct - 50);
    const ramOver = Math.max(0, usageStats.avgRamUtilPct - 60);
    let computeMultiplier = 1.0;
    if (forecastModel === 'conservative') computeMultiplier = 0.7;
    if (forecastModel === 'aggressive') computeMultiplier = 1.6;
    if (forecastModel === 'seasonal') computeMultiplier = 1.25;
    
    let computeSurcharge = parseFloat(((cpuOver * 1.8 + ramOver * 2.2) * computeMultiplier * (1 + growthRate / 100)).toFixed(2));
    
    // If resource optimization was applied, reduce surcharges by 40%!
    if (optimizationApplied[tenant.id]) {
      storageSurcharge = parseFloat((storageSurcharge * 0.6).toFixed(2));
      apiSurcharge = parseFloat((apiSurcharge * 0.6).toFixed(2));
      computeSurcharge = parseFloat((computeSurcharge * 0.6).toFixed(2));
    }

    const totalPredictedCost = Math.round(baseFee + storageSurcharge + apiSurcharge + computeSurcharge);
    const accruedCost = Math.round(baseFee * 0.225 + (storageSurcharge + apiSurcharge + computeSurcharge) * 0.15); // accrued roughly 7 days into the month
    
    return {
      baseFee,
      storageConsumed,
      storageLimit,
      overStorage,
      storageSurcharge,
      projectedRequests,
      apiLimit,
      overApiRequests,
      apiSurcharge,
      computeSurcharge,
      totalPredictedCost,
      accruedCost,
      threshold,
      isOverBudget: totalPredictedCost > threshold,
      percentOfBudget: Math.round((totalPredictedCost / threshold) * 100)
    };
  };

  const getForecastChartData = (tenant: Tenant) => {
    const forecast = getBillingForecast(tenant);
    const budget = forecast.threshold;
    
    // Build historic data from actual invoices
    const histInvoices = [...tenant.invoices].reverse();
    const data: any[] = [];
    
    // Ensure we have 3 historic points
    const months = ['May 2026', 'Jun 2026', 'Jul 2026'];
    months.forEach((m, idx) => {
      const inv = histInvoices[idx];
      const amt = inv ? inv.amount : tenant.subscription.priceMonthly;
      data.push({
        name: m,
        Actual: amt,
        Forecast: null,
        Budget: budget,
      });
    });
    
    // Add current month (August) as handoff point
    data.push({
      name: 'Aug 2026 (Curr)',
      Actual: forecast.accruedCost,
      Forecast: forecast.totalPredictedCost,
      Budget: budget,
    });
    
    // Add future projections (September, October, November)
    data.push({
      name: 'Sep 2026 (Proj)',
      Actual: null,
      Forecast: Math.round(forecast.totalPredictedCost * 1.05),
      Budget: budget,
    });
    data.push({
      name: 'Oct 2026 (Proj)',
      Actual: null,
      Forecast: Math.round(forecast.totalPredictedCost * 1.12),
      Budget: budget,
    });
    data.push({
      name: 'Nov 2026 (Proj)',
      Actual: null,
      Forecast: Math.round(forecast.totalPredictedCost * 1.20),
      Budget: budget,
    });
    
    return data;
  };

  return (
    <div id="tenant-mgmt-workspace" className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Workspace Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
          <Server className="w-48 h-48 text-slate-200" />
        </div>
        
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80 flex items-center gap-1.5 font-mono">
              <Server className="w-3.5 h-3.5 text-indigo-600" /> PLATFORM CONTROL
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">SaaS Multi-Tenant Portal Hub</h1>
          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
            Configure secure database isolation boundaries, customize branding, allocate CPU/RAM compute nodes, and trigger disaster backups for downstream clients.
          </p>
        </div>

        {/* Demo Role Switcher to display capabilities immediately */}
        <div className="flex flex-col bg-slate-50 p-3.5 rounded-xl border border-slate-200 shadow-2xs z-10 min-w-[220px]">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase font-bold text-slate-500 mb-1.5">
            <span>Workspace Context</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Shield className={`w-4 h-4 ${isSuperAdmin ? 'text-indigo-600' : 'text-emerald-600'}`} />
            <select
              id="workspace-role-test-selector"
              value={activeRole}
              onChange={(e) => setActiveRole(e.target.value as UserRole)}
              className="bg-transparent text-slate-900 font-bold text-xs border-0 outline-none p-0 cursor-pointer w-full focus:ring-0"
            >
              <option value="Super Admin" className="bg-white text-slate-900">Super Admin Mode</option>
              <option value="Partner Admin" className="bg-white text-slate-900">Partner Admin Mode</option>
            </select>
          </div>
          <span className="text-[10px] text-slate-500 font-mono mt-1">
            {isSuperAdmin ? '✓ Unlimited access to all client isolation spaces' : '⚠ Limited to Alpha Cloud partners (max vCPU/RAM limits)'}
          </span>
        </div>
      </div>

      {/* Partner Admin Alert Warning */}
      {isPartnerAdmin && (
        <div className="flex items-start gap-3 bg-emerald-950/30 border border-emerald-800/40 p-4 rounded-xl text-xs text-emerald-300">
          <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block">Assigned Partner Scope active: Alpha Cloud Solutions</span>
            <p>
              You are currently viewing organizations under your partner tenancy. Resource allocations are capped (max 16 vCPUs / 64GB memory) and deprovisioning is locked. Please contact a Super Admin to elevate.
            </p>
          </div>
        </div>
      )}

      {/* Interactive Multi-Tenant Architecture Topology Hub */}
      <MultiTenantArchitectureHub />

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left Side: Directory and Tenant Selector */}
        <div className="xl:col-span-4 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col h-[700px]">
          <div className="space-y-3 pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <span className="font-black text-sm uppercase text-slate-800 tracking-wide">Client Organizations</span>
              <button
                id="btn-trigger-create-tenant-modal"
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Tenant</span>
              </button>
            </div>

            {/* Search Box */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                id="tenant-search-input"
                type="text"
                placeholder="Search by name, subdomain..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            {/* Quick Status/Tier Filters */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label htmlFor="filter-status-select" className="text-[10px] uppercase font-bold text-slate-400 font-mono">Status</label>
                <select
                  id="filter-status-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs outline-none cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Deactivated">Deactivated</option>
                </select>
              </div>
              <div>
                <label htmlFor="filter-tier-select" className="text-[10px] uppercase font-bold text-slate-400 font-mono">Tier</label>
                <select
                  id="filter-tier-select"
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs outline-none cursor-pointer"
                >
                  <option value="All">All Tiers</option>
                  <option value="Enterprise">Enterprise</option>
                  <option value="Professional">Professional</option>
                  <option value="Standard">Standard</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tenants Directory List */}
          <div className="flex-1 overflow-y-auto py-2 space-y-2 mt-2 scrollbar-thin">
            {filteredTenants.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500 font-medium">No active client spaces matched criteria.</p>
              </div>
            ) : (
              filteredTenants.map((tenant) => {
                const isSelected = tenant.id === selectedTenantId;
                const tier = tenant.subscription.tier;
                
                const themeColorClasses = 
                  tenant.branding.themeColor === 'sapphire' ? 'border-l-indigo-600 bg-indigo-50/10' :
                  tenant.branding.themeColor === 'emerald' ? 'border-l-emerald-600 bg-emerald-50/10' :
                  tenant.branding.themeColor === 'amber' ? 'border-l-amber-500 bg-amber-50/10' :
                  tenant.branding.themeColor === 'rose' ? 'border-l-rose-500 bg-rose-50/10' :
                  'border-l-slate-700 bg-slate-50/10';

                return (
                  <div
                    key={tenant.id}
                    onClick={() => setSelectedTenantId(tenant.id)}
                    className={`p-3.5 border border-slate-100 rounded-xl flex flex-col justify-between cursor-pointer transition-all border-l-4 ${themeColorClasses} ${
                      isSelected ? 'ring-2 ring-indigo-500/70 border-indigo-200 shadow-sm' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex gap-2.5 items-start min-w-0 flex-1">
                        {/* Elegant mini tenant brand logo indicator */}
                        <div className="w-8 h-8 rounded-lg p-0.5 bg-white border border-slate-200/80 flex items-center justify-center shrink-0 shadow-3xs overflow-hidden">
                          {tenant.branding.logoUrl ? (
                            <img 
                              src={tenant.branding.logoUrl} 
                              alt={`${tenant.name} Logo`} 
                              className="w-full h-full object-contain rounded"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className={`w-full h-full rounded flex items-center justify-center font-black text-[10px] uppercase text-white ${
                              tenant.branding.themeColor === 'sapphire' ? 'bg-indigo-600' :
                              tenant.branding.themeColor === 'emerald' ? 'bg-emerald-600' :
                              tenant.branding.themeColor === 'amber' ? 'bg-amber-500' :
                              tenant.branding.themeColor === 'rose' ? 'bg-rose-500' :
                              'bg-slate-700'
                            }`}>
                              {tenant?.name ? tenant.name.split(' ').map(n => n[0]).join('').substring(0, 2) : ''}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-tight font-bold">{tenant.region}</span>
                          <h4 className="text-xs font-black text-slate-900 truncate">{tenant.name}</h4>
                          <span className="text-[10px] text-slate-500 block truncate">{tenant.config.subdomain}.edimp.com</span>
                        </div>
                      </div>
                      
                      {/* Subscription badge */}
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold shrink-0 ${
                        tier === 'Enterprise' ? 'bg-indigo-100 text-indigo-700' :
                        tier === 'Professional' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {tier}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100/60 pt-2.5 mt-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${tenant.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        <span className="text-[10px] text-slate-600 font-semibold">{tenant.status}</span>
                      </div>
                      
                      {/* Isolation check icon */}
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Lock className="w-3 h-3 text-slate-400" />
                        <span>Isolated DB</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Tabbed Details Panel */}
        <div className="xl:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col min-h-[700px] justify-between">
          
          {/* Tenant Title Header inside details */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
            {activeTab === 'summary' ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">Platform-Wide Overview</h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold border bg-indigo-50 text-indigo-700 border-indigo-200">
                    Live Telemetry
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-mono">
                  Multi-Tenant Cluster Summary • Active Schemas: <span className="font-bold text-indigo-600">{tenants.filter(t => t.isActive).length}/{tenants.length}</span>
                </p>
              </div>
            ) : activeTab === 'migration' ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">Bulk Resource & Tenant Migration</h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold border bg-amber-50 text-amber-700 border-amber-200">
                    Admin Utility
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-mono">
                  Simultaneous migration of tenants with shared resource pools
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {/* Dynamic Brand Logo Container */}
                <div className="w-10 h-10 rounded-xl p-1 bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-3xs overflow-hidden">
                  {currentTenant?.branding?.logoUrl ? (
                    <img 
                      src={currentTenant.branding.logoUrl} 
                      alt={`${currentTenant.name} Logo`} 
                      className="w-full h-full object-contain rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className={`w-full h-full rounded-lg flex items-center justify-center font-black text-sm uppercase text-white ${
                      currentTenant?.branding?.themeColor === 'sapphire' ? 'bg-indigo-600' :
                      currentTenant?.branding?.themeColor === 'emerald' ? 'bg-emerald-600' :
                      currentTenant?.branding?.themeColor === 'amber' ? 'bg-amber-500' :
                      currentTenant?.branding?.themeColor === 'rose' ? 'bg-rose-500' :
                      'bg-slate-700'
                    }`}>
                      {currentTenant?.name?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">{currentTenant?.name}</h2>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                      currentTenant?.isActive 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {currentTenant?.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono">
                    Tenancy UID: <span className="font-bold text-slate-800">{currentTenant?.id}</span> • Region: <span className="font-bold text-slate-800">{currentTenant?.region}</span>
                  </p>
                </div>
              </div>
            )}

            {activeTab !== 'summary' && activeTab !== 'migration' && (
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-semibold text-slate-600">Active Tenant State:</span>
                <button
                  id={`btn-toggle-active-tenant-${currentTenant?.id}`}
                  onClick={() => handleToggleTenantStatus(currentTenant?.id)}
                  className="focus:outline-none cursor-pointer"
                  title={currentTenant?.isActive ? "Click to Deactivate Customer" : "Click to Activate Customer"}
                >
                  {currentTenant?.isActive ? (
                    <ToggleRight className="w-9 h-9 text-indigo-600" />
                  ) : (
                    <ToggleLeft className="w-9 h-9 text-slate-300" />
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Sub Workspace View Tabs */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200/60 mt-4 overflow-x-auto shrink-0 scrollbar-none">
            <button
              id="btn-tab-summary"
              onClick={() => setActiveTab('summary')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'summary' ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-indigo-600" />
              <span>Summary Dashboard</span>
            </button>
            <button
              id="btn-tab-organizations"
              onClick={() => setActiveTab('organizations')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'organizations' ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Organizations</span>
              <span className="px-1.5 py-0.2 bg-indigo-500/10 text-indigo-700 text-[9px] rounded-full font-mono font-black border border-indigo-500/20">
                {organizationsMap[currentTenant?.id || '']?.length || 0}
              </span>
            </button>
            <button
              id="btn-tab-migration"
              onClick={() => setActiveTab('migration')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'migration' ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
              <span>Bulk Migration</span>
            </button>
            <button
              onClick={() => setActiveTab('directory')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'directory' ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Info className="w-3.5 h-3.5 text-indigo-600" />
              <span>General Info</span>
            </button>
            <button
              onClick={() => setActiveTab('resources')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'resources' ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-600" />
              <span>Resource Allocation</span>
            </button>
            <button
              onClick={() => setActiveTab('branding')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'branding' ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Branding & Config</span>
            </button>
            <button
              onClick={() => setActiveTab('backup')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'backup' ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-indigo-600" />
              <span>Disaster Recovery</span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'analytics' ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-indigo-600" />
              <span>Usage Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab('billing')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'billing' ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
              <span>Billing & Plan</span>
            </button>
            <button
              id="btn-tab-audit-log"
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'audit' ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Audit Log</span>
            </button>
            <button
              id="btn-tab-resource-comparison"
              onClick={() => setActiveTab('comparison')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'comparison' ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
              <span>Resource Comparison</span>
            </button>
            <button
              id="btn-tab-security"
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'security' ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-indigo-600" />
              <span>MFA & Security</span>
            </button>
          </div>

          {/* Sub Workspace Content */}
          <div className="flex-1 py-6 min-h-0">
            {currentTenant ? (
              <>
                {/* Summary Dashboard Tab */}
                {activeTab === 'summary' && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    {/* Active Tenant Counts Section */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Active Tenants Card */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Active Tenants</span>
                          <p className="text-2xl font-black text-slate-900">{tenants.filter(t => t.isActive).length}</p>
                          <span className="text-[10px] text-emerald-600 font-semibold">✓ Cluster Isolated</span>
                        </div>
                        <Users className="w-8 h-8 text-indigo-500/30" />
                      </div>

                      {/* Deactivated Tenants Card */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Suspended/Inactive</span>
                          <p className="text-2xl font-black text-slate-900">{tenants.filter(t => !t.isActive).length}</p>
                          <span className="text-[10px] text-slate-500 font-semibold">Idle Compute Pools</span>
                        </div>
                        <AlertCircle className="w-8 h-8 text-slate-400/30" />
                      </div>

                      {/* Total Provisioned Tenants Card */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Total Subscribed</span>
                          <p className="text-2xl font-black text-slate-900">{tenants.length}</p>
                          <span className="text-[10px] text-indigo-600 font-semibold">Across {new Set(tenants.map(t => t.region)).size} Cloud Regions</span>
                        </div>
                        <Server className="w-8 h-8 text-indigo-500/30" />
                      </div>
                    </div>

                    {/* Subscription Tier Distribution Progress */}
                    <div className="border border-slate-200/60 rounded-xl p-4.5 bg-slate-50/50">
                      <span className="text-xs font-black text-slate-800 uppercase tracking-wide block mb-3.5">Subscription Tier Allocation</span>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {(['Unlimited', 'Partner', 'Enterprise', 'Professional', 'Starter', 'Trial'] as const).map(tier => {
                          const tierCount = tenants.filter(t => t.subscription.tier === tier).length;
                          const pct = tenants.length > 0 ? (tierCount / tenants.length) * 100 : 0;
                          const colorMap = {
                            Enterprise: 'bg-indigo-600 text-indigo-600',
                            Professional: 'bg-emerald-600 text-emerald-600',
                            Standard: 'bg-amber-505 text-amber-500',
                            Free: 'bg-slate-500 text-slate-500'
                          };
                          const badgeColorMap = {
                            Enterprise: 'bg-indigo-50 border-indigo-200 text-indigo-700',
                            Professional: 'bg-emerald-50 border-emerald-200 text-emerald-700',
                            Standard: 'bg-amber-50 border-amber-200 text-amber-700',
                            Free: 'bg-slate-100 border-slate-200 text-slate-700'
                          };
                          return (
                            <div key={tier} className="bg-white p-3 rounded-xl border border-slate-200/60 space-y-1.5 shadow-2xs">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">{tier}</span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold border ${badgeColorMap[tier]}`}>
                                  {tierCount}
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div className={`h-full ${(colorMap[tier] || '').split(' ')[0]}`} style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Storage Usage Per Tenant Section */}
                    <div className="border border-slate-200/60 rounded-xl p-4.5 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="space-y-0.5">
                          <span className="text-xs font-black text-slate-800 uppercase tracking-wide block">Isolated Storage Space Per Tenant</span>
                          <p className="text-[10px] text-slate-500 font-mono">Telemetry polling is refreshed in real time</p>
                        </div>
                        <span className="text-[10px] font-mono text-indigo-600 font-bold bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                          Total Storage: {tenants.reduce((acc, t) => acc + t.resources.storageGb, 0) / 1024} TB Allocated
                        </span>
                      </div>

                      <div className="space-y-3.5">
                        {tenants.map(t => {
                          let consumed = t.resources.storageGb * 0.72; // ~72% full default
                          if (t.id === selectedTenantId) {
                            consumed = usageStats.dbStorageConsumedGb;
                          }
                          const pct = (consumed / t.resources.storageGb) * 100;
                          
                          let barColor = 'bg-indigo-600';
                          if (pct > 90) barColor = 'bg-rose-500';
                          else if (pct > 75) barColor = 'bg-amber-500';
                          else barColor = 'bg-emerald-500';

                          return (
                            <div key={t.id} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1.5">
                                  <span className={`w-2 h-2 rounded-full ${t.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                  <span className="font-bold text-slate-800">{t.name}</span>
                                  <span className="text-[10px] text-slate-400 font-mono">({t.config.subdomain}.edimp.com)</span>
                                </div>
                                <span className="font-mono text-slate-600">
                                  <span className="font-bold text-slate-800">
                                    {consumed >= 1000 ? `${(consumed / 1024).toFixed(1)} TB` : `${consumed.toFixed(0)} GB`}
                                  </span>
                                  {' '}of{' '}
                                  {t.resources.storageGb >= 1000 ? `${(t.resources.storageGb / 1024).toFixed(0)} TB` : `${t.resources.storageGb} GB`}
                                  {' '}({pct.toFixed(1)}%)
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                                <div className={`h-full transition-all duration-300 ${barColor}`} style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Recent Provisioning Activity Section */}
                    <div className="border border-slate-200/60 rounded-xl p-4.5 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-xs font-black text-slate-800 uppercase tracking-wide block">Recent Provisioning & Audit Activity</span>
                        <span className="text-[10px] font-mono text-slate-400">All tenant events fully cataloged</span>
                      </div>

                      <div className="space-y-4">
                        {tenants.map((t, idx) => {
                          return (
                            <div key={`act-${t.id}-${idx}`} className="flex gap-3 text-xs items-start">
                              <div className="mt-0.5 p-1 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-lg">
                                <CheckCircle className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-slate-800">
                                    New Tenant <span className="text-indigo-600 font-black">"{t.name}"</span> Provisioned & Verified
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">{t.createdAt}</span>
                                </div>
                                <p className="text-slate-500 leading-relaxed text-[11px]">
                                  Database schema boundaries <span className="font-mono font-bold text-slate-700">"edimp_schema_{t.id.replace('tenant-', '')}"</span> generated in region <span className="font-bold">{t.region}</span>. Allocated specs: <span className="font-semibold">{t.resources.vCpus} vCPUs</span> / <span className="font-semibold">{t.resources.memoryGb}GB RAM</span> on cluster host <span className="font-mono">{t.config.dbClusterHost}</span>. Primary Admin: <span className="font-semibold">{t.primaryContact}</span> ({t.adminEmail}).
                                </p>
                              </div>
                            </div>
                          );
                        })}

                        <div className="flex gap-3 text-xs items-start border-t border-slate-100 pt-3.5">
                          <div className="mt-0.5 p-1 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-lg">
                            <Database className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-800">Scheduled Disaster Recovery Snapshot Backup</span>
                              <span className="text-[10px] text-slate-400 font-mono">2026-08-05 03:00:00</span>
                            </div>
                            <p className="text-slate-500 leading-relaxed text-[11px]">
                              Completed automated backup task for <span className="font-bold text-slate-700">Globex Industries</span>. Snaps copied to secure secondary object storage cluster in region EU-Central. Archive verification checksum successful: <span className="font-mono text-slate-400">sha256:88a6d2c4...</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-3 text-xs items-start border-t border-slate-100 pt-3.5">
                          <div className="mt-0.5 p-1 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-lg">
                            <CheckCircle className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-800">
                                Tenant <span className="text-indigo-600 font-black">"Globex Industries"</span> Subscription Upgraded
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">2025-04-10 14:15:00</span>
                            </div>
                            <p className="text-slate-500 leading-relaxed text-[11px]">
                              Billing plan auto-transitioned from <span className="font-semibold">Standard</span> to <span className="font-semibold text-emerald-600">Professional tier</span> ($650/mo). API gateway transaction rates elevated to 1000 req/s.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ORGANIZATIONS MANAGEMENT TAB */}
                {activeTab === 'organizations' && (
                  <div className="space-y-6 animate-in fade-in duration-200" id="organizations-tab-container">
                    {/* Upper descriptive guidance block */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3">
                      <Building2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                      <div className="text-xs text-slate-600 space-y-1">
                        <span className="font-bold text-slate-800">Tenant Multi-Organization & Entity Infrastructure Control</span>
                        <p className="leading-relaxed">
                          This management module enables segmented business units, geographic divisions, or subsidiaries (Organizations) within the selected tenant workspace. Each Organization operates its own local ERP database integrations, migration projects, mapped users, network API connectors, and analytical reports. Use this control panel to provision entities, configure ERP endpoints, and manage subsidiary resources.
                        </p>
                      </div>
                    </div>

                    {/* Filter & Add Row */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 border border-slate-200/80 rounded-xl shadow-2xs">
                      <div className="flex flex-1 flex-col sm:flex-row gap-2.5">
                        {/* Search Input */}
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search organizations by name or ERP..."
                            value={orgSearchQuery}
                            onChange={(e) => setOrgSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500/50"
                          />
                        </div>
                        {/* ERP Filter Dropdown */}
                        <div className="w-full sm:w-48">
                          <select
                            value={orgErpFilter}
                            onChange={(e) => setOrgErpFilter(e.target.value)}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500/50"
                          >
                            <option value="All">All ERP Systems</option>
                            <option value="SAP">SAP Systems</option>
                            <option value="Oracle">Oracle Systems</option>
                            <option value="Dynamics">Microsoft Dynamics</option>
                            <option value="NetSuite">NetSuite Systems</option>
                          </select>
                        </div>
                      </div>

                      {/* Organization Action Workflows */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleSyncAllOrgs}
                          disabled={isSyncingAllOrgs}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-all disabled:opacity-50"
                          title="Execute global health ping and schema sync across all subsidiary organizations"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAllOrgs ? 'animate-spin text-indigo-600' : ''}`} />
                          <span>{isSyncingAllOrgs ? 'Syncing...' : 'Batch Sync ERPs'}</span>
                        </button>

                        <button
                          onClick={handleExportOrgManifest}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-all"
                          title="Export JSON schema manifest of tenant organizations"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-500" />
                          <span>Export Manifest</span>
                        </button>

                        <button
                          onClick={handleOpenAddOrg}
                          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-all shadow-xs"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add Organization</span>
                        </button>
                      </div>
                    </div>

                    {/* Batch Sync Progress Indicator Banner */}
                    {isSyncingAllOrgs && (
                      <div className="bg-indigo-900 text-white p-3.5 rounded-xl border border-indigo-700 flex items-center justify-between gap-4 animate-in fade-in duration-150">
                        <div className="flex items-center gap-3">
                          <RefreshCw className="w-4 h-4 animate-spin text-indigo-300 shrink-0" />
                          <div className="space-y-0.5">
                            <span className="font-bold text-xs">Global ERP Schema Synchronization In Progress</span>
                            <p className="text-[10px] text-indigo-200">Pinging network connection endpoints and refreshing metadata caches for registered subsidiaries...</p>
                          </div>
                        </div>
                        <div className="w-32 bg-indigo-950 h-2 rounded-full overflow-hidden shrink-0">
                          <div className="bg-indigo-400 h-full transition-all duration-200" style={{ width: `${syncAllProgress}%` }} />
                        </div>
                      </div>
                    )}

                    {/* Directory List of Orgs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {(() => {
                        const tenantId = selectedTenantId || 'tenant-acme';
                        const orgsList = organizationsMap[tenantId] || [];
                        
                        // Apply filters
                        const filteredOrgs = orgsList.filter(o => {
                          const matchesSearch = o.name.toLowerCase().includes(orgSearchQuery.toLowerCase()) || 
                                                o.erp.toLowerCase().includes(orgSearchQuery.toLowerCase());
                          
                          let matchesErp = true;
                          if (orgErpFilter !== 'All') {
                            matchesErp = o.erp.toLowerCase().includes(orgErpFilter.toLowerCase());
                          }
                          
                          return matchesSearch && matchesErp;
                        });

                        if (filteredOrgs.length === 0) {
                          return (
                            <div className="col-span-full bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
                              <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
                              <div className="space-y-1">
                                <p className="text-xs font-bold text-slate-700">No subsidiary organizations registered</p>
                                <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                                  There are no subsidiary entities defined for this tenant matching the search/filter criteria. Click "Add Organization" to instantiate a new division.
                                </p>
                              </div>
                            </div>
                          );
                        }

                        return filteredOrgs.map((org) => {
                          const isSelected = selectedOrgId === org.id;
                          return (
                            <div
                              key={org.id}
                              className={`bg-white border rounded-2xl transition-all overflow-hidden flex flex-col justify-between ${
                                isSelected 
                                  ? 'border-indigo-500 ring-2 ring-indigo-500/10 shadow-xs' 
                                  : 'border-slate-200/80 hover:border-slate-300 hover:shadow-xs'
                              }`}
                            >
                              {/* Card Header */}
                              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-start justify-between">
                                <div className="space-y-1">
                                  <h4 className="text-xs font-black text-slate-800 tracking-tight leading-tight">{org.name}</h4>
                                  <span className="text-[10px] font-mono text-slate-400">ID: {org.id}</span>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${
                                  org.erpStatus === 'Synced' || org.erpStatus === 'Active'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : org.erpStatus === 'Error'
                                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                                      : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>
                                  ● {org.erpStatus}
                                </span>
                              </div>

                              {/* Card Stats */}
                              <div className="p-4 space-y-2 text-xs">
                                <div className="flex items-center justify-between text-[11px] text-slate-500 pb-1.5 border-b border-slate-100">
                                  <span>ERP Ledger:</span>
                                  <span className="font-bold text-slate-800 font-mono max-w-[140px] truncate" title={org.erp}>{org.erp}</span>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2 text-[10px]">
                                  <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100/60 flex items-center gap-1.5">
                                    <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                                    <div>
                                      <span className="block text-slate-400 font-bold uppercase text-[8px]">Projects</span>
                                      <span className="font-mono font-black text-slate-800">{org.projects.length} Active</span>
                                    </div>
                                  </div>
                                  
                                  <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100/60 flex items-center gap-1.5">
                                    <Users className="w-3.5 h-3.5 text-indigo-500" />
                                    <div>
                                      <span className="block text-slate-400 font-bold uppercase text-[8px]">Users</span>
                                      <span className="font-mono font-black text-slate-800">{org.users.length} Mapped</span>
                                    </div>
                                  </div>

                                  <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100/60 flex items-center gap-1.5">
                                    <Plug className="w-3.5 h-3.5 text-indigo-500" />
                                    <div>
                                      <span className="block text-slate-400 font-bold uppercase text-[8px]">Connectors</span>
                                      <span className="font-mono font-black text-slate-800">{org.connectors.length} Nodes</span>
                                    </div>
                                  </div>

                                  <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100/60 flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5 text-indigo-500" />
                                    <div>
                                      <span className="block text-slate-400 font-bold uppercase text-[8px]">Reports</span>
                                      <span className="font-mono font-black text-slate-800">{org.reports.length} Logs</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Card Actions */}
                              <div className="p-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between gap-1.5">
                                <button
                                  onClick={() => {
                                    setSelectedOrgId(org.id);
                                    setActiveOrgSubTab('dashboard');
                                  }}
                                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                                    isSelected 
                                      ? 'bg-indigo-600 text-white shadow-xs' 
                                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                                  }`}
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Configure Details</span>
                                </button>
                                
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleOpenCloneModal(org)}
                                    className="p-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-800 rounded-lg cursor-pointer"
                                    title="Clone / Duplicate Organization Configuration"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleOpenEditOrg(org)}
                                    className="p-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-800 rounded-lg cursor-pointer"
                                    title="Edit ERP Host Parameters"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteOrg(org.id)}
                                    className="p-1.5 bg-white border border-rose-200 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded-lg cursor-pointer"
                                    title="Prune Subsidiary Entity"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>

                    {/* DYNAMIC ORGANIZATION DETAIL SUB-CONSOLE */}
                    {(() => {
                      const tenantId = selectedTenantId || 'tenant-acme';
                      const activeOrg = (organizationsMap[tenantId] || []).find(o => o.id === selectedOrgId);
                      if (!activeOrg) return null;

                      return (
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-in slide-in-from-bottom-3 duration-200 mt-6">
                          {/* Inner Header */}
                          <div className="bg-slate-900 text-white p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-indigo-400" />
                                <h3 className="font-black text-sm tracking-tight">{activeOrg.name} Dashboard</h3>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                                  activeOrg.erpStatus === 'Synced' || activeOrg.erpStatus === 'Active'
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : 'bg-rose-500/20 text-rose-300'
                                }`}>
                                  {activeOrg.erpStatus}
                                </span>
                              </div>
                              <p className="text-slate-400 text-xs font-mono">
                                Registered Entity: {activeOrg.id} • Date Mapped: {activeOrg.createdAt}
                              </p>
                            </div>

                            {/* Inner Sub-tab navigation */}
                            <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs font-bold text-slate-400 overflow-x-auto">
                              <button
                                onClick={() => setActiveOrgSubTab('dashboard')}
                                className={`px-3 py-1 rounded-md cursor-pointer transition-all flex items-center gap-1.5 ${
                                  activeOrgSubTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'hover:text-white'
                                }`}
                              >
                                <LayoutDashboard className="w-3.5 h-3.5" />
                                <span>Dashboard</span>
                              </button>
                              <button
                                onClick={() => setActiveOrgSubTab('erp')}
                                className={`px-3 py-1 rounded-md cursor-pointer transition-all ${
                                  activeOrgSubTab === 'erp' ? 'bg-indigo-600 text-white' : 'hover:text-white'
                                }`}
                              >
                                ERP Config
                              </button>
                              <button
                                onClick={() => setActiveOrgSubTab('projects')}
                                className={`px-3 py-1 rounded-md cursor-pointer transition-all flex items-center gap-1 ${
                                  activeOrgSubTab === 'projects' ? 'bg-indigo-600 text-white' : 'hover:text-white'
                                }`}
                              >
                                Projects
                                <span className="px-1 py-0.2 bg-slate-700 text-slate-300 rounded text-[9px] font-mono">
                                  {activeOrg.projects.length}
                                </span>
                              </button>
                              <button
                                onClick={() => setActiveOrgSubTab('users')}
                                className={`px-3 py-1 rounded-md cursor-pointer transition-all flex items-center gap-1 ${
                                  activeOrgSubTab === 'users' ? 'bg-indigo-600 text-white' : 'hover:text-white'
                                }`}
                              >
                                Users
                                <span className="px-1 py-0.2 bg-slate-700 text-slate-300 rounded text-[9px] font-mono">
                                  {activeOrg.users.length}
                                </span>
                              </button>
                              <button
                                onClick={() => setActiveOrgSubTab('connectors')}
                                className={`px-3 py-1 rounded-md cursor-pointer transition-all flex items-center gap-1 ${
                                  activeOrgSubTab === 'connectors' ? 'bg-indigo-600 text-white' : 'hover:text-white'
                                }`}
                              >
                                Connectors
                                <span className="px-1 py-0.2 bg-slate-700 text-slate-300 rounded text-[9px] font-mono">
                                  {activeOrg.connectors.length}
                                </span>
                              </button>
                              <button
                                onClick={() => setActiveOrgSubTab('reports')}
                                className={`px-3 py-1 rounded-md cursor-pointer transition-all flex items-center gap-1 ${
                                  activeOrgSubTab === 'reports' ? 'bg-indigo-600 text-white' : 'hover:text-white'
                                }`}
                              >
                                Reports
                                <span className="px-1 py-0.2 bg-slate-700 text-slate-300 rounded text-[9px] font-mono">
                                  {activeOrg.reports.length}
                                </span>
                              </button>
                            </div>
                          </div>

                          {/* Inner Content panels */}
                          <div className="p-6">
                            {/* SUB-TAB 0: ORGANIZATION DASHBOARD */}
                            {activeOrgSubTab === 'dashboard' && (
                              <div className="space-y-6 text-xs animate-in fade-in duration-200">
                                {/* Top Statistics Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                  {/* Metric 1: Total Records Synced */}
                                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 flex flex-col justify-between hover:shadow-xs transition-all">
                                    <div className="flex items-center justify-between">
                                      <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Total Records Synced</span>
                                      <div className="p-2 bg-indigo-500/10 text-indigo-700 rounded-lg border border-indigo-500/20">
                                        <Database className="w-4 h-4" />
                                      </div>
                                    </div>
                                    <div className="mt-3.5 space-y-1">
                                      <div className="text-2xl font-black text-slate-800 tracking-tight font-mono">
                                        {(activeOrg.projects.reduce((acc, p) => acc + (p.progress * 12350), 340000) + activeOrg.connectors.length * 85000).toLocaleString()}
                                      </div>
                                      <div className="flex items-center gap-1.5 text-[10px]">
                                        <span className="text-emerald-600 font-bold flex items-center">
                                          <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                                          +14.2%
                                        </span>
                                        <span className="text-slate-400">vs last 7 days</span>
                                      </div>
                                    </div>
                                    <div className="mt-4 pt-3.5 border-t border-slate-200/50 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                                      <span>Avg Throughput:</span>
                                      <span className="font-bold text-slate-800">
                                        {activeOrg.connectors.length > 0 ? `${activeOrg.connectors.length * 280} rec/sec` : '0 rec/sec'}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Metric 2: Active Jobs / Migration Projects */}
                                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 flex flex-col justify-between hover:shadow-xs transition-all">
                                    <div className="flex items-center justify-between">
                                      <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Migration Jobs</span>
                                      <div className="p-2 bg-emerald-500/10 text-emerald-700 rounded-lg border border-emerald-500/20">
                                        <Briefcase className="w-4 h-4" />
                                      </div>
                                    </div>
                                    <div className="mt-3.5 space-y-1">
                                      <div className="text-2xl font-black text-slate-800 tracking-tight font-mono flex items-baseline gap-2">
                                        <span>{activeOrg.projects.filter(p => p.status === 'In Progress').length}</span>
                                        <span className="text-xs text-slate-400 font-normal">Active / {activeOrg.projects.length} Total</span>
                                      </div>
                                      <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                                        <div 
                                          className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                                          style={{ 
                                            width: `${activeOrg.projects.length > 0 
                                              ? Math.round(activeOrg.projects.reduce((sum, p) => sum + p.progress, 0) / activeOrg.projects.length) 
                                              : 0}%` 
                                          }} 
                                        />
                                      </div>
                                    </div>
                                    <div className="mt-4 pt-3.5 border-t border-slate-200/50 flex items-center justify-between text-[11px] text-slate-500">
                                      <span className="font-mono">Mean Completion:</span>
                                      <span className="font-mono font-bold text-slate-800">
                                        {activeOrg.projects.length > 0 
                                          ? `${Math.round(activeOrg.projects.reduce((sum, p) => sum + p.progress, 0) / activeOrg.projects.length)}%` 
                                          : '0%'}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Metric 3: Connection Status */}
                                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 flex flex-col justify-between hover:shadow-xs transition-all">
                                    <div className="flex items-center justify-between">
                                      <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">VPC Link Health</span>
                                      <div className={`p-2 rounded-lg border ${
                                        activeOrg.erpStatus === 'Synced' || activeOrg.erpStatus === 'Active'
                                          ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
                                          : 'bg-rose-500/10 text-rose-700 border-rose-500/20'
                                      }`}>
                                        <Activity className="w-4 h-4" />
                                      </div>
                                    </div>
                                    <div className="mt-3.5 space-y-1.5">
                                      <div className="flex items-center gap-1.5">
                                        <span className="relative flex h-2 w-2">
                                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                                            activeOrg.erpStatus === 'Synced' || activeOrg.erpStatus === 'Active' ? 'bg-emerald-400' : 'bg-rose-400'
                                          }`} />
                                          <span className={`relative inline-flex rounded-full h-2 w-2 ${
                                            activeOrg.erpStatus === 'Synced' || activeOrg.erpStatus === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'
                                          }`} />
                                        </span>
                                        <span className="text-sm font-black text-slate-800 uppercase tracking-tight font-mono">{activeOrg.erpStatus}</span>
                                      </div>
                                      <span className="text-[10px] text-slate-400 font-mono truncate block" title={activeOrg.erpHost}>{activeOrg.erpHost}</span>
                                    </div>
                                    <div className="mt-4 pt-2.5 border-t border-slate-200/50 flex items-center justify-between gap-1">
                                      <button
                                        onClick={handleTestConnection}
                                        disabled={isTestingConnection}
                                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer disabled:opacity-50 flex items-center gap-1 font-mono uppercase"
                                      >
                                        {isTestingConnection ? 'Testing...' : 'Verify Link'}
                                      </button>
                                      {testResult && (
                                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                                          testResult === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                                        }`}>
                                          {testResult === 'success' ? 'SUCCESS' : 'FAILED'}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Graph & Detailed Stats Row */}
                                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                                  {/* Sync Volume Chart */}
                                  <div className="xl:col-span-2 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                                    <div className="flex items-center justify-between">
                                      <div className="space-y-0.5">
                                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Sync Volume Velocity (7-Day Period)</h4>
                                        <p className="text-[10px] text-slate-400">Chronological analysis of records written to global tenant schema nodes</p>
                                      </div>
                                      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1 text-[10px] font-mono text-slate-500">
                                        <span className="px-2 py-0.5 bg-white text-slate-800 rounded font-bold shadow-2xs">Weekly</span>
                                        <span className="px-2 py-0.5">Monthly</span>
                                      </div>
                                    </div>

                                    {/* Responsive Container with Recharts LineChart */}
                                    <div className="h-56 w-full text-slate-700">
                                      <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart
                                          data={[
                                            { name: 'Mon', records: 120000, latency: 45 },
                                            { name: 'Tue', records: 185000, latency: 38 },
                                            { name: 'Wed', records: 150000, latency: 42 },
                                            { name: 'Thu', records: 290000, latency: 35 },
                                            { name: 'Fri', records: 240000, latency: 40 },
                                            { name: 'Sat', records: 340000, latency: 32 },
                                            { name: 'Sun', records: 410000, latency: 30 }
                                          ]}
                                          margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                                        >
                                          <defs>
                                            <linearGradient id="colorRecords" x1="0" y1="0" x2="0" y2="1">
                                              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                                              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                            </linearGradient>
                                          </defs>
                                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                          <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                                          <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                                          <Tooltip 
                                            contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#f8fafc', fontSize: '11px', border: 'none' }}
                                            labelFormatter={(label) => `Day: ${label}`}
                                          />
                                          <Area type="monotone" dataKey="records" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorRecords)" name="Records Written" />
                                        </AreaChart>
                                      </ResponsiveContainer>
                                    </div>
                                  </div>

                                  {/* Breakdown Card */}
                                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                                    <div className="space-y-0.5 pb-2.5 border-b border-slate-200">
                                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Active Project Matrix</h4>
                                      <p className="text-[10px] text-slate-400">Progression rates for current ledger migrations</p>
                                    </div>

                                    <div className="space-y-3">
                                      {activeOrg.projects.length === 0 ? (
                                        <div className="text-center py-6 text-slate-400 text-[11px]">No projects initialized for this subsidiary.</div>
                                      ) : (
                                        activeOrg.projects.map((proj) => (
                                          <div key={proj.id} className="space-y-1 bg-white p-2.5 rounded-lg border border-slate-200/60 shadow-2xs">
                                            <div className="flex items-center justify-between text-[11px]">
                                              <span className="font-bold text-slate-700 truncate max-w-[150px]">{proj.name}</span>
                                              <span className={`px-1.5 py-0.2 rounded text-[8px] font-mono font-bold ${
                                                proj.status === 'Completed'
                                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                  : proj.status === 'Delayed'
                                                    ? 'bg-rose-50 text-rose-700 border border-rose-100'
                                                    : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                              }`}>
                                                {proj.status}
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <div className="flex-1 bg-slate-100 h-1 rounded-full overflow-hidden">
                                                <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${proj.progress}%` }} />
                                              </div>
                                              <span className="font-mono text-[9px] text-slate-500 font-bold">{proj.progress}%</span>
                                            </div>
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* SUB-TAB 1: ERP CONFIG */}
                            {activeOrgSubTab === 'erp' && (
                              <div className="space-y-4 text-xs animate-in fade-in duration-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  {/* Host Parameters info */}
                                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4.5 space-y-3.5">
                                    <div className="flex items-center gap-2 text-slate-700 font-bold text-xs pb-2 border-b border-slate-200/60">
                                      <Server className="w-4 h-4 text-indigo-500" />
                                      <span>Database Connector Credentials</span>
                                    </div>
                                    <div className="space-y-2 font-mono text-[11px]">
                                      <div className="flex justify-between py-1 border-b border-slate-100">
                                        <span className="text-slate-400">Ledger Engine:</span>
                                        <span className="font-bold text-slate-800">{activeOrg.erp}</span>
                                      </div>
                                      <div className="flex justify-between py-1 border-b border-slate-100">
                                        <span className="text-slate-400">Endpoint URL:</span>
                                        <span className="font-bold text-indigo-600 select-all">{activeOrg.erpHost}</span>
                                      </div>
                                      <div className="flex justify-between py-1 border-b border-slate-100">
                                        <span className="text-slate-400">Credentials Type:</span>
                                        <span className="font-semibold text-slate-700">AES-256 Encrypted Profile</span>
                                      </div>
                                      <div className="flex justify-between py-1">
                                        <span className="text-slate-400">Isolation Layer:</span>
                                        <span className="text-emerald-600 font-bold">✓ Cluster Tenant Isolated</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Connection Health & Simulation Testing */}
                                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4.5 flex flex-col justify-between gap-4">
                                    <div className="space-y-1.5">
                                      <div className="flex items-center justify-between text-slate-700 font-bold text-xs">
                                        <div className="flex items-center gap-2">
                                          <Activity className="w-4 h-4 text-indigo-500" />
                                          <span>Connection Diagnostic Sandbox</span>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setIsSchemaModalOpen(true);
                                            handleStartSchemaScan();
                                          }}
                                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-md flex items-center gap-1 cursor-pointer text-[10px]"
                                        >
                                          <SearchCode className="w-3 h-3 text-indigo-400" />
                                          <span>Schema Discovery</span>
                                        </button>
                                      </div>
                                      <p className="text-[11px] text-slate-500 leading-relaxed">
                                        Initiate a manual secure handshake test to verify firewall permissions, endpoint accessibility, and encrypted token validity with the subsidiary ERP core database.
                                      </p>
                                    </div>

                                    {/* Action row with status feedback */}
                                    <div className="flex items-center justify-between gap-4 pt-3 border-t border-slate-200/60">
                                      <button
                                        disabled={isTestingConnection}
                                        onClick={handleTestConnection}
                                        className={`px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50 text-[11px] ${
                                          isTestingConnection ? 'animate-pulse' : ''
                                        }`}
                                      >
                                        {isTestingConnection ? (
                                          <>
                                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                            <span>Pinging Server...</span>
                                          </>
                                        ) : (
                                          <>
                                            <Play className="w-3.5 h-3.5" />
                                            <span>Test Connection</span>
                                          </>
                                        )}
                                      </button>

                                      {testResult && (
                                        <div className={`p-2 rounded-lg flex items-center gap-1.5 text-[11px] font-bold border animate-in zoom-in-95 ${
                                          testResult === 'success'
                                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                            : 'bg-rose-50 border-rose-200 text-rose-700'
                                        }`}>
                                          {testResult === 'success' ? (
                                            <>
                                              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                                              <span>Handshake Success (Ping: 42ms)</span>
                                            </>
                                          ) : (
                                            <>
                                              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                              <span>Endpoint Timed Out</span>
                                            </>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* SUB-TAB 2: PROJECTS */}
                            {activeOrgSubTab === 'projects' && (
                              <div className="space-y-4 text-xs animate-in fade-in duration-200">
                                {/* Inline creation bar */}
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                                  <span className="font-bold text-slate-700">Add Migration Project</span>
                                  <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
                                    <input
                                      type="text"
                                      placeholder="e.g. Q3 Finance Consolidation"
                                      value={newProjName}
                                      onChange={(e) => setNewProjName(e.target.value)}
                                      className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500/50"
                                    />
                                    <select
                                      value={newProjStatus}
                                      onChange={(e) => setNewProjStatus(e.target.value as any)}
                                      className="p-2 bg-white border border-slate-200 rounded-lg text-xs cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500/50"
                                    >
                                      <option value="In Progress">In Progress</option>
                                      <option value="Completed">Completed</option>
                                      <option value="Delayed">Delayed</option>
                                      <option value="Planned">Planned</option>
                                    </select>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[11px] text-slate-400 font-bold whitespace-nowrap">Progress:</span>
                                      <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={newProjProgress}
                                        onChange={(e) => setNewProjProgress(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                                        className="w-16 p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono outline-none focus:ring-2 focus:ring-indigo-500/50"
                                      />
                                      <span className="text-[11px] font-bold">%</span>
                                    </div>
                                    <button
                                      onClick={handleAddProject}
                                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                      <span>Register Project</span>
                                    </button>
                                  </div>
                                </div>

                                {/* Projects List table */}
                                <div className="border border-slate-200 rounded-xl overflow-hidden">
                                  <table className="w-full text-left border-collapse">
                                    <thead>
                                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold text-[10px] uppercase font-mono">
                                        <th className="p-3">Project Title</th>
                                        <th className="p-3">Migration Progress</th>
                                        <th className="p-3">Connection State</th>
                                        <th className="p-3">Last Schema Sync</th>
                                        <th className="p-3 text-right">Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700">
                                      {activeOrg.projects.length === 0 ? (
                                        <tr>
                                          <td colSpan={5} className="p-6 text-center text-slate-400 text-[11px]">No active projects mapped. Create one above!</td>
                                        </tr>
                                      ) : (
                                        activeOrg.projects.map(proj => (
                                          <tr key={proj.id} className="hover:bg-slate-50/50">
                                            <td className="p-3 font-bold text-slate-800">{proj.name}</td>
                                            <td className="p-3">
                                              <div className="flex items-center gap-2 w-36">
                                                <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                                  <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${proj.progress}%` }} />
                                                </div>
                                                <span className="font-mono text-[10px] text-slate-500 font-bold">{proj.progress}%</span>
                                              </div>
                                            </td>
                                            <td className="p-3">
                                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                proj.status === 'Completed'
                                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                  : proj.status === 'Delayed'
                                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                    : proj.status === 'Planned'
                                                      ? 'bg-slate-100 text-slate-600 border border-slate-200'
                                                      : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                              }`}>
                                                {proj.status}
                                              </span>
                                            </td>
                                            <td className="p-3 font-mono text-slate-500 text-[10px]">{proj.lastSync}</td>
                                            <td className="p-3 text-right">
                                              <button
                                                onClick={() => handleDeleteProject(proj.id)}
                                                className="p-1 hover:bg-rose-50 rounded text-rose-500 hover:text-rose-700 cursor-pointer"
                                                title="Delete Project"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            </td>
                                          </tr>
                                        ))
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {/* SUB-TAB 3: USERS */}
                            {activeOrgSubTab === 'users' && (
                              <div className="space-y-4 text-xs animate-in fade-in duration-200">
                                {/* Inline creation bar */}
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                                  <span className="font-bold text-slate-700">Map Subsidiary User</span>
                                  <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
                                    <input
                                      type="text"
                                      placeholder="Full Name"
                                      value={newUsrName}
                                      onChange={(e) => setNewUsrName(e.target.value)}
                                      className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500/50"
                                    />
                                    <input
                                      type="email"
                                      placeholder="Email Address"
                                      value={newUsrEmail}
                                      onChange={(e) => setNewUsrEmail(e.target.value)}
                                      className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500/50"
                                    />
                                    <select
                                      value={newUsrRole}
                                      onChange={(e) => setNewUsrRole(e.target.value)}
                                      className="p-2 bg-white border border-slate-200 rounded-lg text-xs cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500/50"
                                    >
                                      <option value="Data Engineer">Data Engineer</option>
                                      <option value="Org Admin">Org Admin</option>
                                      <option value="Compliance Officer">Compliance Officer</option>
                                      <option value="Guest Auditor">Guest Auditor</option>
                                    </select>
                                    <button
                                      onClick={handleAddUser}
                                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                      <span>Map User Account</span>
                                    </button>
                                  </div>
                                </div>

                                {/* Users List Table */}
                                <div className="border border-slate-200 rounded-xl overflow-hidden">
                                  <table className="w-full text-left border-collapse">
                                    <thead>
                                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold text-[10px] uppercase font-mono">
                                        <th className="p-3">User</th>
                                        <th className="p-3">Email Address</th>
                                        <th className="p-3">Assigned Role</th>
                                        <th className="p-3">MFA Status</th>
                                        <th className="p-3 text-right">Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700">
                                      {activeOrg.users.length === 0 ? (
                                        <tr>
                                          <td colSpan={5} className="p-6 text-center text-slate-400 text-[11px]">No users mapped to this division.</td>
                                        </tr>
                                      ) : (
                                        activeOrg.users.map(usr => (
                                          <tr key={usr.id} className="hover:bg-slate-50/50">
                                            <td className="p-3 font-bold text-slate-800 flex items-center gap-2">
                                              <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-mono text-slate-600 font-black border border-slate-200">
                                                {usr.name.split(' ').map(n=>n[0]).join('')}
                                              </div>
                                              <span>{usr.name}</span>
                                            </td>
                                            <td className="p-3 text-slate-500 font-mono select-all text-[11px]">{usr.email}</td>
                                            <td className="p-3">
                                              <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200/80 rounded-md text-[10px] font-medium font-mono text-slate-700">
                                                {usr.role}
                                              </span>
                                            </td>
                                            <td className="p-3">
                                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                usr.status === 'Active'
                                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                  : 'bg-slate-100 text-slate-500 border border-slate-200'
                                              }`}>
                                                {usr.status === 'Active' ? 'Active ✓' : 'Inactive'}
                                              </span>
                                            </td>
                                            <td className="p-3 text-right">
                                              <button
                                                onClick={() => handleDeleteUser(usr.id)}
                                                className="p-1 hover:bg-rose-50 rounded text-rose-500 hover:text-rose-700 cursor-pointer"
                                                title="Delete User"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            </td>
                                          </tr>
                                        ))
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {/* SUB-TAB 4: CONNECTORS */}
                            {activeOrgSubTab === 'connectors' && (
                              <div className="space-y-4 text-xs animate-in fade-in duration-200">
                                {/* Inline creation bar */}
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                                  <span className="font-bold text-slate-700">Register API Connector Node</span>
                                  <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
                                    <input
                                      type="text"
                                      placeholder="Connector Name (e.g. AWS Redshift Warehouse)"
                                      value={newConnName}
                                      onChange={(e) => setNewConnName(e.target.value)}
                                      className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500/50"
                                    />
                                    <select
                                      value={newConnType}
                                      onChange={(e) => setNewConnType(e.target.value)}
                                      className="p-2 bg-white border border-slate-200 rounded-lg text-xs cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500/50"
                                    >
                                      <option value="REST API Endpoint">REST API Endpoint</option>
                                      <option value="S3 Bucket Target">S3 Bucket Target</option>
                                      <option value="Snowflake Loader">Snowflake Loader</option>
                                      <option value="Kafka Message Broker">Kafka Message Broker</option>
                                      <option value="Local Database Hook">Local Database Hook</option>
                                    </select>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[11px] text-slate-400 font-bold whitespace-nowrap">Throughput:</span>
                                      <input
                                        type="text"
                                        placeholder="e.g. 500 records/sec"
                                        value={newConnThroughput}
                                        onChange={(e) => setNewConnThroughput(e.target.value)}
                                        className="w-40 p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500/50"
                                      />
                                    </div>
                                    <button
                                      onClick={handleAddConnector}
                                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                      <span>Register Node</span>
                                    </button>
                                  </div>
                                </div>

                                {/* Connectors list Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {activeOrg.connectors.length === 0 ? (
                                    <div className="col-span-full p-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs">No active connectors defined.</div>
                                  ) : (
                                    activeOrg.connectors.map(conn => (
                                      <div key={conn.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start justify-between gap-3 relative overflow-hidden">
                                        <div className="space-y-1">
                                          <div className="flex items-center gap-1.5">
                                            <span className={`w-2 h-2 rounded-full ${
                                              conn.status === 'Healthy'
                                                ? 'bg-emerald-500'
                                                : conn.status === 'Warning'
                                                  ? 'bg-amber-500'
                                                  : 'bg-rose-500'
                                            }`} />
                                            <span className="font-bold text-slate-800 text-[11px]">{conn.name}</span>
                                          </div>
                                          <span className="text-[10px] text-slate-400 block font-mono">Type: {conn.type}</span>
                                          <span className="text-[10px] text-indigo-600 block font-mono font-bold">Flow Rate: {conn.throughput}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <button
                                            type="button"
                                            onClick={() => handleRunDiagnostic(conn)}
                                            className="p-1 hover:bg-indigo-50 text-indigo-600 rounded cursor-pointer"
                                            title="Run Diagnostic Test Bench"
                                          >
                                            <Activity className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteConnector(conn.id)}
                                            className="p-1 hover:bg-rose-50 text-rose-500 rounded cursor-pointer"
                                            title="Remove Connector"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            )}

                            {/* SUB-TAB 5: REPORTS */}
                            {activeOrgSubTab === 'reports' && (
                              <div className="space-y-4 text-xs animate-in fade-in duration-200">
                                {/* Inline creation bar */}
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                                  <span className="font-bold text-slate-700">Compile Analytical Division Audit</span>
                                  <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
                                    <input
                                      type="text"
                                      placeholder="e.g. Q3 Tax Ledger Alignment Report"
                                      value={newRepTitle}
                                      onChange={(e) => setNewRepTitle(e.target.value)}
                                      className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500/50"
                                    />
                                    <select
                                      value={newRepType}
                                      onChange={(e) => setNewRepType(e.target.value as any)}
                                      className="p-2 bg-white border border-slate-200 rounded-lg text-xs cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500/50"
                                    >
                                      <option value="Financial Audit">Financial Audit</option>
                                      <option value="Compliance Log">Compliance Log</option>
                                      <option value="Operational Analytics">Operational Analytics</option>
                                      <option value="System Health">System Health</option>
                                    </select>
                                    <button
                                      disabled={isGeneratingReport}
                                      onClick={handleGenerateReport}
                                      className={`px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 ${
                                        isGeneratingReport ? 'animate-pulse' : ''
                                      }`}
                                    >
                                      {isGeneratingReport ? (
                                        <>
                                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                          <span>Compiling...</span>
                                        </>
                                      ) : (
                                        <>
                                          <Sparkles className="w-3.5 h-3.5" />
                                          <span>Generate Report</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>

                                {/* Reports List table */}
                                <div className="border border-slate-200 rounded-xl overflow-hidden">
                                  <table className="w-full text-left border-collapse">
                                    <thead>
                                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold text-[10px] uppercase font-mono">
                                        <th className="p-3">Report Title</th>
                                        <th className="p-3">Classification Type</th>
                                        <th className="p-3">Generated At</th>
                                        <th className="p-3">File Size</th>
                                        <th className="p-3 text-right">Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700">
                                      {activeOrg.reports.length === 0 ? (
                                        <tr>
                                          <td colSpan={5} className="p-6 text-center text-slate-400 text-[11px]">No compiled analytics report sheets available.</td>
                                        </tr>
                                      ) : (
                                        activeOrg.reports.map(rep => (
                                          <tr key={rep.id} className="hover:bg-slate-50/50">
                                            <td className="p-3 font-bold text-slate-800">{rep.title}</td>
                                            <td className="p-3 font-mono">
                                              <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200/80 text-slate-700 rounded text-[10px] font-bold">
                                                {rep.type}
                                              </span>
                                            </td>
                                            <td className="p-3 text-slate-500 font-mono text-[10px]">{rep.generatedAt}</td>
                                            <td className="p-3 font-mono font-semibold text-slate-500">{rep.size}</td>
                                            <td className="p-3 text-right flex items-center justify-end gap-1.5">
                                              <button
                                                onClick={() => {
                                                  alert(`Triggered download request for subsidiary report PDF: ${rep.title} (${rep.size})`);
                                                }}
                                                className="p-1 hover:bg-indigo-50 rounded text-indigo-500 hover:text-indigo-700 cursor-pointer"
                                                title="Download PDF"
                                              >
                                                <Download className="w-3.5 h-3.5" />
                                              </button>
                                              <button
                                                onClick={() => handleDeleteReport(rep.id)}
                                                className="p-1 hover:bg-rose-50 rounded text-rose-500 hover:text-rose-700 cursor-pointer"
                                                title="Delete Report"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            </td>
                                          </tr>
                                        ))
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* 1. GENERAL DIRECTORY INFO TAB */}
                {activeTab === 'directory' && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block mb-2">Primary Administration Contact</span>
                        <div className="space-y-1 text-xs">
                          <p className="font-bold text-slate-800">{currentTenant.primaryContact}</p>
                          <p className="text-slate-500">{currentTenant.adminEmail}</p>
                          <p className="text-[10px] text-slate-400 mt-2 font-mono">Created Date: {currentTenant.createdAt}</p>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block mb-2">Partner & Management Group</span>
                        <div className="space-y-1 text-xs">
                          <p className="font-bold text-slate-800">{currentTenant.partnerName}</p>
                          <p className="text-slate-500">ID: {currentTenant.partnerId}</p>
                          <p className="text-[10px] text-indigo-600 mt-2 font-mono font-bold">✓ Direct SLA Assured Isolation</p>
                        </div>
                      </div>
                    </div>

                    <div className="border border-slate-200/60 rounded-xl overflow-hidden shadow-2xs">
                      <div className="bg-slate-50 p-3.5 border-b border-slate-200/80 flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-800 uppercase tracking-wide">Infrastructure Node Map</span>
                        <span className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">ONLINE</span>
                      </div>
                      <div className="p-4 space-y-3.5 text-xs">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                          <span className="text-slate-500">Isolated Tenant Host Domain:</span>
                          <span className="font-mono font-bold text-slate-800">{currentTenant.config.subdomain}.edimp.com</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                          <span className="text-slate-500">PostgreSQL Schema Boundary:</span>
                          <span className="font-mono font-bold text-indigo-600">edimp_schema_{currentTenant.id.replace('tenant-', '')}</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                          <span className="text-slate-500">Dedicated DB Cluster Host:</span>
                          <span className="font-mono text-slate-700">{currentTenant.config.dbClusterHost}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Access Key Scope:</span>
                          <span className="font-mono text-slate-400">••••••••••••••••••••••••3a81x</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-indigo-50 border border-indigo-100 p-4.5 rounded-xl flex items-start gap-3">
                      <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                      <div className="text-xs text-indigo-900 space-y-1">
                        <span className="font-bold">Encryption & Privacy Compliance Guard</span>
                        <p className="text-indigo-700">
                          This tenant organization conforms fully to SOC2 Type II audits. Storage, backups, and staging caches are dynamically encrypted at-rest using client-managed keys (CMK) via Envelope Encryption.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. RESOURCE ALLOCATION TAB */}
                {activeTab === 'resources' && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-500">
                      <Sliders className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                      <span>
                        Drag the limits below to dynamically configure container sizes and API throttling quotas. Custom limits are live-reconfigured on standard virtual node clusters within 2 minutes.
                      </span>
                    </div>

                    <div className="space-y-5">
                      {/* 1. CPU Slider */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label htmlFor="cpu-limit-slider" className="text-xs font-bold text-slate-700">Allocated CPU Limits (vCPUs)</label>
                          <span className="font-mono font-black text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded">
                            {currentTenant.resources.vCpus} vCPUs
                          </span>
                        </div>
                        <input
                          id="cpu-limit-slider"
                          type="range"
                          min="2"
                          max="64"
                          step="2"
                          value={currentTenant.resources.vCpus}
                          onChange={(e) => handleUpdateResources({ vCpus: parseInt(e.target.value) })}
                          className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                          <span>Min: 2 vCPUs</span>
                          <span>Max: 64 vCPUs</span>
                        </div>
                      </div>

                      {/* 2. RAM Slider */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label htmlFor="ram-limit-slider" className="text-xs font-bold text-slate-700">Memory Node Size (RAM GB)</label>
                          <span className="font-mono font-black text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded">
                            {currentTenant.resources.memoryGb} GB RAM
                          </span>
                        </div>
                        <input
                          id="ram-limit-slider"
                          type="range"
                          min="4"
                          max="256"
                          step="4"
                          value={currentTenant.resources.memoryGb}
                          onChange={(e) => handleUpdateResources({ memoryGb: parseInt(e.target.value) })}
                          className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                          <span>Min: 4 GB</span>
                          <span>Max: 256 GB</span>
                        </div>
                      </div>

                      {/* 3. Storage Slider */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label htmlFor="storage-limit-slider" className="text-xs font-bold text-slate-700">Dedicated DB Storage Limit</label>
                          <span className="font-mono font-black text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded">
                            {currentTenant.resources.storageGb >= 1000 
                              ? `${(currentTenant.resources.storageGb / 1024).toFixed(1)} TB` 
                              : `${currentTenant.resources.storageGb} GB`}
                          </span>
                        </div>
                        <input
                          id="storage-limit-slider"
                          type="range"
                          min="100"
                          max="10000"
                          step="100"
                          value={currentTenant.resources.storageGb}
                          onChange={(e) => handleUpdateResources({ storageGb: parseInt(e.target.value) })}
                          className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                          <span>Min: 100 GB</span>
                          <span>Max: 10 TB</span>
                        </div>
                      </div>

                      {/* 4. API Rate Limit */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label htmlFor="api-limit-slider" className="text-xs font-bold text-slate-700">API Gateway Transaction Rate Limit</label>
                          <span className="font-mono font-black text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded">
                            {currentTenant.resources.apiRateLimitRps} req/s
                          </span>
                        </div>
                        <input
                          id="api-limit-slider"
                          type="range"
                          min="100"
                          max="10000"
                          step="100"
                          value={currentTenant.resources.apiRateLimitRps}
                          onChange={(e) => handleUpdateResources({ apiRateLimitRps: parseInt(e.target.value) })}
                          className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                          <span>Min: 100 req/s</span>
                          <span>Max: 10,000 req/s</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
                      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">Cluster Over-Allocation Shield</span>
                        <p className="mt-0.5">
                          Allocating more memory/vCPUs increases monthly subscription billing according to base resource multipliers.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. BRANDING & PORTAL CONFIG TAB */}
                {activeTab === 'branding' && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="flex flex-col lg:flex-row gap-6">
                      
                      {/* Left Column: Branding controls & Assets */}
                      <div className="flex-1 space-y-6">
                        
                        <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 space-y-5">
                          <span className="text-xs font-black text-slate-800 uppercase tracking-wide block border-b border-slate-100 pb-2">Custom branding config</span>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Theme Colors */}
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-700">Portal Main Color Theme</label>
                              <div className="flex items-center gap-2 pt-1">
                                {(['sapphire', 'emerald', 'amber', 'rose', 'slate'] as const).map((color) => {
                                  const bgMap = {
                                    sapphire: 'bg-indigo-600',
                                    emerald: 'bg-emerald-600',
                                    amber: 'bg-amber-500',
                                    rose: 'bg-rose-500',
                                    slate: 'bg-slate-700'
                                  };
                                  const isSelected = currentTenant.branding.themeColor === color;
                                  return (
                                    <button
                                      key={color}
                                      id={`theme-btn-${color}`}
                                      onClick={() => handleUpdateBranding({ themeColor: color })}
                                      className={`w-8 h-8 rounded-full border-2 cursor-pointer transition-transform ${bgMap[color]} ${
                                        isSelected ? 'border-slate-800 scale-110 ring-2 ring-indigo-500/40' : 'border-transparent hover:scale-105'
                                      }`}
                                      title={`Switch Theme Color to ${color}`}
                                    />
                                  );
                                })}
                              </div>
                            </div>

                            {/* Domain prefix */}
                            <div className="space-y-1.5">
                              <label htmlFor="portal-subdomain-input" className="text-xs font-bold text-slate-700 block">System Subdomain prefix</label>
                              <div className="flex rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                                <input
                                  id="portal-subdomain-input"
                                  type="text"
                                  value={currentTenant.config.subdomain}
                                  onChange={(e) => handleUpdateConfig({ subdomain: e.target.value })}
                                  className="bg-white flex-1 py-2 px-3 text-xs outline-none border-r border-slate-200"
                                />
                                <span className="bg-slate-100 text-slate-500 text-xs px-3 py-2 font-mono">.edimp.com</span>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Logo Label text */}
                            <div className="space-y-1.5">
                              <label htmlFor="logo-label-input" className="text-xs font-bold text-slate-700 block">Header Logo Text</label>
                              <input
                                id="logo-label-input"
                                type="text"
                                value={currentTenant.branding.logoText}
                                onChange={(e) => handleUpdateBranding({ logoText: e.target.value })}
                                className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none focus:ring-2 focus:ring-indigo-500/50"
                              />
                            </div>

                            {/* Portal Title */}
                            <div className="space-y-1.5">
                              <label htmlFor="portal-title-input" className="text-xs font-bold text-slate-700 block">Custom Portal Title Header</label>
                              <input
                                id="portal-title-input"
                                type="text"
                                value={currentTenant.branding.portalTitle}
                                onChange={(e) => handleUpdateBranding({ portalTitle: e.target.value })}
                                className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none focus:ring-2 focus:ring-indigo-500/50"
                              />
                            </div>
                          </div>
                        </div>

                        {/* CUSTOM LOGO ASSETS AND UPLOAD COMPONENT */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                          <span className="text-xs font-black text-slate-800 uppercase tracking-wide block border-b border-slate-100 pb-2">Tenant logo manager</span>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Drag and Drop Zone */}
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-700 block">Upload Logo File</label>
                              
                              <div
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  setIsDraggingLogo(true);
                                }}
                                onDragLeave={() => setIsDraggingLogo(false)}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  setIsDraggingLogo(false);
                                  const files = e.dataTransfer.files;
                                  if (files && files.length > 0) {
                                    handleLogoFile(files[0]);
                                  }
                                }}
                                className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all flex flex-col items-center justify-center min-h-[140px] cursor-pointer relative ${
                                  isDraggingLogo 
                                    ? 'border-indigo-500 bg-indigo-50/40 scale-[1.01]' 
                                    : 'border-slate-200 hover:border-indigo-400 bg-slate-50/50'
                                }`}
                              >
                                <input
                                  id="tenant-logo-file-picker"
                                  type="file"
                                  accept=".svg,.png,.jpg,.jpeg,.webp"
                                  onChange={(e) => {
                                    const files = e.target.files;
                                    if (files && files.length > 0) {
                                      handleLogoFile(files[0]);
                                    }
                                  }}
                                  className="hidden"
                                />
                                <label htmlFor="tenant-logo-file-picker" className="absolute inset-0 cursor-pointer w-full h-full" />
                                
                                {logoUploadProgress !== null ? (
                                  <div className="w-full space-y-2.5 z-10">
                                    <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-500">
                                      <span>SERIALIZING LOGO ASSET...</span>
                                      <span>{logoUploadProgress}%</span>
                                    </div>
                                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-indigo-600 transition-all duration-150" 
                                        style={{ width: `${logoUploadProgress}%` }}
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-2 z-10 pointer-events-none">
                                    <div className="p-2 bg-white rounded-xl shadow-3xs border border-slate-100 inline-block">
                                      <Upload className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div className="space-y-0.5">
                                      <p className="text-xs font-bold text-slate-800">Drag logo here, or <span className="text-indigo-600">browse</span></p>
                                      <p className="text-[10px] text-slate-400">Supports SVG, PNG, WebP or JPG up to 2MB</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                              {logoUploadError && (
                                <p className="text-[10px] text-rose-600 font-semibold mt-1">{logoUploadError}</p>
                              )}
                            </div>

                            {/* Preset Logo Quick Assignment */}
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-700 block">Instant Abstract Presets</label>
                              <div className="grid grid-cols-2 gap-2">
                                {[
                                  { id: 'loop', name: 'Infinity Loop', desc: 'Symmetric connections', path: 'M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 1 0 0-8c-2 0-4 1.33-6 4Z' },
                                  { id: 'hexa', name: 'HexaNode', desc: 'Secure data grid', path: 'M12 2l8.66 5v10L12 22l-8.66-5V7L12 2z M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z' },
                                  { id: 'delta', name: 'Delta Shield', desc: 'Enterprise trust', path: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M12 6v10 M9 9h6 M10 13h4' },
                                  { id: 'orion', name: 'Orion Prism', desc: 'Converged structures', path: 'M12 2L2 22h20L12 2z M12 2v20 M2 22l10-10 M22 22L12 12' }
                                ].map((preset) => {
                                  // Map current theme color name to its HEX code for dynamic SVG injection
                                  const themeColorHex = 
                                    currentTenant.branding.themeColor === 'sapphire' ? '%234f46e5' :
                                    currentTenant.branding.themeColor === 'emerald' ? '%23059669' :
                                    currentTenant.branding.themeColor === 'amber' ? '%23d97706' :
                                    currentTenant.branding.themeColor === 'rose' ? '%23e11d48' :
                                    '%23475569'; // slate

                                  const svgDataUrl = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${themeColorHex}" stroke-width="2"><path d="${preset.path}"/></svg>`;

                                  return (
                                    <button
                                      key={preset.id}
                                      onClick={() => handlePresetSelect(preset.name, svgDataUrl)}
                                      className="p-2.5 border border-slate-100 rounded-xl hover:border-indigo-200 hover:bg-slate-50 text-left transition-colors flex items-center gap-2 cursor-pointer w-full text-xs font-semibold"
                                    >
                                      <div className="w-8 h-8 rounded-lg border border-slate-150 p-1 bg-white flex items-center justify-center shrink-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke={
                                          currentTenant.branding.themeColor === 'sapphire' ? '#4f46e5' :
                                          currentTenant.branding.themeColor === 'emerald' ? '#059669' :
                                          currentTenant.branding.themeColor === 'amber' ? '#d97706' :
                                          currentTenant.branding.themeColor === 'rose' ? '#e11d48' :
                                          '#475569'
                                        } strokeWidth="2" className="w-full h-full">
                                          <path d={preset.path} />
                                        </svg>
                                      </div>
                                      <div className="min-w-0">
                                        <p className="font-bold text-slate-800 truncate">{preset.name}</p>
                                        <p className="text-[9px] text-slate-400 truncate">{preset.desc}</p>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          {/* Current Logo Display / Action row */}
                          {currentTenant.branding.logoUrl && (
                            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 text-xs">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-white rounded-lg border border-slate-200 p-1 flex items-center justify-center">
                                  <img 
                                    src={currentTenant.branding.logoUrl} 
                                    alt="Uploaded Tenant Brand Logo" 
                                    className="max-w-full max-h-full object-contain"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                                <div className="space-y-0.5">
                                  <span className="font-bold text-slate-800 block">Active Branding Logo Asset</span>
                                  <span className="text-[10px] text-slate-400 font-mono">Status: Applied to Tenant Gateways</span>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  handleUpdateBranding({ logoUrl: undefined });
                                  addAuditLog(
                                    currentTenant.id,
                                    'Logo Removed',
                                    'Configuration',
                                    'Info',
                                    'Cleared custom branding logo asset. Tenant reverted to initials-based system placeholder.'
                                  );
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-rose-600 hover:text-white border border-rose-200 hover:border-transparent hover:bg-rose-600 text-xs font-bold rounded-lg transition-all cursor-pointer shadow-3xs"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Remove Logo</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Integration webhooks & SSO Config block */}
                        <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 space-y-5">
                          {/* Single Sign-on Config */}
                          <div className="space-y-3.5">
                            <span className="text-xs font-black text-slate-800 uppercase tracking-wide block">Single Sign-On (SSO) Integration</span>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label htmlFor="sso-provider-select" className="text-xs font-bold text-slate-700 block">SAML/OIDC Provider ID</label>
                                <select
                                  id="sso-provider-select"
                                  value={currentTenant.config.ssoProvider}
                                  onChange={(e) => handleUpdateConfig({ ssoProvider: e.target.value as any })}
                                  className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500/50"
                                >
                                  <option value="None">None (Email & Password)</option>
                                  <option value="Google Workspace">Google Workspace SSO</option>
                                  <option value="Microsoft Entra ID">Microsoft Entra ID / Azure AD</option>
                                  <option value="Okta SAML">Okta Enterprise SAML 2.0</option>
                                </select>
                              </div>

                              {currentTenant.config.ssoProvider !== 'None' && (
                                <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                                  <label htmlFor="sso-url-input" className="text-xs font-bold text-slate-700 block">SSO Metadata Discovery URI</label>
                                  <input
                                    id="sso-url-input"
                                    type="text"
                                    value={currentTenant.config.ssoMetadataUrl}
                                    onChange={(e) => handleUpdateConfig({ ssoMetadataUrl: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none focus:ring-2 focus:ring-indigo-500/50"
                                  />
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Integration webhooks */}
                          <div className="space-y-1.5 border-t border-slate-200 pt-5">
                            <label htmlFor="webhook-callback-input" className="text-xs font-bold text-slate-700 block">Webhook Notification Target Endpoint</label>
                            <input
                              id="webhook-callback-input"
                              type="url"
                              placeholder="https://api.customer.com/webhooks"
                              value={currentTenant.config.webhookCallbackUrl}
                              onChange={(e) => handleUpdateConfig({ webhookCallbackUrl: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono"
                            />
                            <span className="text-[10px] text-slate-400 font-mono block">EDIMP broadcasts secure JSON payloads to this endpoint when tasks complete.</span>
                          </div>
                        </div>

                      </div>

                      {/* Right Column: Dynamic Real-Time Client Portal Preview */}
                      <div className="w-full lg:w-[360px] shrink-0 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-500 uppercase tracking-wider font-mono">Portal Real-Time Preview</span>
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                        </div>

                        {/* Browser Mockup Container */}
                        <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-xl border border-slate-800 flex flex-col h-[520px]">
                          {/* Browser Toolbar */}
                          <div className="bg-slate-950 p-3.5 border-b border-slate-850 flex items-center gap-2">
                            <div className="flex gap-1.5 shrink-0">
                              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                            </div>
                            <div className="bg-slate-900 border border-slate-800/80 rounded-lg py-1 px-3 text-[10px] font-mono text-slate-400 flex items-center justify-center gap-1.5 w-full truncate">
                              <Lock className="w-3 h-3 text-slate-500 shrink-0" />
                              <span className="truncate">https://{currentTenant.config.subdomain || 'company'}.edimp.com/portal/login</span>
                            </div>
                          </div>

                          {/* Portal View Area */}
                          <div className="bg-slate-50 flex-1 flex flex-col overflow-y-auto">
                            {/* Portal Top Nav */}
                            <header className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between shadow-3xs">
                              <div className="flex items-center gap-2 max-w-[70%]">
                                <div className="w-7 h-7 bg-white rounded-lg p-0.5 border border-slate-150 flex items-center justify-center shrink-0">
                                  {currentTenant.branding.logoUrl ? (
                                    <img 
                                      src={currentTenant.branding.logoUrl} 
                                      alt="Portal logo" 
                                      className="max-w-full max-h-full object-contain rounded"
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <div className={`w-full h-full rounded flex items-center justify-center font-black text-[9px] uppercase text-white ${
                                      currentTenant.branding.themeColor === 'sapphire' ? 'bg-indigo-600' :
                                      currentTenant.branding.themeColor === 'emerald' ? 'bg-emerald-600' :
                                      currentTenant.branding.themeColor === 'amber' ? 'bg-amber-500' :
                                      currentTenant.branding.themeColor === 'rose' ? 'bg-rose-500' :
                                      'bg-slate-700'
                                    }`}>
                                      {currentTenant?.name ? currentTenant.name.split(' ').map(n => n[0]).join('').substring(0, 2) : ''}
                                    </div>
                                  )}
                                </div>
                                <span className="font-extrabold text-xs text-slate-800 truncate tracking-tight uppercase">
                                  {currentTenant.branding.logoText || 'PORTAL'}
                                </span>
                              </div>
                              <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-tight">SaaS Client Space</span>
                            </header>

                            {/* Portal Landing Content */}
                            <div className="flex-1 p-6 flex flex-col items-center justify-center">
                              <div className="w-full max-w-[260px] bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4 text-center">
                                <div className="space-y-1">
                                  <h3 className="text-sm font-black text-slate-900 tracking-tight leading-tight">
                                    {currentTenant.branding.portalTitle || 'Welcome Back'}
                                  </h3>
                                  <p className="text-[10px] text-slate-400">Secure SSO Gateway Authorized Isolation</p>
                                </div>

                                <div className="space-y-2 text-left">
                                  <div className="space-y-1">
                                    <span className="text-[9px] uppercase font-bold text-slate-400 font-mono">SaaS Client Workspace Identity</span>
                                    <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg text-[10px] font-mono text-slate-600 truncate">
                                      {currentTenant.name}
                                    </div>
                                  </div>

                                  <div className="space-y-1">
                                    <span className="text-[9px] uppercase font-bold text-slate-400 font-mono">Sign-In Gateway Mode</span>
                                    <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-[10px] text-slate-600 font-semibold flex items-center justify-between">
                                      <span>
                                        {currentTenant.config.ssoProvider !== 'None' 
                                          ? `Federated (${currentTenant.config.ssoProvider})`
                                          : 'Local Email Credentials'
                                        }
                                      </span>
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                    </div>
                                  </div>
                                </div>

                                <button
                                  className={`w-full py-2 px-3 text-xs font-bold text-white rounded-lg cursor-not-allowed transition-all leading-none ${
                                    currentTenant.branding.themeColor === 'sapphire' ? 'bg-indigo-600' :
                                    currentTenant.branding.themeColor === 'emerald' ? 'bg-emerald-600' :
                                    currentTenant.branding.themeColor === 'amber' ? 'bg-amber-500' :
                                    currentTenant.branding.themeColor === 'rose' ? 'bg-rose-500' :
                                    'bg-slate-700'
                                  }`}
                                  disabled
                                >
                                  {currentTenant?.config?.ssoProvider && currentTenant.config.ssoProvider !== 'None' 
                                    ? `Authorize with ${currentTenant.config.ssoProvider.split(' ')[0]}`
                                    : 'Secure Sign In'
                                  }
                                </button>

                                <p className="text-[8px] text-slate-400 leading-normal">
                                  Strict cryptographic isolation boundaries enforced via isolated PG-schema clusters.
                                </p>
                              </div>
                            </div>

                            {/* Simulated Footer */}
                            <footer className="bg-slate-100 p-3 border-t border-slate-150 text-center">
                              <p className="text-[9px] text-slate-400 font-mono">© 2026 EDIMP Cluster • Managed Tenancy</p>
                            </footer>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* SECURITY & MFA ACCESS CONTROLS TAB */}
                {activeTab === 'security' && (
                  <div className="space-y-6 animate-in fade-in duration-200" id="mfa-security-tab-panel">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <span className="text-xs font-black text-slate-800 uppercase tracking-wide block">Multi-Factor Authentication & Zero-Trust Access</span>
                          <p className="text-[11px] text-slate-500">
                            Enforce SOC2/HIPAA cryptographic access challenges, enroll multi-factor physical tokens, and test secure portal SSO entry via isolation gateway layers.
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400 bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1.5 shrink-0">
                          <Lock className="w-3.5 h-3.5 text-indigo-500 animate-pulse shrink-0" />
                          <span>Isolation State: SECURE</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                      {/* Left: Device Inventory & Policies */}
                      <div className="xl:col-span-7 space-y-6">
                        
                        {/* 1. Device Enrollment & Inventory */}
                        <div className="bg-white rounded-xl border border-slate-200/80 shadow-3xs p-5 space-y-4" id="mfa-device-inventory">
                          <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                              <Smartphone className="w-4.5 h-4.5 text-indigo-500" />
                              <h2 className="text-sm font-extrabold text-slate-900">Enrolled Multi-Factor Tokens</h2>
                            </div>
                            {!isPairingActive && (
                              <button
                                id="btn-start-mfa-pairing"
                                onClick={startPairingMfa}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 text-indigo-600 border border-indigo-200/60 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Pair MFA Device</span>
                              </button>
                            )}
                          </div>

                          {/* Device List */}
                          <div className="space-y-3">
                            {(!mfaDevices[selectedTenantId] || mfaDevices[selectedTenantId].length === 0) ? (
                              <div className="bg-slate-50/55 rounded-xl border border-dashed border-slate-200 p-6 text-center space-y-2">
                                <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                                <div className="space-y-0.5">
                                  <h3 className="text-xs font-bold text-slate-800">No MFA Devices Registered</h3>
                                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                                    Administrative workspaces require cryptographically verified identity. Secure this client tenant by pairing a Google Authenticator or physical security token.
                                  </p>
                                </div>
                                <button
                                  id="btn-enroll-primary-token"
                                  onClick={startPairingMfa}
                                  className="mt-1 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Enroll Primary Token</span>
                                </button>
                              </div>
                            ) : (
                              <div className="border border-slate-150 rounded-xl overflow-hidden divide-y divide-slate-100 bg-slate-50/30">
                                {mfaDevices[selectedTenantId].map(device => (
                                  <div key={device.id} className="p-3.5 flex items-center justify-between gap-3 bg-white">
                                    <div className="flex items-center gap-3">
                                      <div className="p-2 bg-slate-50 border border-slate-150 rounded-lg shrink-0">
                                        {device.type === 'Authenticator App' ? (
                                          <Smartphone className="w-4 h-4 text-indigo-500" />
                                        ) : (
                                          <KeyRound className="w-4 h-4 text-amber-500" />
                                        )}
                                      </div>
                                      <div className="space-y-0.5">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-xs font-extrabold text-slate-800">{device.name}</span>
                                          <span className="flex h-1.5 w-1.5 relative shrink-0">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                          </span>
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-medium">
                                          {device.type === 'Authenticator App' ? `App: ${device.appName}` : 'FIDO2 Physical Cryptokey'} • Registered: {device.pairedAt}
                                        </p>
                                        <p className="text-[10px] text-slate-500 font-mono">
                                          Last Verification: <span className="text-slate-600 font-semibold">{device.lastUsedAt}</span>
                                        </p>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => revokeMfaDevice(device.id, device.name)}
                                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg border border-slate-100 hover:border-rose-200 hover:bg-rose-50 transition-colors cursor-pointer"
                                      title="Revoke Device"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 2. Secure Enrollment Wizard Block */}
                        {isPairingActive && (
                          <div className="bg-indigo-50/20 rounded-xl border border-indigo-200/50 shadow-3xs p-5 space-y-4 animate-in slide-in-from-top-2 duration-200" id="mfa-pairing-wizard">
                            <div className="flex items-center justify-between gap-3 pb-2 border-b border-indigo-100/50">
                              <div className="flex items-center gap-2">
                                <QrCode className="w-4.5 h-4.5 text-indigo-500" />
                                <h2 className="text-sm font-extrabold text-indigo-900">MFA Enrollment Wizard</h2>
                              </div>
                              <button
                                onClick={() => setIsPairingActive(false)}
                                className="p-1 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-55 rounded cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Wizard Progress Bar */}
                            <div className="space-y-1.5">
                              <div className="flex justify-between text-[10px] font-bold text-indigo-600 font-mono">
                                <span>STEP {pairingStep} OF 4</span>
                                <span>
                                  {pairingStep === 1 ? 'Configure Device' :
                                   pairingStep === 2 ? 'Scan Security Secret' :
                                   pairingStep === 3 ? 'Verify Access Challenge' :
                                   'Backup Protection Codes'}
                                </span>
                              </div>
                              <div className="h-1.5 w-full bg-indigo-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-indigo-600 transition-all duration-300"
                                  style={{ width: `${(pairingStep / 4) * 100}%` }}
                                />
                              </div>
                            </div>

                            {/* Step Content */}
                            <div className="pt-2">
                              {pairingStep === 1 && (
                                <div className="space-y-4">
                                  <div className="space-y-3">
                                    <div className="space-y-1">
                                      <label className="text-[10px] uppercase font-bold text-indigo-700 tracking-wider">MFA Device Type</label>
                                      <div className="grid grid-cols-2 gap-3">
                                        <button
                                          type="button"
                                          onClick={() => setPairingDeviceType('Authenticator App')}
                                          className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                                            pairingDeviceType === 'Authenticator App' 
                                              ? 'bg-white border-indigo-500 ring-2 ring-indigo-200' 
                                              : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
                                          }`}
                                        >
                                          <div className="flex items-center gap-2 mb-1">
                                            <Smartphone className={`w-4 h-4 ${pairingDeviceType === 'Authenticator App' ? 'text-indigo-600' : 'text-slate-400'}`} />
                                            <span className="text-xs font-black">Mobile App</span>
                                          </div>
                                          <p className="text-[9px] text-slate-400 leading-tight">Google Authenticator, Microsoft Auth, Authy, Duo</p>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            setPairingDeviceType('Hardware Key');
                                            setPairingDeviceName('YubiKey Secure FIDO2');
                                          }}
                                          className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                                            pairingDeviceType === 'Hardware Key' 
                                              ? 'bg-white border-indigo-500 ring-2 ring-indigo-200' 
                                              : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
                                          }`}
                                        >
                                          <div className="flex items-center gap-2 mb-1">
                                            <KeyRound className={`w-4 h-4 ${pairingDeviceType === 'Hardware Key' ? 'text-indigo-600' : 'text-slate-400'}`} />
                                            <span className="text-xs font-black">Physical Token</span>
                                          </div>
                                          <p className="text-[9px] text-slate-400 leading-tight">Physical USB/NFC YubiKey security credential tokens</p>
                                        </button>
                                      </div>
                                    </div>

                                    <div className="space-y-1">
                                      <label className="text-[10px] uppercase font-bold text-indigo-700 tracking-wider">Assign Device Identifier</label>
                                      <input
                                        type="text"
                                        value={pairingDeviceName}
                                        onChange={(e) => setPairingDeviceName(e.target.value)}
                                        placeholder="e.g. Admin MacBook Pro Key, Primary Duo Auth"
                                        className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                                      />
                                    </div>

                                    {pairingDeviceType === 'Authenticator App' && (
                                      <div className="space-y-1">
                                        <label className="text-[10px] uppercase font-bold text-indigo-700 tracking-wider">Preferred Authenticator Client</label>
                                        <select
                                          value={pairingAppName}
                                          onChange={(e: any) => setPairingAppName(e.target.value)}
                                          className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 hover:border-slate-300 cursor-pointer"
                                        >
                                          <option value="Google Authenticator">Google Authenticator (Recommended)</option>
                                          <option value="Microsoft Authenticator">Microsoft Authenticator</option>
                                          <option value="Authy">Twilio Authy App</option>
                                          <option value="Duo Mobile">Duo Mobile Security Link</option>
                                        </select>
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex justify-end pt-2">
                                    <button
                                      type="button"
                                      onClick={() => setPairingStep(2)}
                                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer"
                                    >
                                      <span>Next: Generate Secret Keys</span>
                                      <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              )}

                              {pairingStep === 2 && (
                                <div className="space-y-4">
                                  <div className="bg-white p-4 rounded-xl border border-slate-200/80 flex flex-col md:flex-row gap-5 items-center">
                                    <MfaQrCode secret={pairingManualKey} themeColor="sapphire" size={120} />
                                    <div className="space-y-2 text-center md:text-left flex-1">
                                      <div className="space-y-0.5">
                                        <h3 className="text-xs font-black text-slate-800">Scan Cryptographic QR Code</h3>
                                        <p className="text-[11px] text-slate-400 leading-relaxed">
                                          Scan the pixel grid using your smartphone camera in {pairingAppName || 'your Auth App'}. If your mobile camera is obstructed, manually register the secure secret seed.
                                        </p>
                                      </div>

                                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 flex items-center justify-between gap-2 max-w-sm">
                                        <div className="font-mono text-[10px] font-bold text-slate-600 select-all tracking-wider truncate">
                                          {pairingManualKey}
                                        </div>
                                        <span className="text-[8px] bg-slate-200 text-slate-500 font-mono px-1 py-0.5 rounded uppercase font-black">Secret Seed</span>
                                      </div>
                                      <p className="text-[9px] text-indigo-500/80 font-medium leading-normal">
                                        * Tip: You can also use our interactive <b>Mobile Authenticator Simulator</b> on the right column! Just click "Scan QR Code Automatically" inside the phone.
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex justify-between pt-2">
                                    <button
                                      type="button"
                                      onClick={() => setPairingStep(1)}
                                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                                    >
                                      Back
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setPairingStep(3)}
                                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer"
                                    >
                                      <span>Next: Verify Synchronization</span>
                                      <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              )}

                              {pairingStep === 3 && (
                                <div className="space-y-4">
                                  <div className="space-y-3">
                                    <div className="space-y-1">
                                      <label className="text-[10px] uppercase font-bold text-indigo-700 tracking-wider block">Verify Active Security Challenge</label>
                                      <p className="text-[11px] text-slate-400 leading-normal">
                                        Enter the rotating 6-digit authenticator code generated by your mobile auth app to synchronize internal cryptographic clock servers.
                                      </p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                      <input
                                        type="text"
                                        maxLength={6}
                                        value={pairingCodeInput}
                                        onChange={(e) => setPairingCodeInput(e.target.value.replace(/\D/g, ''))}
                                        placeholder="e.g. 000000"
                                        className="p-3 bg-white border border-slate-200 rounded-lg text-center font-mono font-black text-sm tracking-widest text-slate-800 w-[140px] focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => setPairingCodeInput(totpCode)}
                                        className="px-3 py-2.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 text-slate-600 border border-slate-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                                      >
                                        Auto-fill Active Code
                                      </button>
                                    </div>

                                    {pairingError && (
                                      <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg text-[11px] text-rose-600 font-semibold flex items-start gap-2 animate-shake">
                                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                        <span>{pairingError}</span>
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex justify-between pt-2">
                                    <button
                                      type="button"
                                      onClick={() => setPairingStep(2)}
                                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                                    >
                                      Back
                                    </button>
                                    <button
                                      type="button"
                                      onClick={verifyAndEnrollDevice}
                                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer"
                                    >
                                      <span>Verify & Authorize Device</span>
                                      <ShieldCheck className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              )}

                              {pairingStep === 4 && (
                                <div className="space-y-4 text-center py-2 animate-in zoom-in-95 duration-200">
                                  <div className="w-11 h-11 bg-emerald-100 text-emerald-600 border border-emerald-200 rounded-full flex items-center justify-center mx-auto shadow-3xs">
                                    <CheckCircle className="w-6 h-6" />
                                  </div>
                                  <div className="space-y-1">
                                    <h3 className="text-sm font-black text-slate-850">Device Successfully Linked!</h3>
                                    <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                                      Your MFA token <b>{pairingDeviceName}</b> is now locked to your SaaS account credentials. Save these offline recovery codes in case you lose access to this token.
                                    </p>
                                  </div>

                                  {/* Backup codes container */}
                                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 max-w-sm mx-auto">
                                    <div className="text-[9px] uppercase font-mono font-bold text-slate-500 mb-2 tracking-widest text-left border-b border-slate-800 pb-1">
                                      Offline Recovery Codes (Single Use)
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[10px] text-slate-300 font-semibold text-left">
                                      {pairingSuccessCodes.map((code, idx) => (
                                        <div key={idx} className="flex items-center gap-1.5">
                                          <span className="text-slate-600 font-bold">{idx + 1}.</span>
                                          <span className="select-all">{code}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="pt-2 flex justify-center">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setIsPairingActive(false);
                                        setPairingStep(1);
                                      }}
                                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                                    >
                                      Complete & Save
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 3. Global Security Policies */}
                        <div className="bg-white rounded-xl border border-slate-200/80 shadow-3xs p-5 space-y-4" id="mfa-security-policies">
                          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                            <Shield className="w-4.5 h-4.5 text-indigo-500" />
                            <h2 className="text-sm font-extrabold text-slate-900">Workspace Isolation Policies</h2>
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-0.5 text-left">
                                <label className="text-xs font-extrabold text-slate-850 flex items-center gap-1">
                                  <span>Global Multi-Factor Enforcements</span>
                                </label>
                                <p className="text-[11px] text-slate-400 max-w-sm leading-normal">
                                  Mandate secure authenticator tokens or physical security keys for all tenant administrators under standard SOC2 compliance requirements.
                                </p>
                              </div>
                              <button
                                onClick={() => {
                                  const newVal = !mfaRequired[selectedTenantId];
                                  setMfaRequired(prev => ({ ...prev, [selectedTenantId]: newVal }));
                                  addAuditLog(
                                    selectedTenantId,
                                    newVal ? 'Global MFA Policy Enforced' : 'Global MFA Policy Suspended',
                                    'Security',
                                    newVal ? 'Success' : 'Warning',
                                    newVal 
                                      ? `Multi-factor authentication (MFA) was globally set to MANDATORY for all administrative workspace actors.`
                                      : `Multi-factor authentication (MFA) was lowered to OPTIONAL. Security posture may be compromised.`
                                  );
                                }}
                                className="focus:outline-none cursor-pointer text-slate-500 shrink-0 border-0 bg-transparent p-0"
                              >
                                {mfaRequired[selectedTenantId] ? (
                                  <ToggleRight className="w-10 h-10 text-indigo-600 transition-all" />
                                ) : (
                                  <ToggleLeft className="w-10 h-10 text-slate-300 hover:text-slate-400 transition-all" />
                                )}
                              </button>
                            </div>

                            <div className="flex items-start justify-between gap-4 pt-3 border-t border-slate-100">
                              <div className="space-y-0.5 text-left">
                                <label className="text-xs font-extrabold text-slate-850">
                                  Passwordless FIDO2 Hardware Keys
                                </label>
                                <p className="text-[11px] text-slate-400 max-w-sm leading-normal">
                                  Allow administrative authorization directly through WebAuthn protocols using physical hardware tokens (e.g. YubiKey 5 Series).
                                </p>
                              </div>
                              <button
                                onClick={() => {
                                  const newVal = !mfaAllowFido[selectedTenantId];
                                  setMfaAllowFido(prev => ({ ...prev, [selectedTenantId]: newVal }));
                                  addAuditLog(
                                    selectedTenantId,
                                    newVal ? 'FIDO2 Hardware Key Authorized' : 'FIDO2 Hardware Key Disabled',
                                    'Security',
                                    'Info',
                                    `Passwordless FIDO2 hardware token support ${newVal ? 'ENABLED' : 'DISABLED'}.`
                                  );
                                }}
                                className="focus:outline-none cursor-pointer text-slate-500 shrink-0 border-0 bg-transparent p-0"
                              >
                                {mfaAllowFido[selectedTenantId] ? (
                                  <ToggleRight className="w-10 h-10 text-indigo-600 transition-all" />
                                ) : (
                                  <ToggleLeft className="w-10 h-10 text-slate-300 hover:text-slate-400 transition-all" />
                                )}
                              </button>
                            </div>

                            {/* Whitelisting and Grace Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-left">
                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-slate-400 font-mono">Access Whitelist IP (CIDR Blocks)</label>
                                <input
                                  type="text"
                                  value={mfaIpWhitelist[selectedTenantId] || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setMfaIpWhitelist(prev => ({ ...prev, [selectedTenantId]: val }));
                                  }}
                                  placeholder="e.g. 192.168.1.0/24 (Leave blank for no filter)"
                                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-slate-400 font-mono">MFA Enrollment Grace Period</label>
                                <select
                                  value={mfaGracePeriod[selectedTenantId] || 'Immediate'}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setMfaGracePeriod(prev => ({ ...prev, [selectedTenantId]: val }));
                                  }}
                                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                                >
                                  <option value="Immediate">Immediate Enforcement</option>
                                  <option value="3 Days">3 Days Grace Period</option>
                                  <option value="7 Days">7 Days Grace Period</option>
                                  <option value="14 Days">14 Days Grace Period</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* Right: Interactive Gateway Simulator Phone Container */}
                      <div className="xl:col-span-5 space-y-4">
                        <div className="bg-slate-900 text-white rounded-2xl border border-slate-850 p-4 shadow-xl space-y-4 relative overflow-hidden" id="mfa-simulator-device">
                          <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                            <Smartphone className="w-32 h-32 text-indigo-400" />
                          </div>

                          <div className="space-y-1 z-10 relative text-left">
                            <h3 className="text-xs font-black uppercase text-indigo-400 tracking-widest font-mono">Interactive Security Sandbox</h3>
                            <h4 className="text-sm font-black text-white">EDIMP Gateway & Device Simulator</h4>
                            <p className="text-[10px] text-slate-400 leading-normal">
                              Test MFA pairing or visualize login challenge flows from the client perspective using the physical smartphone mockup below.
                            </p>
                          </div>

                          {/* Simulator Tabs */}
                          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                            <button
                              type="button"
                              onClick={() => {
                                setSimulatedDeviceTab('app');
                                resetGatewaySimulator();
                              }}
                              className={`flex-1 py-1.5 text-center text-[10px] font-bold rounded-lg transition-all cursor-pointer border-0 outline-none ${
                                simulatedDeviceTab === 'app'
                                  ? 'bg-slate-800 text-white'
                                  : 'text-slate-400 hover:text-slate-200 bg-transparent'
                              }`}
                            >
                              📱 Mobile Authenticator App
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSimulatedDeviceTab('login');
                                resetGatewaySimulator();
                              }}
                              className={`flex-1 py-1.5 text-center text-[10px] font-bold rounded-lg transition-all cursor-pointer border-0 outline-none ${
                                simulatedDeviceTab === 'login'
                                  ? 'bg-slate-800 text-white'
                                  : 'text-slate-400 hover:text-slate-200 bg-transparent'
                              }`}
                            >
                              🌐 SSO Portal Login Gate
                            </button>
                          </div>

                          {/* Physical SmartPhone Mockup Container */}
                          <div className="bg-slate-950 rounded-2xl border-4 border-slate-800 p-3 h-[420px] flex flex-col relative shadow-inner">
                            {/* Smartphone notch */}
                            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-14 h-4 bg-slate-800 rounded-full z-20 flex items-center justify-center">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-900 block" />
                            </div>

                            {/* Simulator Tab Content: Mobile Authenticator */}
                            {simulatedDeviceTab === 'app' && (
                              <div className="flex-1 flex flex-col pt-3 space-y-4">
                                <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 font-semibold px-1">
                                  <span>EDIMP SECURE</span>
                                  <span>10:45 AM</span>
                                </div>

                                <div className="space-y-1 text-center">
                                  <h4 className="text-xs font-black text-indigo-400 tracking-wide">SecureAuth Hub</h4>
                                  <p className="text-[9px] text-slate-500">Google Authenticator Engine v4.8</p>
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-3 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/80">
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between text-[8px] uppercase font-mono font-bold text-slate-500 px-1">
                                      <span>ACTIVE KEYCHAIN ACCOUNT</span>
                                      <span className="text-indigo-400 animate-pulse">● Simulator Online</span>
                                    </div>

                                    {/* Code generator item */}
                                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="truncate text-left">
                                          <div className="text-[10px] font-black text-slate-200 leading-tight">
                                            EDIMP Cluster: {currentTenant.name}
                                          </div>
                                          <div className="text-[8px] text-slate-500 truncate font-semibold font-mono">
                                            {currentTenant.adminEmail || `admin@${currentTenant.config.subdomain}.com`}
                                          </div>
                                        </div>
                                        <span className="text-[8px] uppercase bg-indigo-950 text-indigo-400 font-mono font-bold px-1.5 py-0.5 rounded border border-indigo-900/60 leading-none">
                                          TOTP SHA1
                                        </span>
                                      </div>

                                      <div className="flex items-center justify-between pt-1">
                                        {/* Stylized code display */}
                                        <div className="text-xl font-mono font-black text-indigo-400 tracking-wider">
                                          {totpCode.slice(0, 3)} {totpCode.slice(3)}
                                        </div>

                                        {/* Code life ring ticker */}
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-[9px] font-mono font-bold text-slate-500">{totpSecondsLeft}s</span>
                                          <div className="w-5 h-5 rounded-full border-2 border-slate-800 flex items-center justify-center relative">
                                            <svg className="w-full h-full transform -rotate-90">
                                              <circle
                                                cx="8"
                                                cy="8"
                                                r="6"
                                                className="stroke-indigo-600 fill-none"
                                                strokeWidth="2"
                                                strokeDasharray="37.68"
                                                strokeDashoffset={`${37.68 - (37.68 * totpSecondsLeft) / 30}`}
                                              />
                                            </svg>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {isPairingActive && pairingStep === 2 && (
                                    <div className="bg-indigo-950/60 border border-indigo-900/80 p-3 rounded-lg space-y-2 text-center animate-pulse">
                                      <p className="text-[9px] text-indigo-300 leading-normal font-semibold">
                                        📲 Kameramodus aktiv: QR-Code zur SaaS-Einrichtung erkannt.
                                      </p>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setPairingCodeInput(totpCode);
                                          setPairingStep(3);
                                        }}
                                        className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-bold rounded-md cursor-pointer transition-all uppercase tracking-wide border-0 outline-none"
                                      >
                                        Scan QR Code Automatically
                                      </button>
                                    </div>
                                  )}

                                  {!isPairingActive && (
                                    <div className="p-3 text-center border border-dashed border-slate-800 rounded-lg">
                                      <p className="text-[9px] text-slate-500 leading-normal">
                                        Click <b>Pair MFA Device</b> inside the left panel to trigger the setup wizard scanner.
                                      </p>
                                    </div>
                                  )}
                                </div>

                                <div className="text-center">
                                  <p className="text-[8px] text-slate-600 leading-tight">
                                    Simulates standard RFC-6238 TOTP Google Authenticator. Sync interval is automated.
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Simulator Tab Content: Access Gateway Login Challenge */}
                            {simulatedDeviceTab === 'login' && (
                              <div className="flex-1 flex flex-col pt-3 space-y-3 justify-between overflow-y-auto">
                                <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 font-semibold px-1">
                                  <span>{currentTenant.config.subdomain}.edimp.com</span>
                                  <span>10:45 AM</span>
                                </div>

                                {loginStep === 'credentials' && (
                                  <form onSubmit={handleGatewaySubmitCredentials} className="space-y-4 my-auto">
                                    <div className="space-y-1 text-center">
                                      <div className="w-10 h-10 bg-indigo-950 text-indigo-400 border border-indigo-900 rounded-xl flex items-center justify-center mx-auto shadow-xs">
                                        <Lock className="w-5 h-5" />
                                      </div>
                                      <h4 className="text-xs font-black text-white">SaaS Administrative Gateway</h4>
                                      <p className="text-[8px] text-slate-500 uppercase tracking-widest font-mono">Isolated PG Schema SSO</p>
                                    </div>

                                    <div className="space-y-2.5 text-left bg-slate-900/50 p-3 rounded-xl border border-slate-800/80">
                                      <div className="space-y-0.5">
                                        <label className="text-[8px] uppercase font-bold text-slate-400">Admin Email</label>
                                        <input
                                          type="email"
                                          value={loginEmail}
                                          onChange={(e) => setLoginEmail(e.target.value)}
                                          placeholder={currentTenant.adminEmail}
                                          className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-[10px] text-white focus:outline-none focus:border-indigo-500 font-mono"
                                        />
                                      </div>

                                      <div className="space-y-0.5">
                                        <label className="text-[8px] uppercase font-bold text-slate-400">Security Password</label>
                                        <input
                                          type="password"
                                          value={loginPassword}
                                          onChange={(e) => setLoginPassword(e.target.value)}
                                          placeholder="••••••••••••"
                                          className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-[10px] text-white focus:outline-none"
                                        />
                                      </div>
                                    </div>

                                    {loginError && (
                                      <div className="text-[9px] text-rose-500 bg-rose-950/40 border border-rose-900/60 p-2 rounded-lg text-left font-semibold">
                                        {loginError}
                                      </div>
                                    )}

                                    <button
                                      type="submit"
                                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-lg cursor-pointer transition-all border-0 outline-none"
                                    >
                                      Authenticate Client Workspace
                                    </button>
                                  </form>
                                )}

                                {loginStep === 'mfa' && (
                                  <form onSubmit={handleGatewayVerifyMfa} className="space-y-4 my-auto">
                                    <div className="space-y-1 text-center">
                                      <div className="w-10 h-10 bg-indigo-950 text-indigo-400 border border-indigo-900 rounded-xl flex items-center justify-center mx-auto animate-pulse">
                                        <ShieldCheck className="w-5 h-5" />
                                      </div>
                                      <h4 className="text-xs font-black text-white">Security Verification Gate</h4>
                                      <p className="text-[9px] text-slate-400 leading-tight">
                                        Multi-factor authentication is globally enforced on client <b>{currentTenant.name}</b>.
                                      </p>
                                    </div>

                                    <div className="space-y-2.5 text-center bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                                      <label className="text-[8px] uppercase font-bold text-slate-400 tracking-wider block">Enter 6-digit Authenticator Challenge</label>
                                      
                                      <div className="flex justify-center">
                                        <input
                                          type="text"
                                          maxLength={6}
                                          value={loginMfaCode}
                                          onChange={(e) => setLoginMfaCode(e.target.value.replace(/\D/g, ''))}
                                          placeholder="000000"
                                          className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-center text-white font-mono font-black text-sm tracking-widest w-[120px] focus:outline-none"
                                        />
                                      </div>

                                      {/* Phone simulator connection helper */}
                                      <div className="pt-1.5 flex flex-col gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => setLoginMfaCode(totpCode)}
                                          className="w-full py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[8px] font-mono font-bold rounded border-0 cursor-pointer"
                                        >
                                          Copy Code from Simulator: {totpCode}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={handleGatewayAutoScanQr}
                                          disabled={qrScanningActive}
                                          className="w-full py-1 bg-indigo-950 hover:bg-indigo-900 border border-indigo-900/50 text-indigo-400 text-[8px] font-bold rounded flex items-center justify-center gap-1 cursor-pointer outline-none"
                                        >
                                          {qrScanningActive ? (
                                            <span>Scanning QR Code ...</span>
                                          ) : (
                                            <>
                                              <QrCode className="w-3 h-3" />
                                              <span>Instant Auto-Scan QR (Camera Link)</span>
                                            </>
                                          )}
                                        </button>
                                      </div>
                                    </div>

                                    {loginError && (
                                      <div className="text-[9px] text-rose-500 bg-rose-950/40 border border-rose-900/60 p-2 rounded-lg text-left font-semibold">
                                        {loginError}
                                      </div>
                                    )}

                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setLoginStep('credentials')}
                                        className="w-1/3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded-lg border-0 cursor-pointer"
                                      >
                                        Back
                                      </button>
                                      <button
                                        type="submit"
                                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-lg cursor-pointer transition-all border-0 outline-none"
                                      >
                                        Authorize Portal Entry
                                      </button>
                                    </div>
                                  </form>
                                )}

                                {loginStep === 'success' && (
                                  <div className="space-y-4 my-auto text-center animate-in zoom-in-95 duration-200">
                                    <div className="w-12 h-12 bg-emerald-950 text-emerald-400 border border-emerald-900 rounded-full flex items-center justify-center mx-auto shadow-sm">
                                      <Check className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-1">
                                      <h4 className="text-xs font-black text-white">SaaS Client Authorized</h4>
                                      <p className="text-[10px] text-slate-400 max-w-sm mx-auto">
                                        Single Sign-On authentication completed successfully. Safe routing tunnel opened to isolated PG-schema space.
                                      </p>
                                    </div>

                                    <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 space-y-1 text-left text-[8px] font-mono text-slate-400">
                                      <div><span className="text-slate-600">Client:</span> {currentTenant.name}</div>
                                      <div><span className="text-slate-600">Identity:</span> {loginEmail || `admin@${currentTenant.config.subdomain}.com`}</div>
                                      <div><span className="text-slate-600">Region IP:</span> 192.168.1.104 (White)</div>
                                      <div><span className="text-slate-600">MFA Token:</span> SECURE_RFC6238_VERIFIED</div>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={resetGatewaySimulator}
                                      className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded-lg transition-colors cursor-pointer border-0"
                                    >
                                      Reset Simulator Gate
                                    </button>
                                  </div>
                                )}

                              </div>
                            )}

                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* 4. DATA BACKUP & RESTORE TAB */}
                {activeTab === 'backup' && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                      <div className="space-y-0.5">
                        <span className="text-xs font-black text-slate-800 uppercase tracking-wide block">Client Data Backups</span>
                        <p className="text-[11px] text-slate-500">Scheduled automated backups occur daily at 02:00:00 UTC.</p>
                      </div>

                      <button
                        id="btn-trigger-manual-backup"
                        onClick={handleTriggerBackup}
                        disabled={isBackingUp}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold cursor-pointer hover:bg-slate-800 transition-colors shrink-0 disabled:opacity-40"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isBackingUp ? 'animate-spin' : ''}`} />
                        <span>{isBackingUp ? 'Backing Up...' : 'Create Backup'}</span>
                      </button>
                    </div>

                    {/* Active backup progress indicator */}
                    {isBackingUp && (
                      <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2.5 animate-in slide-in-from-top-3 duration-200">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-indigo-600 font-bold">Taking Client Snap Backup...</span>
                          <span className="font-semibold text-slate-700">{backupProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-indigo-600 h-full transition-all duration-300" style={{ width: `${backupProgress}%` }} />
                        </div>
                      </div>
                    )}

                    {/* Backups List Table */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-mono text-[10px] uppercase font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-3">Backup ID</th>
                            <th className="p-3">Triggered Date</th>
                            <th className="p-3">Size (MB)</th>
                            <th className="p-3">By</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {currentTenant.backups.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="text-center py-8 text-slate-400">No backup history available for this tenant.</td>
                            </tr>
                          ) : (
                            currentTenant.backups.map((bak) => (
                              <tr key={bak.id} className="hover:bg-slate-50/50">
                                <td className="p-3 font-mono text-slate-900 font-bold">{bak.id}</td>
                                <td className="p-3 text-slate-600 font-mono">{bak.timestamp}</td>
                                <td className="p-3 text-slate-600 font-mono">{bak.sizeMb} MB</td>
                                <td className="p-3 text-slate-600">{bak.triggeredBy}</td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                                    bak.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                    bak.status === 'Restored' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 font-bold' :
                                    'bg-rose-50 text-rose-700 border border-rose-100'
                                  }`}>
                                    {bak.status}
                                  </span>
                                </td>
                                <td className="p-3 text-right">
                                  <button
                                    id={`btn-restore-${bak.id}`}
                                    onClick={() => handleTriggerRestore(bak)}
                                    className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[11px] font-bold border border-indigo-200 cursor-pointer"
                                    title="Restore Active Client Schema state to this backup"
                                  >
                                    Restore
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 5. ANALYTICS & METRICS TAB */}
                {activeTab === 'analytics' && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wide block border-b border-slate-100 pb-2">Client Telemetry Metrics</span>
                    
                    {/* Metrics grid cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase font-mono font-bold">Active User Connections</span>
                        <div className="flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-indigo-600" />
                          <span className="text-base font-black text-slate-900">{usageStats.activeUsers}</span>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase font-mono font-bold">API Volume (24h)</span>
                        <div className="flex items-center gap-1.5">
                          <Activity className="w-4 h-4 text-indigo-600" />
                          <span className="text-base font-black text-slate-900 font-mono">{usageStats.apiRequestsCount.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase font-mono font-bold">Isolated storage space</span>
                        <div className="flex items-center gap-1.5">
                          <Database className="w-4 h-4 text-indigo-600" />
                          <span className="text-base font-black text-slate-900 font-mono">
                            {usageStats.dbStorageConsumedGb >= 1000 
                              ? `${(usageStats.dbStorageConsumedGb / 1024).toFixed(1)} TB` 
                              : `${usageStats.dbStorageConsumedGb} GB`}
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase font-mono font-bold">Active CDC Streams</span>
                        <div className="flex items-center gap-1.5">
                          <Cpu className="w-4 h-4 text-indigo-600" />
                          <span className="text-base font-black text-slate-900">{usageStats.activeCdcQueries}</span>
                        </div>
                      </div>
                    </div>

                    {/* Chart Containers */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      {/* API volume area chart */}
                      <div className="md:col-span-7 bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                        <span className="text-xs font-black text-slate-800 uppercase tracking-wide block mb-3">API Gateway Transactions Volume</span>
                        <div className="h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={getTrafficChartData()} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                              <defs>
                                <linearGradient id="requestsGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} />
                              <YAxis stroke="#94a3b8" fontSize={9} />
                              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                              <Area type="monotone" dataKey="requests" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#requestsGrad)" name="Requests/Hour" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Resource allocation bar chart */}
                      <div className="md:col-span-5 bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                        <span className="text-xs font-black text-slate-800 uppercase tracking-wide block mb-3">Resource Load vs Allocated Caps</span>
                        <div className="h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={getResourceChartData()} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} />
                              <YAxis stroke="#94a3b8" fontSize={9} domain={[0, 100]} />
                              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                              <Bar dataKey="Utilized" fill="#818cf8" radius={[4, 4, 0, 0]} name="Utility %" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                    {/* 24-Hour Resource Consumption Heatmap */}
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
                        <div className="space-y-1">
                          <span className="text-xs font-black text-slate-800 uppercase tracking-wide block">24-Hour Resource Consumption Heatmap</span>
                          <p className="text-[10px] text-slate-500 font-mono">Hourly load metrics over rolling diurnal lifecycle</p>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/80 rounded-lg p-1">
                            <button
                              type="button"
                              onClick={() => setHeatmapMetricFilter('all')}
                              className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                                heatmapMetricFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs border border-slate-200' : 'text-slate-500 hover:text-slate-900'
                              }`}
                            >
                              All
                            </button>
                            {['CPU', 'RAM', 'API', 'DB IOPS'].map(m => (
                              <button
                                key={m}
                                type="button"
                                onClick={() => setHeatmapMetricFilter(m as any)}
                                className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                                  heatmapMetricFilter === m ? 'bg-white text-slate-900 shadow-2xs border border-slate-200' : 'text-slate-500 hover:text-slate-900'
                                }`}
                              >
                                {m}
                              </button>
                            ))}
                          </div>

                          <button
                            type="button"
                            id="btn-simulate-spike"
                            onClick={() => setHeatmapSpikeActive(prev => !prev)}
                            className={`flex items-center gap-1 px-3 py-1.5 text-[10px] font-black uppercase rounded-lg border transition-all cursor-pointer ${
                              heatmapSpikeActive 
                                ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse' 
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <Sparkles className={`w-3 h-3 ${heatmapSpikeActive ? 'text-rose-600' : 'text-indigo-500'}`} />
                            <span>{heatmapSpikeActive ? 'Cancel Spike' : 'Simulate Spike'}</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
                        {/* Heatmap Grid (Left Column) */}
                        <div className="xl:col-span-8 space-y-4">
                          <div className="overflow-x-auto pb-2 scrollbar-thin">
                            <div className="min-w-[760px] space-y-2.5 select-none">
                              {/* Heatmap Header - Hour labels */}
                              <div className="flex text-[9px] font-mono text-slate-400 font-bold">
                                <div className="w-32 shrink-0" />
                                <div className="flex-1 grid gap-1" style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}>
                                  {Array.from({ length: 24 }).map((_, h) => (
                                    <div key={h} className="text-center truncate" title={`${h.toString().padStart(2, '0')}:00`}>
                                      {h.toString().padStart(2, '0')}h
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Heatmap Rows */}
                              {(() => {
                                const heatmapRows = [
                                  { name: 'CPU Utilization', icon: <Cpu className="w-3.5 h-3.5 text-indigo-500 shrink-0" /> },
                                  { name: 'RAM Allocation', icon: <Sliders className="w-3.5 h-3.5 text-indigo-500 shrink-0" /> },
                                  { name: 'API Throughput', icon: <Activity className="w-3.5 h-3.5 text-indigo-500 shrink-0" /> },
                                  { name: 'DB Write IOPS', icon: <Database className="w-3.5 h-3.5 text-indigo-500 shrink-0" /> }
                                ];
                                
                                const filteredHeatmapRows = heatmapMetricFilter === 'all'
                                  ? heatmapRows
                                  : heatmapRows.filter(r => {
                                      if (heatmapMetricFilter === 'CPU') return r.name === 'CPU Utilization';
                                      if (heatmapMetricFilter === 'RAM') return r.name === 'RAM Allocation';
                                      if (heatmapMetricFilter === 'API') return r.name === 'API Throughput';
                                      if (heatmapMetricFilter === 'DB IOPS') return r.name === 'DB Write IOPS';
                                      return true;
                                    });

                                return filteredHeatmapRows.map(row => {
                                  return (
                                    <div key={row.name} className="flex items-center">
                                      <div className="w-32 shrink-0 flex items-center gap-1.5 pr-2">
                                        {row.icon}
                                        <span className="text-[10px] font-bold text-slate-700 truncate" title={row.name}>{row.name}</span>
                                      </div>

                                      <div className="flex-1 grid gap-1" style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}>
                                        {Array.from({ length: 24 }).map((_, h) => {
                                          const val = getHeatmapCellValue(currentTenant?.id, row.name, h);
                                          const cellColor = getHeatmapCellColor(val, currentTenant?.branding?.themeColor);
                                          
                                          return (
                                            <div
                                              key={h}
                                              onMouseEnter={() => setHoveredHeatmapCell({ row: row.name, hour: h, value: val })}
                                              onMouseLeave={() => setHoveredHeatmapCell(null)}
                                              className={`aspect-square rounded-sm transition-all duration-150 cursor-crosshair border border-black/5 hover:border-black/30 hover:scale-110 ${cellColor}`}
                                              title={`${row.name} at ${h.toString().padStart(2, '0')}:00: ${val}%`}
                                            />
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                });
                              })()}
                            </div>
                          </div>

                          {/* Legend & Selected Cell Status */}
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[10px] bg-slate-50 border border-slate-150 rounded-lg p-2.5">
                            <div className="flex items-center gap-4">
                              <span className="font-bold text-slate-500 font-mono text-[9px]">LOAD INDEX:</span>
                              <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-1">
                                  <div className="w-2.5 h-2.5 bg-slate-100 border border-slate-200 rounded-xs" />
                                  <span className="text-slate-500 text-[9px] font-medium">Idle (&lt;25%)</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <div className="w-2.5 h-2.5 bg-indigo-200 border border-indigo-300 rounded-xs" />
                                  <span className="text-slate-500 text-[9px] font-medium">Moderate (25-50%)</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <div className="w-2.5 h-2.5 bg-indigo-400 border border-indigo-500 rounded-xs" />
                                  <span className="text-slate-500 text-[9px] font-medium">Elevated (50-75%)</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <div className="w-2.5 h-2.5 bg-indigo-600 border border-indigo-700 rounded-xs" />
                                  <span className="text-slate-500 text-[9px] font-medium">High (75-90%)</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <div className="w-2.5 h-2.5 bg-rose-500 border border-rose-600 rounded-xs" />
                                  <span className="text-slate-500 text-[9px] font-medium">Peak (&gt;90%)</span>
                                </div>
                              </div>
                            </div>

                            <div className="h-4 flex items-center justify-end font-mono">
                              {hoveredHeatmapCell ? (
                                <div className="text-slate-700 flex items-center gap-1">
                                  <span className="font-bold text-indigo-600">[{hoveredHeatmapCell.hour.toString().padStart(2, '0')}:00]</span>
                                  <span>{hoveredHeatmapCell.row}:</span>
                                  <span className={`font-black ${hoveredHeatmapCell.value > 90 ? 'text-rose-600 font-extrabold' : hoveredHeatmapCell.value > 75 ? 'text-amber-600' : 'text-slate-900'}`}>
                                    {hoveredHeatmapCell.value}%
                                  </span>
                                  <span className="text-slate-400 text-[9px]">
                                    ({hoveredHeatmapCell.value > 90 ? 'Critical Peak' : hoveredHeatmapCell.value > 75 ? 'Heavy Load' : hoveredHeatmapCell.value > 50 ? 'Optimal' : 'Light Load'})
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-[9px]">Hover cell to inspect system telemetry</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Optimization Insights Column */}
                        <div className="xl:col-span-4 bg-slate-50 border border-slate-200/60 p-4 rounded-xl flex flex-col justify-between space-y-4">
                          <div className="space-y-3">
                            <div className="flex items-center gap-1.5 border-b border-slate-200/50 pb-2">
                              <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                              <span className="text-xs font-black text-slate-800 uppercase tracking-wide">Optimization Diagnostics</span>
                            </div>

                            <div className="space-y-3.5">
                              {getHeatmapInsights(currentTenant?.id, currentTenant?.subscription?.tier).map((insight, idx) => (
                                <div key={idx} className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold border ${insight.badgeStyle}`}>
                                      {insight.badge}
                                    </span>
                                    <span className="text-[9px] font-mono text-slate-400">{insight.time}</span>
                                  </div>
                                  <p className="text-[11px] font-bold text-slate-800">{insight.title}</p>
                                  <p className="text-[10px] text-slate-500 leading-relaxed">{insight.description}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="border-t border-slate-200/50 pt-3 flex items-center justify-between text-[10px]">
                            <span className="text-slate-500 font-medium">Resource Health Index:</span>
                            <span className={`font-mono font-bold ${
                              heatmapSpikeActive ? 'text-rose-600 animate-pulse' : 'text-emerald-600'
                            }`}>
                              {heatmapSpikeActive ? 'WARNING (72/100)' : 'EXCELLENT (94/100)'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. PLAN BILLING TAB */}
                {activeTab === 'billing' && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                      <div className="space-y-0.5">
                        <span className="text-xs font-black text-slate-800 uppercase tracking-wide block">SaaS Subscription Plan</span>
                        <span className="text-slate-500 text-xs">Manage tiers, renewal states, and invoice histories.</span>
                      </div>

                      {/* Plan Changer dropdown */}
                      <div className="flex items-center gap-2">
                        <label htmlFor="tier-select-modifier" className="text-xs font-bold text-slate-600 shrink-0">Modify Tier:</label>
                        <select
                          id="tier-select-modifier"
                          value={currentTenant.subscription.tier}
                          onChange={(e) => handleUpdateSubscription({ tier: e.target.value as any })}
                          className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs outline-none cursor-pointer font-bold text-slate-800"
                        >
                          <option value="Free">Free Tier</option>
                          <option value="Standard">Standard ($300/mo)</option>
                          <option value="Professional">Professional ($650/mo)</option>
                          <option value="Enterprise">Enterprise ($1,200/mo)</option>
                        </select>
                      </div>
                    </div>

                    {/* Subscription Cards Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Current Plan Tier</span>
                        <span className="text-base font-black text-slate-900 block">{currentTenant.subscription.tier}</span>
                        <span className="text-xs font-mono font-bold text-indigo-600">
                          ${currentTenant.subscription.priceMonthly.toLocaleString()} / {currentTenant.subscription.billingCycle.toLowerCase()}
                        </span>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Next Renewal Scheduled</span>
                        <span className="text-base font-black text-slate-900 block font-mono">{currentTenant.subscription.nextRenewalDate}</span>
                        <span className="text-[10px] text-slate-400">Initiated on: {currentTenant.subscription.startDate}</span>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Renewal Preferences</span>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs font-semibold text-slate-700">Auto Renewal:</span>
                          <button
                            id="btn-toggle-auto-renew"
                            onClick={() => handleUpdateSubscription({ autoRenew: !currentTenant.subscription.autoRenew })}
                            className="focus:outline-none cursor-pointer"
                          >
                            {currentTenant.subscription.autoRenew ? (
                              <ToggleRight className="w-8 h-8 text-indigo-600" />
                            ) : (
                              <ToggleLeft className="w-8 h-8 text-slate-300" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* PROACTIVE BILLING FORECAST & BUDGET MANAGER */}
                    <div id="billing-forecast-manager" className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-5">
                      {/* Section Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-800 uppercase tracking-wide block">Predictive EOM Billing Forecast & Budget Controller</span>
                            <span className="bg-indigo-50 text-indigo-700 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-indigo-100 uppercase">Beta</span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-mono">Simulates real-time multi-dimensional billing runs by projecting current API load, compute profiles, and storage footprints</p>
                        </div>

                        {/* Export Action */}
                        <button
                          type="button"
                          id="btn-export-budget-advisory"
                          onClick={() => {
                            setIsExportingBudgetAdvisory(true);
                            setTimeout(() => {
                              setIsExportingBudgetAdvisory(false);
                              alert(`Successfully simulated budget report export for ${currentTenant.name}. Advisory PDF sent to admin inbox.`);
                            }, 1800);
                          }}
                          disabled={isExportingBudgetAdvisory}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white hover:bg-slate-800 transition-colors rounded-lg text-[10px] font-black uppercase cursor-pointer disabled:opacity-40 shrink-0"
                        >
                          {isExportingBudgetAdvisory ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                          <span>{isExportingBudgetAdvisory ? 'Exporting...' : 'Export Budget Advisory'}</span>
                        </button>
                      </div>

                      {/* Interactive Controls Bar */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 border border-slate-150 rounded-xl p-4">
                        {/* 1. Algorithm Selection */}
                        <div className="space-y-1.5">
                          <label htmlFor="forecast-model-select" className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Forecast Projection Model</label>
                          <select
                            id="forecast-model-select"
                            value={forecastModel}
                            onChange={(e) => setForecastModel(e.target.value as any)}
                            className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500/50 font-bold text-slate-700 cursor-pointer"
                          >
                            <option value="linear">Linear Trend (Standard Run-Rate)</option>
                            <option value="conservative">Conservative (Baseline Load)</option>
                            <option value="aggressive">Aggressive Peak (Peak Load Spike)</option>
                            <option value="seasonal">Seasonal Surge (Batch Processing)</option>
                          </select>
                        </div>

                        {/* 2. Growth Rate Slider */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <label htmlFor="growth-rate-slider" className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Expected Growth Factor</label>
                            <span className="text-[11px] font-mono font-bold text-indigo-600 bg-indigo-50/80 px-1.5 py-0.2 rounded">+{growthRate}%</span>
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-[9px] text-slate-400 font-mono">0%</span>
                            <input
                              id="growth-rate-slider"
                              type="range"
                              min="0"
                              max="100"
                              value={growthRate}
                              onChange={(e) => setGrowthRate(parseInt(e.target.value))}
                              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                            <span className="text-[9px] text-slate-400 font-mono">100%</span>
                          </div>
                        </div>

                        {/* 3. Budget Threshold Input */}
                        <div className="space-y-1.5">
                          <label htmlFor="budget-threshold-input" className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Client Monthly Budget Limit ($)</label>
                          <div className="relative rounded-lg shadow-2xs">
                            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 text-xs">$</div>
                            <input
                              id="budget-threshold-input"
                              type="number"
                              min="1"
                              value={budgetThresholds[currentTenant.id] || 1000}
                              onChange={(e) => {
                                const val = Math.max(1, parseInt(e.target.value) || 1);
                                setBudgetThresholds(prev => ({ ...prev, [currentTenant.id]: val }));
                              }}
                              className="w-full bg-white border border-slate-200 rounded-lg py-1.5 pl-6 pr-2.5 text-xs font-bold font-mono outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-800"
                            />
                          </div>
                        </div>

                        {/* 4. Active Overage Throttle */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Active Budget Defense</label>
                          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-1.5 px-2.5 h-[34px]">
                            <span className="text-[10px] text-slate-600 font-semibold truncate pr-1">Auto-Throttle Resources</span>
                            <button
                              type="button"
                              id="btn-toggle-auto-throttle"
                              onClick={() => {
                                setAutoThrottleEnabled(prev => ({ ...prev, [currentTenant.id]: !prev[currentTenant.id] }));
                              }}
                              className="focus:outline-none cursor-pointer"
                            >
                              {autoThrottleEnabled[currentTenant.id] ? (
                                <ToggleRight className="w-7 h-7 text-emerald-600" />
                              ) : (
                                <ToggleLeft className="w-7 h-7 text-slate-300" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Main Visual Panels Grid */}
                      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
                        
                        {/* Left: Recharts Line Chart (7 cols) */}
                        <div className="xl:col-span-7 border border-slate-200/80 rounded-xl p-4.5 space-y-3.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black text-slate-700 uppercase tracking-wide flex items-center gap-1">
                              <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                              Historical Trend & Predicted Trajectory
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">August billing cycle progress: 22.5%</span>
                          </div>

                          <div className="h-56">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart
                                data={getForecastChartData(currentTenant)}
                                margin={{ top: 5, right: 10, left: -25, bottom: 0 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} unit="$" />
                                <Tooltip
                                  contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
                                  formatter={(value: any, name: any) => [`$${value}`, name]}
                                />
                                <Legend wrapperStyle={{ fontSize: 9 }} verticalAlign="top" height={28} />
                                
                                {/* Historical / Actual Cost */}
                                <Line
                                  type="monotone"
                                  dataKey="Actual"
                                  stroke="#3b82f6"
                                  strokeWidth={3}
                                  dot={{ r: 4 }}
                                  activeDot={{ r: 6 }}
                                  name="Actual Invoice / Accrued"
                                />

                                {/* Forecast Cost */}
                                <Line
                                  type="monotone"
                                  dataKey="Forecast"
                                  stroke="#6366f1"
                                  strokeWidth={3}
                                  strokeDasharray="5 5"
                                  dot={{ r: 4 }}
                                  activeDot={{ r: 6 }}
                                  name="Predicted Run-Rate"
                                />

                                {/* Budget Reference Line */}
                                <Line
                                  type="monotone"
                                  dataKey="Budget"
                                  stroke="#ef4444"
                                  strokeWidth={2}
                                  strokeDasharray="3 3"
                                  dot={false}
                                  activeDot={false}
                                  name="Budget Cap Limit"
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Right: Surcharge & Budget Risk Breakdowns (5 cols) */}
                        {(() => {
                          const forecast = getBillingForecast(currentTenant);
                          return (
                            <div className="xl:col-span-5 bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col justify-between space-y-4">
                              
                              {/* Top Details & Breakdown */}
                              <div className="space-y-3">
                                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                  <span className="text-[10px] font-black text-slate-800 uppercase tracking-wide">EOM Surcharge Estimator</span>
                                  <span className="text-[10px] font-mono font-bold text-slate-500">Predicted Monthly cost</span>
                                </div>

                                <div className="space-y-2 text-xs">
                                  {/* Base tier cost */}
                                  <div className="flex justify-between items-center text-slate-600">
                                    <span>Plan Base Subscription:</span>
                                    <span className="font-mono font-bold text-slate-900">${forecast.baseFee.toLocaleString()}</span>
                                  </div>

                                  {/* Storage Surcharge */}
                                  <div className="flex justify-between items-start text-slate-600">
                                    <div className="space-y-0.5">
                                      <span>Storage Surcharge:</span>
                                      {forecast.overStorage > 0 ? (
                                        <p className="text-[9px] text-amber-600 font-mono">
                                          +{Math.round(forecast.overStorage)} GB over base {forecast.storageLimit} GB cap
                                        </p>
                                      ) : (
                                        <p className="text-[9px] text-slate-400">Within {forecast.storageLimit} GB allocated limit</p>
                                      )}
                                    </div>
                                    <span className="font-mono font-bold text-slate-900">${forecast.storageSurcharge.toLocaleString()}</span>
                                  </div>

                                  {/* API overage surcharge */}
                                  <div className="flex justify-between items-start text-slate-600">
                                    <div className="space-y-0.5">
                                      <span>API Gateway Overage:</span>
                                      {forecast.overApiRequests > 0 ? (
                                        <p className="text-[9px] text-amber-600 font-mono">
                                          +{Math.round(forecast.overApiRequests).toLocaleString()} hits over base {Math.round(forecast.apiLimit / 1000000)}M limit
                                        </p>
                                      ) : (
                                        <p className="text-[9px] text-slate-400">Within {Math.round(forecast.apiLimit / 1000000)}M base limit</p>
                                      )}
                                    </div>
                                    <span className="font-mono font-bold text-slate-900">${forecast.apiSurcharge.toLocaleString()}</span>
                                  </div>

                                  {/* Compute surcharge */}
                                  <div className="flex justify-between items-start text-slate-600">
                                    <div className="space-y-0.5">
                                      <span>Active Compute Overload:</span>
                                      <p className="text-[9px] text-slate-400">Derived from average diurnal RAM & CPU load spikes</p>
                                    </div>
                                    <span className="font-mono font-bold text-slate-900">${forecast.computeSurcharge.toLocaleString()}</span>
                                  </div>

                                  {/* Total Projections */}
                                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-sm font-black text-slate-800">
                                    <span>Total End of Month Cost:</span>
                                    <span className="font-mono font-black text-indigo-600 text-base">${forecast.totalPredictedCost.toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Alert Banner / Overage Defenses */}
                              <div className="space-y-3 pt-2">
                                {forecast.isOverBudget ? (
                                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex gap-2.5">
                                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                                    <div className="text-[10px] text-rose-950 space-y-1">
                                      <span className="font-black uppercase tracking-wider block">Budget Breach Risk!</span>
                                      <p className="leading-relaxed font-medium">
                                        Forecasted cost of <strong className="font-mono">${forecast.totalPredictedCost}</strong> exceeds the client limit of <strong className="font-mono">${forecast.threshold}</strong> by <strong className="font-mono">${forecast.totalPredictedCost - forecast.threshold}</strong> ({forecast.percentOfBudget}% capacity).
                                      </p>
                                      {autoThrottleEnabled[currentTenant.id] && (
                                        <p className="text-emerald-700 font-bold flex items-center gap-1 mt-1 font-mono">
                                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                                          BUDGET DEFENSE ACTIVE: CPU allocations scaled -15% & backup streams optimized.
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex gap-2.5">
                                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                    <div className="text-[10px] text-emerald-950 space-y-0.5">
                                      <span className="font-black uppercase tracking-wider block">Budget Health Optimal</span>
                                      <p className="leading-relaxed font-semibold">
                                        On-track. Projected budget usage is at <strong className="font-mono">{forecast.percentOfBudget}%</strong> capacity. Client has <strong className="font-mono">${forecast.threshold - forecast.totalPredictedCost}</strong> margin remaining.
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {/* Interactive Action Buttons */}
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    id="btn-apply-resource-optimizer"
                                    onClick={() => {
                                      setOptimizationApplied(prev => ({ ...prev, [currentTenant.id]: !prev[currentTenant.id] }));
                                    }}
                                    className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 text-[10px] font-black uppercase rounded-lg border transition-all cursor-pointer ${
                                      optimizationApplied[currentTenant.id]
                                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                    }`}
                                  >
                                    <Sparkles className="w-3 h-3 text-indigo-500" />
                                    <span>{optimizationApplied[currentTenant.id] ? 'Optimization Applied' : 'Apply Resource Optimizer'}</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Advisory & Recommendation section */}
                      <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-3">
                        <div className="flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
                          <Info className="w-3.5 h-3.5 text-indigo-600" />
                          <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider block">Partner Advisory Recommendations & Actionables</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div className="space-y-1">
                            <span className="font-bold text-slate-800">Cost Containment Suggestion:</span>
                            <p className="text-slate-500 leading-relaxed text-[11px]">
                              {currentTenant.subscription.tier === 'Starter' && "Initech's data backups and standard peak load cycles indicate significant DB transaction spikes. Upgrading Initech Solutions to the Professional tier would provide 50 GB extra storage and cut API overage rates, reducing predicted surcharge ratios by $45/mo."}
                              {currentTenant.subscription.tier === 'Professional' && "Globex's high multi-region concurrency creates peak RAM allocation spikes. Activating a 2-node cluster standby rather than single high-availability node during low-load intervals (22:00 to 05:00 UTC) would shave an estimated $60 off the next billing run."}
                              {currentTenant.subscription.tier === 'Enterprise' && `Acme's usage of ${Math.round(usageStats.dbStorageConsumedGb)} GB out of ${currentTenant.resources.storageGb} GB is approaching high saturation limits. Request the client schedule an older tenant schema audit or upgrade to a dedicated high-capacity block pool to preempt storage overage surcharges.`}
                              {currentTenant.subscription.tier === 'Trial' && "This tenant is currently on the Free tier. The forecast is constrained by tight system resource limits. Upgrading to Standard is recommended."}
                            </p>
                          </div>

                          <div className="space-y-1">
                            <span className="font-bold text-slate-800">Dynamic Risk Evaluation:</span>
                            <p className="text-slate-500 leading-relaxed text-[11px]">
                              The partner budget alerts show that {currentTenant.name} is classified as a <strong className={getBillingForecast(currentTenant).isOverBudget ? 'text-rose-600' : 'text-emerald-600'}>{getBillingForecast(currentTenant).isOverBudget ? 'HIGH RISK' : 'LOW RISK'}</strong> budget category.
                              {autoThrottleEnabled[currentTenant.id] 
                                ? ' Auto-Defense throttle is ARMED: resource pools will automatically restrict database IOPS burst capacity to 110% of the normal limits if predicted consumption breaches budget bounds.'
                                : ' Consider arming the Auto-Defense throttle toggle above to prevent client billing surprises through automatic compute load consolidation.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Invoice Lists */}
                    <div className="space-y-3">
                      <span className="text-xs font-black text-slate-800 uppercase tracking-wide block">Invoice Billing Records</span>
                      
                      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-500 font-mono text-[10px] uppercase font-bold border-b border-slate-200">
                            <tr>
                              <th className="p-3">Invoice Number</th>
                              <th className="p-3">Billing Date</th>
                              <th className="p-3">Amount</th>
                              <th className="p-3">Payment Method</th>
                              <th className="p-3">Billing Status</th>
                              <th className="p-3 text-right">Download</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium">
                            {currentTenant.invoices.map((inv) => (
                              <tr key={inv.id} className="hover:bg-slate-50/50">
                                <td className="p-3 font-mono text-slate-900 font-bold">{inv.id}</td>
                                <td className="p-3 text-slate-600 font-mono">{inv.date}</td>
                                <td className="p-3 text-slate-900 font-bold font-mono">${inv.amount.toLocaleString()}</td>
                                <td className="p-3 text-slate-500 font-mono text-[11px]">{inv.paymentMethod}</td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                                    inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                    inv.status === 'Pending' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                    'bg-rose-50 text-rose-700 border border-rose-100'
                                  }`}>
                                    {inv.status}
                                  </span>
                                </td>
                                <td className="p-3 text-right">
                                  <button
                                    id={`btn-download-inv-${inv.id}`}
                                    onClick={() => alert(`Downloading Invoice ${inv.id} PDF...`)}
                                    className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                                    title="Download Invoice PDF"
                                  >
                                    <Download className="w-4 h-4 mx-auto" />
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

                {/* 7. BULK MIGRATION TAB */}
                {activeTab === 'migration' && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="bg-indigo-50 border border-indigo-100 p-4.5 rounded-xl flex items-start gap-3">
                      <RefreshCw className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5 animate-spin-slow" />
                      <div className="text-xs text-indigo-900 space-y-1">
                        <span className="font-bold">Bulk Shared Pool Migration Engine</span>
                        <p className="text-indigo-700 leading-relaxed">
                          Admins can realign tenant storage and compute boundaries by moving multiple client schemas simultaneously between virtual resource pools/database clusters. Under the hood, this automates read-only fencing, pg_dump/pg_restore streams, incremental WAL catchup, and dynamic DNS hot-swaps.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Left: Configuration & Tenant Selector */}
                      <div className="space-y-6">
                        {/* 1. Job Config Card */}
                        <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-200/60 space-y-4">
                          <span className="text-xs font-black text-slate-800 uppercase tracking-wide block border-b border-slate-100 pb-2">1. Migration Job Scope</span>
                          
                          <div className="space-y-3 text-xs">
                            {/* Source pool selection */}
                            <div className="space-y-1">
                              <label htmlFor="source-pool-select" className="font-bold text-slate-600">Source Cluster Resource Pool:</label>
                              <select
                                id="source-pool-select"
                                disabled={isBulkMigrating}
                                value={selectedMigrateSourcePool}
                                onChange={(e) => setSelectedMigrateSourcePool(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono text-xs text-slate-800 outline-none cursor-pointer"
                              >
                                {Array.from(new Set(tenants.map(t => t.config.dbClusterHost))).map(pool => (
                                  <option key={pool} value={pool}>{pool} ({tenants.filter(t => t.config.dbClusterHost === pool).length} Tenants)</option>
                                ))}
                              </select>
                            </div>

                            {/* Target pool selection */}
                            <div className="space-y-1">
                              <label htmlFor="target-pool-select" className="font-bold text-slate-600">Target Shared Resource Pool:</label>
                              <select
                                id="target-pool-select"
                                disabled={isBulkMigrating}
                                value={selectedMigrateTargetPool}
                                onChange={(e) => setSelectedMigrateTargetPool(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono text-xs text-slate-800 outline-none cursor-pointer"
                              >
                                {[
                                  'db-us-east-highmem-1a.cluster.edimp.internal',
                                  'db-us-east-v17-01.cluster.edimp.internal',
                                  'db-eu-central-highmem-1b.cluster.edimp.internal',
                                  'db-ap-south-highmem-1a.cluster.edimp.internal',
                                  'db-premium-shared-01.cluster.edimp.internal'
                                ].map(pool => (
                                  <option key={pool} value={pool}>{pool}</option>
                                ))}
                              </select>
                            </div>

                            {/* Migration Type selection */}
                            <div className="space-y-1">
                              <label htmlFor="migrate-type-select" className="font-bold text-slate-600">Migration Task Type:</label>
                              <select
                                id="migrate-type-select"
                                disabled={isBulkMigrating}
                                value={selectedMigrateType}
                                onChange={(e) => setSelectedMigrateType(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 outline-none cursor-pointer font-bold"
                              >
                                <option value="Schema Update">Schema Update & Extension Deployments</option>
                                <option value="Cluster Realignment">Cluster Realignment (Load Balancing)</option>
                                <option value="PostgreSQL Version Upgrade">Major PostgreSQL Engine Upgrade (v16 ➔ v17)</option>
                                <option value="Regional Failover">Regional Failover & DR Redundancy Rollout</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* 2. Tenant Checklist Card */}
                        <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-200/60 space-y-3.5">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <span className="text-xs font-black text-slate-800 uppercase tracking-wide">2. Target Tenant Group</span>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                disabled={isBulkMigrating}
                                onClick={() => {
                                  const poolTenantIds = tenants.filter(t => t.config.dbClusterHost === selectedMigrateSourcePool).map(t => t.id);
                                  setSelectedTenantIdsForMigration(poolTenantIds);
                                }}
                                className="text-[10px] bg-slate-200/80 hover:bg-slate-200 font-bold px-2 py-0.5 rounded text-slate-700 cursor-pointer"
                              >
                                Select All
                              </button>
                              <button
                                type="button"
                                disabled={isBulkMigrating}
                                onClick={() => setSelectedTenantIdsForMigration([])}
                                className="text-[10px] bg-slate-200/80 hover:bg-slate-200 font-bold px-2 py-0.5 rounded text-slate-700 cursor-pointer"
                              >
                                Clear
                              </button>
                            </div>
                          </div>

                          <div className="space-y-2 max-h-52 overflow-y-auto scrollbar-thin">
                            {tenants.filter(t => t.config.dbClusterHost === selectedMigrateSourcePool).length === 0 ? (
                              <p className="text-[11px] text-slate-400 italic py-2 text-center">No tenants currently reside on this source pool.</p>
                            ) : (
                              tenants.filter(t => t.config.dbClusterHost === selectedMigrateSourcePool).map(t => {
                                const isChecked = selectedTenantIdsForMigration.includes(t.id);
                                return (
                                  <label
                                    key={t.id}
                                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                                      isChecked 
                                        ? 'bg-white border-indigo-200 shadow-2xs' 
                                        : 'bg-white/40 border-slate-200/60 opacity-70'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <input
                                        type="checkbox"
                                        disabled={isBulkMigrating}
                                        checked={isChecked}
                                        onChange={() => {
                                          setSelectedTenantIdsForMigration(prev => 
                                            prev.includes(t.id) ? prev.filter(id => id !== t.id) : [...prev, t.id]
                                          );
                                        }}
                                        className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                      />
                                      <div className="space-y-0.5">
                                        <p className="font-bold text-slate-800">{t.name}</p>
                                        <p className="text-[10px] font-mono text-slate-400">{t.config.subdomain}.edimp.com</p>
                                      </div>
                                    </div>
                                    <div className="text-right space-y-0.5">
                                      <span className={`px-1.5 py-0.5 text-[9px] rounded font-mono font-bold ${
                                        t.subscription.tier === 'Enterprise' ? 'bg-indigo-50 text-indigo-700' :
                                        t.subscription.tier === 'Professional' ? 'bg-emerald-50 text-emerald-700' :
                                        'bg-slate-100 text-slate-700'
                                      }`}>
                                        {t.subscription.tier}
                                      </span>
                                      <p className="text-[10px] font-mono text-slate-505 font-bold">{t.resources.storageGb} GB Space</p>
                                    </div>
                                  </label>
                                );
                              })
                            )}
                          </div>
                        </div>

                        {/* Pre-Flight & Migration Trigger Control Center */}
                        <div className="space-y-4 pt-1" id="migration-execution-controls">
                          {selectedTenantIdsForMigration.length > 0 && (
                            <div className={`p-4 rounded-xl border transition-all duration-200 text-left ${
                              preFlightStatus === 'passed' ? 'bg-emerald-50/40 border-emerald-200 shadow-3xs' :
                              preFlightStatus === 'warning' ? 'bg-amber-50/40 border-amber-200 shadow-3xs' :
                              preFlightStatus === 'scanning' ? 'bg-indigo-50/30 border-indigo-200 ring-2 ring-indigo-50/50' :
                              'bg-slate-50 border-slate-200/80'
                            }`}>
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100/80">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider">Migration Health Check</span>
                                    {preFlightStatus === 'passed' && (
                                      <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md flex items-center gap-0.5 border border-emerald-200">
                                        <CheckCircle className="w-2.5 h-2.5" /> PASSED
                                      </span>
                                    )}
                                    {preFlightStatus === 'warning' && (
                                      <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-md flex items-center gap-0.5 border border-amber-200">
                                        <AlertTriangle className="w-2.5 h-2.5" /> WARNING
                                      </span>
                                    )}
                                    {preFlightStatus === 'scanning' && (
                                      <span className="text-[9px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                                        <RefreshCw className="w-2.5 h-2.5 animate-spin" /> SCANNING...
                                      </span>
                                    )}
                                    {preFlightStatus === 'idle' && (
                                      <span className="text-[9px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded border border-slate-200">
                                        PENDING SCAN
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-slate-400">
                                    Runs validation tests on database sockets & schema constraints before execution.
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  id="btn-run-preflight-check"
                                  disabled={isBulkMigrating || isPreFlightScanning}
                                  onClick={handlePreFlightCheck}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all duration-150 flex items-center gap-1.5 shrink-0 ${
                                    isPreFlightScanning
                                      ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                                      : preFlightStatus === 'passed'
                                      ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/60 cursor-pointer'
                                      : preFlightStatus === 'warning'
                                      ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/60 cursor-pointer'
                                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer'
                                  }`}
                                >
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  <span>{preFlightStatus === 'idle' ? 'Run Pre-Flight Check' : 'Re-run Scan'}</span>
                                </button>
                              </div>

                              {/* Terminal scan logs display */}
                              {isPreFlightScanning && (
                                <div className="mt-3 bg-slate-950 font-mono text-[9px] text-indigo-400 p-3 rounded-lg border border-slate-800 space-y-1.5 max-h-[110px] overflow-y-auto scrollbar-thin">
                                  {preFlightLogs.map((log, idx) => (
                                    <div key={idx} className="leading-relaxed font-semibold">{log}</div>
                                  ))}
                                </div>
                              )}

                              {/* High-fidelity compliance results cards */}
                              {preFlightResults && !isPreFlightScanning && (
                                <div className="mt-3 space-y-3 animate-in slide-in-from-top-1 duration-200">
                                  {/* Quick criteria overview */}
                                  <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-semibold">
                                    <div className="bg-white p-2 rounded-lg border border-slate-200/60 space-y-0.5">
                                      <span className="text-slate-400 uppercase font-bold font-mono text-[8px] block">Source Connections</span>
                                      <span className="text-emerald-600 font-extrabold flex items-center justify-center gap-1">
                                        <CheckCircle className="w-3 h-3 text-emerald-500" /> Active
                                      </span>
                                    </div>
                                    <div className="bg-white p-2 rounded-lg border border-slate-200/60 space-y-0.5">
                                      <span className="text-slate-400 uppercase font-bold font-mono text-[8px] block">Schema Parity</span>
                                      {preFlightResults.schemaParityOk ? (
                                        <span className="text-emerald-600 font-extrabold flex items-center justify-center gap-1">
                                          <CheckCircle className="w-3 h-3 text-emerald-500" /> 100% Match
                                        </span>
                                      ) : (
                                        <span className="text-amber-600 font-extrabold flex items-center justify-center gap-1">
                                          <AlertTriangle className="w-3 h-3 text-amber-500" /> Warning
                                        </span>
                                      )}
                                    </div>
                                    <div className="bg-white p-2 rounded-lg border border-slate-200/60 space-y-0.5">
                                      <span className="text-slate-400 uppercase font-bold font-mono text-[8px] block">Target Overhead</span>
                                      <span className="text-emerald-600 font-extrabold flex items-center justify-center gap-1">
                                        <CheckCircle className="w-3 h-3 text-emerald-500" /> Sufficient
                                      </span>
                                    </div>
                                  </div>

                                  {/* Individual tenant scorecard details */}
                                  <div className="bg-white/60 rounded-lg border border-slate-200/50 p-2.5 space-y-2">
                                    <span className="text-[8px] uppercase font-bold text-slate-400 font-mono block">Tenant Test Reports</span>
                                    <div className="divide-y divide-slate-100 text-[10px] font-medium max-h-[140px] overflow-y-auto scrollbar-thin">
                                      {preFlightResults.details.map((det, idx) => (
                                        <div key={idx} className="py-2 flex items-start justify-between gap-3">
                                          <div className="space-y-0.5">
                                            <p className="font-extrabold text-slate-800 leading-none">{det.tenantName}</p>
                                            <p className="text-[9px] text-slate-500 font-medium leading-normal">{det.schemaParity}</p>
                                          </div>
                                          <div className="text-right shrink-0">
                                            <span className={`px-1.5 py-0.5 text-[8px] uppercase font-mono font-bold rounded ${
                                              det.status === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                                            }`}>
                                              {det.status === 'success' ? 'Ready' : 'Warning'}
                                            </span>
                                            <p className="text-[8px] font-mono text-slate-400 mt-0.5">{det.connectivity}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Trigger button */}
                          <button
                            type="button"
                            id="btn-trigger-bulk-migrate"
                            disabled={isBulkMigrating || selectedTenantIdsForMigration.length === 0}
                            onClick={handleStartBulkMigration}
                            className={`w-full py-3.5 px-4 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-sm ${
                              isBulkMigrating 
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
                                : selectedTenantIdsForMigration.length === 0
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-dashed border-slate-200'
                                : preFlightStatus === 'passed'
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-98 shadow-xs'
                                : preFlightStatus === 'warning'
                                ? 'bg-amber-600 hover:bg-amber-700 text-white cursor-pointer active:scale-98 shadow-xs'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer active:scale-98 shadow-xs'
                            }`}
                          >
                            <RefreshCw className={`w-4 h-4 ${isBulkMigrating ? 'animate-spin' : ''}`} />
                            <span>
                              {isBulkMigrating 
                                ? `Executing Concurrent Migrations (${bulkMigrationProgress}%)` 
                                : preFlightStatus === 'passed'
                                ? `Deploy Pre-Verified Migration (${selectedTenantIdsForMigration.length} Tenants)`
                                : preFlightStatus === 'warning'
                                ? `Proceed with Migration with Warnings (${selectedTenantIdsForMigration.length} Tenants)`
                                : `Trigger Simultaneous Migration For ${selectedTenantIdsForMigration.length} Tenants`
                              }
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Right: Monitoring Console & History */}
                      <div className="space-y-6">
                        {/* Progress Panel */}
                        <div className="border border-slate-200/80 rounded-xl p-4.5 bg-slate-50/50 space-y-4">
                          <span className="text-xs font-black text-slate-800 uppercase tracking-wide block border-b border-slate-100 pb-2">
                            Job Status & Live CDC Console
                          </span>

                          {isBulkMigrating ? (
                            <div className="space-y-4 animate-in fade-in">
                              <div className="space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="font-bold text-indigo-600 font-mono">CONCURRENT PIPELINE EXECUTING</span>
                                  <span className="font-mono font-bold text-slate-700">{bulkMigrationProgress}%</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                  <div className="bg-indigo-600 h-full transition-all duration-300" style={{ width: `${bulkMigrationProgress}%` }} />
                                </div>
                              </div>

                              <div className="bg-slate-950 text-emerald-400 font-mono text-[10px] p-4 rounded-xl h-64 overflow-y-auto space-y-1.5 scrollbar-thin border border-slate-800 select-all">
                                {bulkMigrationLogs.map((log, idx) => (
                                  <div key={idx} className="leading-relaxed">
                                    {log}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="bg-white p-6 rounded-xl border border-slate-200/60 text-center space-y-3">
                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                                  <RefreshCw className="w-5 h-5" />
                                </div>
                                <div className="space-y-1">
                                  <p className="font-bold text-xs text-slate-800">No active migration task in pool</p>
                                  <p className="text-[11px] text-slate-500 leading-normal max-w-xs mx-auto">
                                    Select target tenants on the left, configure target clusters, and trigger the synchronized deployment pipeline.
                                  </p>
                                </div>
                              </div>

                              {bulkMigrationLogs.length > 0 && (
                                <div className="space-y-2">
                                  <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Previous Run Output Logs</span>
                                  <div className="bg-slate-900 text-slate-300 font-mono text-[9px] p-3 rounded-lg h-32 overflow-y-auto space-y-1 scrollbar-thin">
                                    {bulkMigrationLogs.slice(-10).map((log, idx) => (
                                      <div key={idx} className="truncate">{log}</div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Recent History Table */}
                        <div className="space-y-3">
                          <span className="text-xs font-black text-slate-800 uppercase tracking-wide block">Recent Migration Audits</span>
                          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
                            <table className="w-full text-left text-[11px]">
                              <thead className="bg-slate-50 text-slate-500 font-mono text-[10px] uppercase font-bold border-b border-slate-200">
                                <tr>
                                  <th className="p-2.5">Job ID</th>
                                  <th className="p-2.5">Type & Pools</th>
                                  <th className="p-2.5 text-center">Tenants</th>
                                  <th className="p-2.5">Timestamp</th>
                                  <th className="p-2.5 text-right">State</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 font-medium">
                                {bulkMigrationHistory.map((hist) => (
                                  <tr key={hist.id} className="hover:bg-slate-50/50">
                                    <td className="p-2.5 font-mono text-slate-900 font-bold">{hist.id}</td>
                                    <td className="p-2.5 space-y-0.5">
                                      <p className="font-bold text-slate-800">{hist.type}</p>
                                      <p className="text-[9px] text-slate-400 font-mono">
                                        {hist?.sourcePool ? hist.sourcePool.split('.')[0] : ''} ➔ {hist?.targetPool ? hist.targetPool.split('.')[0] : ''}
                                      </p>
                                    </td>
                                    <td className="p-2.5 text-center">
                                      <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded font-bold" title={hist.tenantsMigratedNames}>
                                        {hist.tenantsMigratedCount}
                                      </span>
                                    </td>
                                    <td className="p-2.5 text-slate-600 font-mono">{hist.timestamp}</td>
                                    <td className="p-2.5 text-right">
                                      <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                        {hist.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 8. AUDIT LOG TAB */}
                {activeTab === 'audit' && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3">
                      <Shield className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                      <div className="text-xs text-slate-600 space-y-1">
                        <span className="font-bold text-slate-800">SOC2 Compliance & Administrative Audit Trail</span>
                        <p className="leading-relaxed">
                          This is a cryptographic, immutable audit ledger containing tenant-level configurations, provisioning events, backup copies, and user permission modifications. This ledger provides robust, real-time security traceability for internal compliance officers and SOC2 verification assessors.
                        </p>
                      </div>
                    </div>

                    {/* Simulation & Filter Controls Bar */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                      
                      {/* Left: Audit Filter & Search (7 cols) */}
                      <div className="lg:col-span-7 space-y-4">
                        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3.5 shadow-2xs">
                          <span className="text-[10px] uppercase font-black text-slate-800 tracking-wide font-mono block">Filter Trail Ledgers</span>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {/* Search */}
                            <div className="sm:col-span-1 relative">
                              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                              <input
                                id="audit-trail-search-input"
                                type="text"
                                placeholder="Search action, actor, details..."
                                value={auditSearch}
                                onChange={(e) => setAuditSearch(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 pl-8 pr-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500/50"
                              />
                            </div>

                            {/* Category select */}
                            <div>
                              <select
                                id="audit-trail-category-select"
                                value={auditCategory}
                                onChange={(e) => setAuditCategory(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500/50 font-bold text-slate-700 cursor-pointer"
                              >
                                <option value="All">All Categories</option>
                                <option value="Provisioning">Provisioning</option>
                                <option value="Configuration">Configuration</option>
                                <option value="Security">Security</option>
                                <option value="Billing">Billing</option>
                                <option value="Backup">Backup</option>
                              </select>
                            </div>

                            {/* Severity select */}
                            <div>
                              <select
                                id="audit-trail-severity-select"
                                value={auditSeverity}
                                onChange={(e) => setAuditSeverity(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500/50 font-bold text-slate-700 cursor-pointer"
                              >
                                <option value="All">All Severities</option>
                                <option value="Info">Info</option>
                                <option value="Success">Success</option>
                                <option value="Warning">Warning</option>
                                <option value="Danger">Danger</option>
                              </select>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                            <span className="text-[10px] text-slate-400 font-mono">
                              Showing {
                                ((auditLogs[selectedTenantId] || []).filter(log => {
                                  const matchesSearch = log.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
                                                        log.actor.toLowerCase().includes(auditSearch.toLowerCase()) ||
                                                        log.description.toLowerCase().includes(auditSearch.toLowerCase());
                                  const matchesCat = auditCategory === 'All' || log.category === auditCategory;
                                  const matchesSev = auditSeverity === 'All' || log.severity === auditSeverity;
                                  return matchesSearch && matchesCat && matchesSev;
                                })).length
                              } audit events
                            </span>

                            <button
                              id="btn-export-audit-json"
                              type="button"
                              onClick={handleExportAuditLogs}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-black uppercase cursor-pointer transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Export JSON Ledger</span>
                            </button>
                          </div>
                        </div>

                        {/* Chronological Timeline list */}
                        <div className="space-y-3.5 max-h-[480px] overflow-y-auto pr-1 scrollbar-thin">
                          {(() => {
                            const filtered = (auditLogs[selectedTenantId] || []).filter(log => {
                              const matchesSearch = log.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
                                                    log.actor.toLowerCase().includes(auditSearch.toLowerCase()) ||
                                                    log.description.toLowerCase().includes(auditSearch.toLowerCase());
                              const matchesCat = auditCategory === 'All' || log.category === auditCategory;
                              const matchesSev = auditSeverity === 'All' || log.severity === auditSeverity;
                              return matchesSearch && matchesCat && matchesSev;
                            });

                            if (filtered.length === 0) {
                              return (
                                <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-8 text-center space-y-3">
                                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                                    <FileText className="w-5 h-5" />
                                  </div>
                                  <div className="space-y-1">
                                    <p className="font-bold text-xs text-slate-800">No matching audit events found</p>
                                    <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                                      Try clearing your search query or relaxing your Category and Severity filter scopes.
                                    </p>
                                  </div>
                                </div>
                              );
                            }

                            return filtered.map((log) => {
                              // Color maps
                              const sevBadgeColors = {
                                Info: 'bg-indigo-50 text-indigo-700 border-indigo-150',
                                Success: 'bg-emerald-50 text-emerald-700 border-emerald-150',
                                Warning: 'bg-amber-50 text-amber-700 border-amber-150',
                                Danger: 'bg-rose-50 text-rose-700 border-rose-150'
                              };

                              const catBadgeColors = {
                                Provisioning: 'bg-purple-50 text-purple-700 border-purple-100',
                                Configuration: 'bg-sky-50 text-sky-700 border-sky-100',
                                Security: 'bg-slate-100 text-slate-700 border-slate-200',
                                Billing: 'bg-teal-50 text-teal-700 border-teal-100',
                                Backup: 'bg-pink-50 text-pink-700 border-pink-100'
                              };

                              return (
                                <div key={log.id} className="bg-white border border-slate-200/80 rounded-xl p-4 space-y-2.5 shadow-2xs hover:border-slate-300 transition-colors">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border uppercase tracking-wider ${sevBadgeColors[log.severity]}`}>
                                        {log.severity}
                                      </span>
                                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border uppercase tracking-wider ${catBadgeColors[log.category]}`}>
                                        {log.category}
                                      </span>
                                      <h4 className="font-bold text-slate-800 text-xs">{log.action}</h4>
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-mono">{log.timestamp}</span>
                                  </div>

                                  <p className="text-slate-600 text-[11px] leading-relaxed">
                                    {log.description}
                                  </p>

                                  <div className="flex items-center justify-between pt-1 border-t border-slate-100/60 text-[10px] text-slate-400">
                                    <span>Actor: <strong className="font-semibold text-slate-600">{log.actor}</strong></span>
                                    <span className="font-mono text-[9px]">ID: {log.id}</span>
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>

                      {/* Right: Simulate Audit Event Form (5 cols) */}
                      <div className="lg:col-span-5 space-y-4">
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4.5 space-y-4">
                          <div className="border-b border-slate-200 pb-2.5">
                            <span className="text-xs font-black text-slate-800 uppercase tracking-wide block">Simulate Compliance Audit Event</span>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">Allows platform and security officers to manually log key system updates for regulatory compliance</p>
                          </div>

                          <form onSubmit={handleSimulateAuditEvent} className="space-y-3.5 text-xs">
                            {/* Action field */}
                            <div className="space-y-1.5">
                              <label htmlFor="sim-action" className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Logged Event Action</label>
                              <input
                                id="sim-action"
                                type="text"
                                required
                                placeholder="e.g. Identity Firewall Updated"
                                value={simAction}
                                onChange={(e) => setSimAction(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 outline-none focus:ring-2 focus:ring-indigo-500/50"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              {/* Category select */}
                              <div className="space-y-1.5">
                                <label htmlFor="sim-category" className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Category</label>
                                <select
                                  id="sim-category"
                                  value={simCategory}
                                  onChange={(e) => setSimCategory(e.target.value as any)}
                                  className="w-full bg-white border border-slate-200 rounded-lg py-2 px-2.5 text-xs outline-none font-bold text-slate-700 cursor-pointer"
                                >
                                  <option value="Provisioning">Provisioning</option>
                                  <option value="Configuration">Configuration</option>
                                  <option value="Security">Security</option>
                                  <option value="Billing">Billing</option>
                                  <option value="Backup">Backup</option>
                                </select>
                              </div>

                              {/* Severity select */}
                              <div className="space-y-1.5">
                                <label htmlFor="sim-severity" className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Severity</label>
                                <select
                                  id="sim-severity"
                                  value={simSeverity}
                                  onChange={(e) => setSimSeverity(e.target.value as any)}
                                  className="w-full bg-white border border-slate-200 rounded-lg py-2 px-2.5 text-xs outline-none font-bold text-slate-700 cursor-pointer"
                                >
                                  <option value="Info">Info</option>
                                  <option value="Success">Success</option>
                                  <option value="Warning">Warning</option>
                                  <option value="Danger">Danger</option>
                                </select>
                              </div>
                            </div>

                            {/* Description field */}
                            <div className="space-y-1.5">
                              <label htmlFor="sim-desc" className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Detailed Log Description</label>
                              <textarea
                                id="sim-desc"
                                required
                                rows={3}
                                placeholder="State exact config shifts, SSO paths, hardware resizing outcomes, or authorization details..."
                                value={simDescription}
                                onChange={(e) => setSimDescription(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none leading-relaxed"
                              />
                            </div>

                            {/* Trigger Button */}
                            <button
                              type="submit"
                              id="btn-submit-simulation"
                              disabled={isSimulatingAudit}
                              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                                isSimulatingAudit 
                                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                                  : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-98 shadow-xs'
                              }`}
                            >
                              <ShieldCheck className="w-4 h-4" />
                              <span>{isSimulatingAudit ? 'Logging Event...' : 'Inject Secure Audit Log'}</span>
                            </button>
                          </form>
                        </div>

                        <div className="bg-indigo-50/60 border border-indigo-150 p-4 rounded-xl space-y-2 text-[11px] text-indigo-950">
                          <span className="font-black uppercase tracking-wider block">Automatic Ledger Triggers</span>
                          <p className="leading-relaxed">
                            Note: Any structural parameters updated in other details sub-tabs (such as <strong className="font-semibold text-indigo-900">Resource Allocation</strong> or <strong className="font-semibold text-indigo-900">Branding & Config</strong>) automatically stream logs to this ledger in real-time. Try making a slider adjustment or changing branding to witness full automated synchronization!
                          </p>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* 9. RESOURCE COMPARISON TAB */}
                {activeTab === 'comparison' && (
                  <div className="space-y-6 animate-in fade-in duration-200" id="resource-comparison-tab-container">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3">
                      <TrendingUp className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                      <div className="text-xs text-slate-600 space-y-1">
                        <span className="font-bold text-slate-800">Cross-Tenant Capacity & Quota Compliance Dashboard</span>
                        <p className="leading-relaxed">
                          This management interface aggregates allocated virtual machine caps and storage limits across all provisioned client tenants. Use this control center to analyze capacity bottlenecks, simulate real-time workflow spikes, and execute automatic elastic quota optimizations.
                        </p>
                      </div>
                    </div>

                    {/* Chart & Control Filtering Header */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-2xs space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-black text-slate-800 tracking-wide font-mono block">Quota Metric Selection</span>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {(['cpu', 'ram', 'storage', 'api'] as const).map((m) => {
                              const labelMap = {
                                cpu: 'Compute (vCPUs)',
                                ram: 'Memory (RAM GB)',
                                storage: 'Storage (Disk GB)',
                                api: 'API Gateway (RPS)'
                              };
                              return (
                                <button
                                  key={m}
                                  type="button"
                                  id={`btn-comparison-metric-${m}`}
                                  onClick={() => setComparisonMetric(m)}
                                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                                    comparisonMetric === m 
                                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                  }`}
                                >
                                  {labelMap[m]}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Sorting Controls */}
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-black text-slate-400 tracking-wide font-mono block">Sort Columns</span>
                            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/80 rounded-lg p-1">
                              {(['name', 'allocated', 'consumed', 'utilization'] as const).map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  id={`btn-comparison-sort-${s}`}
                                  onClick={() => setComparisonSort(s)}
                                  className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                                    comparisonSort === s ? 'bg-white text-slate-900 shadow-2xs border border-slate-200' : 'text-slate-500 hover:text-slate-900'
                                  }`}
                                >
                                  {s.charAt(0).toUpperCase() + s.slice(1)}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-black text-slate-400 tracking-wide font-mono block">Direction</span>
                            <button
                              type="button"
                              id="btn-comparison-toggle-dir"
                              onClick={() => setComparisonSortDir(prev => prev === 'asc' ? 'desc' : 'asc')}
                              className="px-3 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-bold cursor-pointer"
                            >
                              {comparisonSortDir === 'asc' ? '▲ Asc' : '▼ Desc'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* RECHARTS COMPONENT */}
                      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
                        
                        {/* Grouped Bar Chart Visualizer (7 cols) */}
                        <div className="xl:col-span-8 bg-slate-50/50 border border-slate-200/60 rounded-xl p-4 flex flex-col justify-between min-h-[340px]">
                          <div>
                            <span className="text-xs font-black text-slate-800 uppercase tracking-wide block mb-1">
                              Relative Quota Usage Comparison
                            </span>
                            <p className="text-[10px] text-slate-500 font-mono mb-4">
                              Comparing active tenant workloads against hard-allocated capacity limitations (Unit: {
                                comparisonMetric === 'cpu' ? 'vCPUs' :
                                comparisonMetric === 'ram' ? 'RAM GB' :
                                comparisonMetric === 'storage' ? 'Disk GB' : 'Transactions RPS'
                              })
                            </p>
                          </div>

                          <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={getComparisonChartData()} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="shortName" stroke="#64748b" fontSize={10} fontWeight="bold" />
                                <YAxis stroke="#64748b" fontSize={10} />
                                <Tooltip
                                  content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                      const data = payload[0].payload;
                                      return (
                                        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg space-y-1.5 text-xs text-slate-700">
                                          <div className="flex items-center gap-1.5 border-b border-slate-100 pb-1">
                                            <span className={`w-2 h-2 rounded-full ${data.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                            <span className="font-extrabold text-slate-900">{data.name}</span>
                                            <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 rounded text-slate-500 border border-slate-200">{data.tier}</span>
                                          </div>
                                          <div className="space-y-1">
                                            <p className="flex justify-between gap-4">
                                              <span className="text-slate-500">Allocated Quota:</span>
                                              <span className="font-bold text-slate-800">{data.allocated.toLocaleString()} {data.unit}</span>
                                            </p>
                                            <p className="flex justify-between gap-4">
                                              <span className="text-slate-500">Simulated Usage:</span>
                                              <span className="font-bold text-slate-800">{data.consumed.toLocaleString()} {data.unit}</span>
                                            </p>
                                            <p className="flex justify-between gap-4 border-t border-slate-100 pt-1">
                                              <span className="text-slate-500">Utilization Rate:</span>
                                              <span className={`font-black ${
                                                data.utilPct >= 90 ? 'text-rose-600' :
                                                data.utilPct >= 80 ? 'text-amber-600' :
                                                'text-emerald-600'
                                              }`}>{data.utilPct.toFixed(0)}%</span>
                                            </p>
                                          </div>
                                        </div>
                                      );
                                    }
                                    return null;
                                  }}
                                />
                                <Legend wrapperStyle={{ fontSize: 10, fontWeight: 'bold' }} />
                                <Bar dataKey="allocated" fill="#e2e8f0" radius={[4, 4, 0, 0]} name="Allocated Quota Limit" />
                                <Bar 
                                  dataKey="consumed" 
                                  radius={[4, 4, 0, 0]} 
                                  name="Active Consumption" 
                                  fill="#4f46e5"
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Interactive Multipliers (5 cols) */}
                        <div className="xl:col-span-4 bg-slate-50 border border-slate-200 rounded-xl p-4.5 space-y-4">
                          <div className="border-b border-slate-200 pb-2.5">
                            <span className="text-xs font-black text-slate-800 uppercase tracking-wide block">Dynamic Load Simulator</span>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                              Adjust active workloads below to trigger instant SLA congestion warnings
                            </p>
                          </div>

                          <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
                            {tenants.map((t) => {
                              const utils = getTenantUtil(t.id);
                              let metricVal = 0;
                              if (comparisonMetric === 'cpu') metricVal = utils.cpu;
                              else if (comparisonMetric === 'ram') metricVal = utils.ram;
                              else if (comparisonMetric === 'storage') metricVal = utils.storage;
                              else metricVal = utils.api;

                              const handleSliderChange = (newVal: number) => {
                                setCustomTenantUtils(prev => ({
                                  ...prev,
                                  [t.id]: {
                                    ...(prev[t.id] || { cpu: 45, ram: 60, storage: 72, api: 50 }),
                                    [comparisonMetric]: newVal
                                  }
                                }));
                              };

                              return (
                                <div key={t.id} className="space-y-1 bg-white p-2.5 rounded-lg border border-slate-200/70 shadow-2xs">
                                  <div className="flex justify-between text-[11px] font-bold">
                                    <span className="text-slate-700 truncate max-w-[120px]">{t.name}</span>
                                    <span className={`font-mono text-[10px] ${
                                      metricVal >= 90 ? 'text-rose-600' :
                                      metricVal >= 80 ? 'text-amber-600' :
                                      'text-indigo-600'
                                    }`}>
                                      {metricVal}% load
                                    </span>
                                  </div>

                                  <input
                                    type="range"
                                    min="10"
                                    max="99"
                                    value={metricVal}
                                    onChange={(e) => handleSliderChange(parseInt(e.target.value))}
                                    className="w-full h-1 bg-slate-100 rounded accent-indigo-600 cursor-pointer"
                                  />
                                </div>
                              );
                            })}
                          </div>

                          <button
                            type="button"
                            id="btn-auto-optimize-quotas"
                            onClick={handleAutoOptimizeAllocation}
                            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-xs active:scale-98"
                          >
                            <Sliders className="w-4 h-4 text-emerald-400" />
                            <span>Auto-Optimize Congestion</span>
                          </button>
                        </div>

                      </div>
                    </div>

                    {/* SLA WARNINGS & QUOTA SATURATION LEDGER */}
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                      <div className="bg-slate-50 p-3.5 border-b border-slate-200 flex justify-between items-center">
                        <span className="font-bold text-xs text-slate-800 uppercase tracking-wide flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                          <span>Tenant Quota Saturation Ledger (SLA Warnings)</span>
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 font-bold">
                          Warning Limit: 80% • Saturation Limit: 90%
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-black text-slate-400 font-mono tracking-wider">
                              <th className="p-3.5">Tenant Organization</th>
                              <th className="p-3.5">Subscription Tier</th>
                              <th className="p-3.5">Metric Stream</th>
                              <th className="p-3.5">Allocated Cap</th>
                              <th className="p-3.5">Current Usage</th>
                              <th className="p-3.5 text-center">Utilization</th>
                              <th className="p-3.5 text-right">Operational Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium">
                            {getComparisonChartData().map((data) => {
                              const badgeStyle = 
                                data.utilPct >= 90 ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                data.utilPct >= 80 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                'bg-emerald-50 text-emerald-700 border border-emerald-200';

                              const statusLabel = 
                                data.utilPct >= 90 ? 'Critical Saturation' :
                                data.utilPct >= 80 ? 'Quota Warning' :
                                'Healthy Margin';

                              return (
                                <tr key={data.id} className="hover:bg-slate-50/50">
                                  <td className="p-3.5">
                                    <div className="flex items-center gap-2">
                                      <span className={`w-2.5 h-2.5 rounded-full ${data.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                      <div>
                                        <p className="font-extrabold text-slate-800">{data.name}</p>
                                        <p className="text-[10px] text-slate-400 font-mono">UID: {data.id}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-3.5 font-mono font-bold text-slate-600">{data.tier}</td>
                                  <td className="p-3.5 font-mono text-slate-500">{comparisonMetric.toUpperCase()}</td>
                                  <td className="p-3.5 font-mono font-bold text-slate-700">
                                    {data.allocated.toLocaleString()} {data.unit}
                                  </td>
                                  <td className="p-3.5 font-mono text-slate-600">
                                    {data.consumed.toLocaleString()} {data.unit}
                                  </td>
                                  <td className="p-3.5 text-center">
                                    <div className="inline-flex items-center gap-1.5 font-mono font-extrabold">
                                      <span className={`w-2 h-2 rounded-full ${
                                        data.utilPct >= 90 ? 'bg-rose-500' :
                                        data.utilPct >= 80 ? 'bg-amber-500' :
                                        'bg-emerald-500'
                                      }`} />
                                      <span className={
                                        data.utilPct >= 90 ? 'text-rose-600 font-black' :
                                        data.utilPct >= 80 ? 'text-amber-600' :
                                        'text-emerald-600'
                                      }>{data.utilPct.toFixed(0)}%</span>
                                    </div>
                                  </td>
                                  <td className="p-3.5 text-right">
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase ${badgeStyle}`}>
                                      {statusLabel}
                                    </span>
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
              </>
            ) : null}
          </div>
        </div>

      </div>

      {/* CREATE NEW CLIENT TENANT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm uppercase tracking-wide">Create Tenant Organization</h3>
              </div>
              <button
                id="btn-close-create-modal"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* If currently running simulation progress logs */}
            {isProvisioning ? (
              <div className="p-6 space-y-6">
                <div className="space-y-2 text-center">
                  <span className="text-xs font-bold text-indigo-600 block">PROVISIONING MULTI-TENANT ISOLATED INFRASTRUCTURE</span>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full transition-all duration-300" style={{ width: `${provisionProgress}%` }} />
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">{provisionProgress}% Processed</span>
                </div>

                <div className="bg-slate-950 text-emerald-400 font-mono text-[10px] p-4 rounded-xl h-48 overflow-y-auto space-y-1.5 scrollbar-thin border border-slate-800">
                  {provisionLogs.map((log, idx) => (
                    <div key={idx} className="leading-relaxed">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Create Form */
              <form onSubmit={handleCreateTenant} className="p-6 space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label htmlFor="modal-tenant-name" className="text-xs font-bold text-slate-700 block">Organization Name</label>
                  <input
                    id="modal-tenant-name"
                    type="text"
                    required
                    placeholder="e.g. Weyland Industries"
                    value={newTenantName}
                    onChange={(e) => {
                      setNewTenantName(e.target.value);
                      // Auto populate subdomain domain
                      setNewTenantDomain(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''));
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-indigo-500/50 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="modal-tenant-subdomain" className="text-xs font-bold text-slate-700 block">Portal Subdomain Prefix</label>
                  <div className="flex rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                    <input
                      id="modal-tenant-subdomain"
                      type="text"
                      required
                      placeholder="weyland-industries"
                      value={newTenantDomain}
                      onChange={(e) => setNewTenantDomain(e.target.value.toLowerCase())}
                      className="bg-white flex-1 py-2 px-3 outline-none text-xs border-r border-slate-200"
                    />
                    <span className="bg-slate-100 text-slate-500 px-3 py-2 font-mono text-xs">.edimp.com</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="modal-tenant-tier" className="text-xs font-bold text-slate-700 block">Subscription Plan Tier</label>
                    <select
                      id="modal-tenant-tier"
                      value={newTenantTier}
                      onChange={(e) => setNewTenantTier(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none cursor-pointer text-xs"
                    >
                      <option value="Trial">Trial (Sandbox)</option>
                      <option value="Starter">Starter ($499/mo)</option>
                      <option value="Professional">Professional ($1,999/mo)</option>
                      <option value="Enterprise">Enterprise ($4,999/mo)</option>
                      <option value="Partner">Partner ($8,999/mo)</option>
                      <option value="Unlimited">Unlimited ($25,000/mo)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="modal-tenant-region" className="text-xs font-bold text-slate-700 block">Data Residency Region</label>
                    <select
                      id="modal-tenant-region"
                      value={newTenantRegion}
                      onChange={(e) => setNewTenantRegion(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none cursor-pointer text-xs"
                    >
                      <option value="US-East">US-East (N. Virginia)</option>
                      <option value="EU-Central">EU-Central (Frankfurt)</option>
                      <option value="AP-South">AP-South (Mumbai)</option>
                      <option value="SA-East">SA-East (São Paulo)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="modal-tenant-contact" className="text-xs font-bold text-slate-700 block">Primary Admin Contact</label>
                    <input
                      id="modal-tenant-contact"
                      type="text"
                      placeholder="e.g. John Doe"
                      value={newTenantContact}
                      onChange={(e) => setNewTenantContact(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="modal-tenant-email" className="text-xs font-bold text-slate-700 block">Admin Email Address</label>
                    <input
                      id="modal-tenant-email"
                      type="email"
                      placeholder="e.g. admin@org.com"
                      value={newTenantEmail}
                      onChange={(e) => setNewTenantEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg cursor-pointer shadow-sm"
                  >
                    Provision Tenant
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* RESTORE DATABASE SNAPSHOT CONFIRMATION MODAL */}
      {showRestoreModal && selectedBackupToRestore && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="bg-rose-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-300" />
                <h3 className="font-bold text-sm uppercase tracking-wide">Restore Disaster Backup Snapshot</h3>
              </div>
              <button
                id="btn-close-restore-modal"
                onClick={() => {
                  if (!isRestoring) {
                    setShowRestoreModal(false);
                    setSelectedBackupToRestore(null);
                  }
                }}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {isRestoring ? (
                /* Restore Progress */
                <div className="space-y-6">
                  <div className="space-y-2 text-center text-xs">
                    <span className="font-bold text-rose-600 block">RE-CONFIGURING BACKUP STORAGE MOUNTS</span>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-rose-600 h-full transition-all duration-300" style={{ width: `${restoreProgress}%` }} />
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{restoreProgress}% Restored</span>
                  </div>

                  <div className="bg-slate-950 text-emerald-400 font-mono text-[10px] p-4 rounded-xl h-48 overflow-y-auto space-y-1.5 scrollbar-thin border border-slate-800">
                    {restoreLogs.map((log, idx) => (
                      <div key={idx} className="leading-relaxed">
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Restore Confirm dialog */
                <div className="space-y-4 text-xs">
                  <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-start gap-3 text-rose-900">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">WARNING: Destructive Database Restoration</span>
                      <p className="mt-0.5">
                        Restoring a backup completely overwrites active tables inside the isolated schema with target snapshot <span className="font-bold font-mono text-rose-800">{selectedBackupToRestore.id}</span>. Any changes written after <span className="font-bold font-mono text-rose-800">{selectedBackupToRestore.timestamp}</span> will be unrecoverable.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Backup Identifier:</span>
                      <span className="font-mono font-bold text-slate-800">{selectedBackupToRestore.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Timestamp:</span>
                      <span className="font-mono text-slate-800">{selectedBackupToRestore.timestamp}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Storage Size:</span>
                      <span className="font-mono text-slate-800">{selectedBackupToRestore.sizeMb} MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Triggered By:</span>
                      <span className="text-slate-800">{selectedBackupToRestore.triggeredBy}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setShowRestoreModal(false);
                        setSelectedBackupToRestore(null);
                      }}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
                    >
                      Abort Restore
                    </button>
                    <button
                      type="button"
                      onClick={confirmAndRunRestore}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg cursor-pointer shadow-sm"
                    >
                      Confirm Destructive Restore
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* SCHEMA DISCOVERY MODAL */}
      {isSchemaModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <SearchCode className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="font-bold text-sm uppercase tracking-wide">Automated Schema Discovery Engine</h3>
                  <p className="text-[10px] text-slate-400">Targeting ERP endpoint for {(organizationsMap[selectedTenantId] || []).find(o => o.id === selectedOrgId)?.name || 'Selected Organization'}</p>
                </div>
              </div>
              <button
                onClick={() => setIsSchemaModalOpen(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto text-xs">
              {/* Scan progress banner */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex justify-between items-center font-bold text-slate-700">
                  <span className="flex items-center gap-2">
                    {isSchemaScanning ? (
                      <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    )}
                    <span>{isSchemaScanning ? 'Scanning Database DDL & Schema Metadata...' : 'Schema Discovery Complete'}</span>
                  </span>
                  <span className="font-mono text-indigo-600 font-bold">{schemaScanProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${schemaScanProgress}%` }}
                  />
                </div>
              </div>

              {/* Discovered Tables list */}
              {schemaScanCompleted && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] font-mono">Discovered System Tables (3)</span>
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Auto-Mapped to Common Data Model</span>
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                    {[
                      { tableName: 'BSEG_JOURNAL_ENTRIES', records: 1250000, primaryKey: 'BELNR', confidence: 98 },
                      { tableName: 'KNA1_CUSTOMER_MASTER', records: 45000, primaryKey: 'KUNNR', confidence: 96 },
                      { tableName: 'MARA_MATERIAL_MASTER', records: 180000, primaryKey: 'MATNR', confidence: 95 },
                    ].map((tbl, i) => (
                      <div key={i} className="p-3 bg-white hover:bg-slate-50/80 flex items-center justify-between gap-3 font-mono text-[11px]">
                        <div>
                          <span className="font-bold text-slate-800">{tbl.tableName}</span>
                          <span className="text-[10px] text-slate-400 block">{tbl.records.toLocaleString()} records • PK: {tbl.primaryKey}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-[10px] font-bold">
                            {tbl.confidence}% Match
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                onClick={() => {
                  setIsSchemaScanning(true);
                  setSchemaScanProgress(0);
                  const interval = setInterval(() => {
                    setSchemaScanProgress(prev => {
                      if (prev >= 100) {
                        clearInterval(interval);
                        setIsSchemaScanning(false);
                        setSchemaScanCompleted(true);
                        return 100;
                      }
                      return prev + 25;
                    });
                  }, 300);
                }}
                disabled={isSchemaScanning}
                className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg text-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSchemaScanning ? 'animate-spin' : ''}`} />
                <span>Re-scan Schema</span>
              </button>
              <button
                onClick={() => {
                  alert('Exported discovered schema metadata standard JSON specification file.');
                  setIsSchemaModalOpen(false);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Schema Manifest</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLONE ORGANIZATION STRUCTURE MODAL */}
      {isCloneModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Copy className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm uppercase tracking-wide">Clone Organization Hierarchy</h3>
              </div>
              <button
                onClick={() => setIsCloneModalOpen(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Create a duplicate template of <span className="font-bold text-slate-800">{cloneSourceOrg?.name}</span> including configured connectors, ERP routing parameters, and project templates.
              </p>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">New Organization Subsidiary Name</label>
                <input
                  type="text"
                  value={cloneTargetName}
                  onChange={(e) => setCloneTargetName(e.target.value)}
                  placeholder="e.g. ABC Logistics - APAC Regional Branch"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/50 font-medium"
                />
              </div>

              <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-1 text-[11px] text-indigo-900">
                <span className="font-bold">What will be duplicated:</span>
                <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                  <li>ERP Connection configuration and endpoint URLs</li>
                  <li>Active data connector profiles and throughput parameters</li>
                  <li>Standard project migration blueprints</li>
                  <li>Default user role definitions</li>
                </ul>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCloneModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteCloneOrg}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  <Copy className="w-4 h-4" />
                  <span>Execute Clone</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DIAGNOSTIC TEST BENCH MODAL */}
      {isDiagnosticModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="font-bold text-sm uppercase tracking-wide">Connector Diagnostic Test Bench</h3>
                  <p className="text-[10px] text-slate-400">Node: {diagnosticConnector?.name || 'Data Connector'}</p>
                </div>
              </div>
              <button
                onClick={() => setIsDiagnosticModalOpen(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Connector Protocol</span>
                  <span className="font-bold text-slate-800">{diagnosticConnector?.type}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Current Flow Rate</span>
                  <span className="font-bold text-indigo-600 font-mono">{diagnosticConnector?.throughput}</span>
                </div>
              </div>

              {/* Diagnostic Checklist */}
              <div className="space-y-2">
                <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider block">Diagnostic Test Sequence</span>
                {isDiagnosticRunning ? (
                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-3">
                    <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin mx-auto" />
                    <p className="font-bold text-slate-700">Executing handshake & ping telemetry diagnostics...</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {[
                      { test: 'TCP Handshake Ping', latency: '12ms', status: 'PASS' },
                      { test: 'TLS 1.3 Cipher Suite Check', latency: '8ms', status: 'PASS' },
                      { test: 'OIDC Bearer Token Exchange', latency: '45ms', status: 'PASS' },
                    ].map((diag, i) => (
                      <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between font-mono text-[11px]">
                        <span className="font-medium text-slate-700">{diag.test}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400">{diag.latency}</span>
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            diag.status === 'PASS' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {diag.status} ✓
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsDiagnosticRunning(true);
                    setTimeout(() => setIsDiagnosticRunning(false), 1000);
                  }}
                  disabled={isDiagnosticRunning}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isDiagnosticRunning ? 'animate-spin' : ''}`} />
                  <span>Re-run Test Suite</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsDiagnosticModalOpen(false)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCHEDULE REPORT DELIVERY MODAL */}
      {isScheduleReportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="font-bold text-sm uppercase tracking-wide">Automate Report Dispatch</h3>
                  <p className="text-[10px] text-slate-400">Target: {reportToSchedule?.title || 'Division Audit Report'}</p>
                </div>
              </div>
              <button
                onClick={() => setIsScheduleReportModalOpen(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Recurrent Schedule Cadence</label>
                <select
                  value={scheduleFrequency}
                  onChange={(e) => setScheduleFrequency(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  <option value="Daily">Daily at Midnight UTC</option>
                  <option value="Weekly">Weekly (Every Monday 08:00 AM)</option>
                  <option value="Monthly">Monthly (1st Business Day)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Recipient Email Addresses (Comma Separated)</label>
                <input
                  type="text"
                  value={scheduleEmail}
                  onChange={(e) => setScheduleEmail(e.target.value)}
                  placeholder="e.g. audit-team@abcgroup.com, cfo@abcgroup.com"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 font-medium text-[11px]">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Reports are encrypted with AES-256 before email or SFTP attachment distribution.</span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsScheduleReportModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleScheduleReportSubmit}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Save Automation Cron</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REPORT PREVIEW DOCUMENT MODAL */}
      {previewReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="font-bold text-sm uppercase tracking-wide">Document Preview</h3>
                  <p className="text-[10px] text-slate-400">{previewReportModal.title}</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewReportModal(null)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto space-y-6 text-xs text-slate-700 font-sans">
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-base font-black text-slate-900">{previewReportModal.title}</h2>
                  <p className="text-[11px] text-slate-500 font-mono">Classification: {previewReportModal.type}</p>
                </div>
                <div className="text-right font-mono text-[10px] text-slate-400">
                  <div>Generated: {previewReportModal.generatedAt}</div>
                  <div>File Size: {previewReportModal.size}</div>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">Verified Audit Hash ✓</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 font-mono">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-400 block">RECORD COUNT</span>
                  <span className="font-bold text-sm text-slate-800">142,890</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-400 block">INTEGRITY SCORE</span>
                  <span className="font-bold text-sm text-emerald-600">99.8%</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-400 block">SECURITY LAYER</span>
                  <span className="font-bold text-sm text-indigo-600">HIPAA/SOX</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[10px] font-mono">Executive Summary & Audit Trail</h4>
                <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
                  This report captures automated transactional reconciliation metrics across connected ERP modules. All journal entries, user role privilege assignments, and network API endpoints were scanned and cross-verified against corporate compliance standards.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                onClick={() => alert(`Printing report: ${previewReportModal.title}`)}
                className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg text-xs cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Print / Save PDF</span>
              </button>
              <button
                onClick={() => setPreviewReportModal(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT SUBSIDIARY ORGANIZATION MODAL */}
      {isOrgModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4" id="org-config-modal-backdrop">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm uppercase tracking-wide">
                  {editingOrg ? 'Modify Organization Configuration' : 'Provision Subsidiary Organization'}
                </h3>
              </div>
              <button
                onClick={() => setIsOrgModalOpen(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveOrg} className="p-6 space-y-4 text-xs text-slate-600">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Organization Name / Subsidiary Label</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ABC Manufacturing"
                  value={formOrgName}
                  onChange={(e) => setFormOrgName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">ERP Ledger Software</label>
                  <select
                    value={formOrgErp}
                    onChange={(e) => setFormOrgErp(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500/50"
                  >
                    <option value="SAP S/4HANA (v2023)">SAP S/4HANA (v2023)</option>
                    <option value="SAP ECC 6.0 EHP8">SAP ECC 6.0 EHP8</option>
                    <option value="Oracle Fusion Cloud ERP">Oracle Fusion Cloud ERP</option>
                    <option value="NetSuite SuiteEnterprise">NetSuite SuiteEnterprise</option>
                    <option value="Microsoft Dynamics 365 Finance">Microsoft Dynamics 365 F&O</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Connection Sync State</label>
                  <select
                    value={formOrgErpStatus}
                    onChange={(e) => setFormOrgErpStatus(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500/50"
                  >
                    <option value="Active">Active / Unlocked</option>
                    <option value="Synced">Fully Synced ✓</option>
                    <option value="Pending">Sync Pending</option>
                    <option value="Error">Error / Faulted ✗</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Database Connection URL (Internal / Tunnel Address)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. sap-node.mfg.internal:443"
                  value={formOrgErpHost}
                  onChange={(e) => setFormOrgErpHost(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
                <span className="text-[10px] text-slate-400 block pt-0.5">
                  Establish a secure IPSec / VPC endpoint connection string to tunnel directly to the subsidiary ERP.
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOrgModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingOrg ? 'Apply Settings' : 'Provision Entity'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
