export interface PartnerOrganization {
  id: string;
  name: string;
  code: string;
  tier: 'Platinum Global Strategic Partner' | 'Gold Implementation Partner' | 'Elite Diamond Partner' | 'Silver Authorized Partner';
  region: 'North America' | 'EMEA' | 'APAC' | 'LATAM' | 'Global';
  accountManager: string;
  contactEmail: string;
  logoPreset: 'Avanade' | 'Deloitte Digital' | 'PwC Advisory' | 'Accenture Tech' | 'KPMG Cyber' | 'Infosys Digital' | 'Custom';
  primaryColorHex: string;
  accentColorHex: string;
  themeMode: 'Indigo Executive' | 'Sapphire Cyber' | 'Emerald Quantum' | 'Obsidian Dark' | 'Ruby Enterprise';
  activeCustomersCount: number;
  totalMrr: number;
  totalDataMigratedTb: number;
  status: 'Active' | 'Pending Review' | 'Tier Maintenance';
  cnameDomain: string;
}

export interface PartnerCustomer {
  id: string;
  partnerId: string;
  partnerName: string;
  name: string;
  code: string;
  erpEcosystem: 'Microsoft Dynamics 365' | 'SAP S/4HANA' | 'Oracle Fusion Cloud' | 'NetSuite ERP' | 'Infor LN';
  tier: 'Trial' | 'Starter' | 'Professional' | 'Enterprise' | 'Partner' | 'Unlimited' | 'Mid-Market' | 'Growth' | 'Standard' | 'Pro' | 'Dedicated Cluster' | 'Pay-As-You-Go CDC';
  accountManager: string;
  contactName: string;
  contactEmail: string;
  region: 'North America' | 'EMEA' | 'APAC' | 'LATAM';
  deploymentStage: 'Pre-Flight' | 'Live Migration' | 'Post-Cutover' | 'Managed Services';
  healthScore: number;
  dataMigratedTb: number;
  activeJobs: number;
  tenantId: string;
  assignedLicenses: number;
  mrrAmount: number;
  contractRenewalDate: string;
  status: 'Active' | 'Onboarding' | 'Maintenance' | 'Suspended';
}

export interface PartnerTenant {
  id: string;
  tenantName: string;
  partnerId: string;
  partnerName: string;
  customerId: string;
  customerName: string;
  cloudRegion: 'Azure US East' | 'Azure EU West' | 'AWS us-east-1' | 'AWS eu-central-1' | 'GCP asia-east1' | 'On-Prem Hybrid Agent';
  instanceType: 'Dedicated High-Throughput Cluster' | 'Multi-Tenant Shared Engine' | 'Isolated Sovereign Cloud';
  allocatedNodes: number;
  allocatedMemoryGb: number;
  cpuUtilizationPct: number;
  storageAllocatedTb: number;
  storageUsedTb: number;
  erpConnectorsActive: string[];
  status: 'Active' | 'Provisioning' | 'Maintenance' | 'Suspended';
  provisionedAt: string;
  cnameDomain: string;
}

export interface LicensePackage {
  id: string;
  name: string;
  category: 'Named User' | 'Concurrent User' | 'Per Tenant' | 'Per Project' | 'Per Migration' | 'Consumption Based' | 'ERP Connector Bundle' | 'Migration Engine Seat' | 'Real-Time CDC Stream' | 'Storage Volume Quota';
  erpVendor: 'Microsoft Dynamics' | 'SAP' | 'Oracle' | 'Universal';
  totalPoolSeats: number;
  assignedSeats: number;
  costPerSeatMonthly: number;
  expiryDate: string;
  autoRenew: boolean;
}

export interface LicenseAssignment {
  id: string;
  licenseId: string;
  licenseName: string;
  partnerId: string;
  partnerName: string;
  customerId: string;
  customerName: string;
  tenantId: string;
  assignedSeats: number;
  assignedAt: string;
  status: 'Active' | 'Pending' | 'Expired';
}

export interface MonthlyUsageData {
  month: string;
  dataTransferredTb: number;
  apiRequestsMillions: number;
  migrationJobsCount: number;
  cdcEventsBillions: number;
  activeTenants: number;
}

export interface PartnerRevenueData {
  month: string;
  grossRevenue: number;
  partnerMargin: number;
  netCommission: number;
  dynamicsRevenue: number;
  sapRevenue: number;
  oracleRevenue: number;
  otherRevenue: number;
}

export interface WhiteLabelConfig {
  partnerName: string;
  tagline: string;
  partnerTier: 'Gold Implementation Partner' | 'Platinum Global Strategic Partner' | 'Elite Diamond Partner';
  logoPreset: 'Avanade' | 'Deloitte Digital' | 'PwC Advisory' | 'Accenture Tech' | 'KPMG Cyber' | 'Infosys Digital' | 'Custom';
  customLogoUrl?: string;
  primaryColorHex: string;
  accentColorHex: string;
  themeMode: 'Indigo Executive' | 'Sapphire Cyber' | 'Emerald Quantum' | 'Obsidian Dark' | 'Ruby Enterprise';
  cnameDomain: string;
  sslCertStatus: 'Active & Verified' | 'Pending DNS Propagation' | 'Self-Signed Staging';
  supportEmail: string;
  customHeaderNotice: string;
  coBrandingText: string;
  showPoweredByBadge: boolean;
  loginWelcomeMsg: string;
}

export const MOCK_PARTNER_ORGANIZATIONS: PartnerOrganization[] = [
  {
    id: 'partner-avanade',
    name: 'Avanade Global Migration Services',
    code: 'AVN-GLOBAL',
    tier: 'Platinum Global Strategic Partner',
    region: 'Global',
    accountManager: 'Sarah Jenkins',
    contactEmail: 'erp-partner@avanade.com',
    logoPreset: 'Avanade',
    primaryColorHex: '#4F46E5',
    accentColorHex: '#10B981',
    themeMode: 'Indigo Executive',
    activeCustomersCount: 2,
    totalMrr: 31300,
    totalDataMigratedTb: 83.4,
    status: 'Active',
    cnameDomain: 'migration.avanade-partner.com',
  },
  {
    id: 'partner-deloitte',
    name: 'Deloitte Digital Transformation',
    code: 'DEL-DIGITAL',
    tier: 'Elite Diamond Partner',
    region: 'North America',
    accountManager: 'Marcus Vance',
    contactEmail: 'cloud-partners@deloitte.com',
    logoPreset: 'Deloitte Digital',
    primaryColorHex: '#0284C7',
    accentColorHex: '#3B82F6',
    themeMode: 'Sapphire Cyber',
    activeCustomersCount: 2,
    totalMrr: 40700,
    totalDataMigratedTb: 84.5,
    status: 'Active',
    cnameDomain: 'erp-portal.deloitte.com',
  },
  {
    id: 'partner-pwc',
    name: 'PwC Advisory Tech Practices',
    code: 'PWC-TECH',
    tier: 'Gold Implementation Partner',
    region: 'EMEA',
    accountManager: 'Elena Rostova',
    contactEmail: 'migration-desk@pwc.com',
    logoPreset: 'PwC Advisory',
    primaryColorHex: '#EA580C',
    accentColorHex: '#F59E0B',
    themeMode: 'Ruby Enterprise',
    activeCustomersCount: 1,
    totalMrr: 21000,
    totalDataMigratedTb: 5.1,
    status: 'Active',
    cnameDomain: 'migration.pwc-advisory.com',
  },
  {
    id: 'partner-accenture',
    name: 'Accenture Cloud First Solutions',
    code: 'ACN-CLOUD',
    tier: 'Platinum Global Strategic Partner',
    region: 'APAC',
    accountManager: 'David Chen',
    contactEmail: 'erp-sync@accenture.com',
    logoPreset: 'Accenture Tech',
    primaryColorHex: '#7C3AED',
    accentColorHex: '#EC4899',
    themeMode: 'Emerald Quantum',
    activeCustomersCount: 1,
    totalMrr: 8900,
    totalDataMigratedTb: 14.2,
    status: 'Active',
    cnameDomain: 'portal.accenture-cloud.com',
  },
  {
    id: 'partner-kpmg',
    name: 'KPMG Cyber & ERP Practice',
    code: 'KPMG-ERP',
    tier: 'Gold Implementation Partner',
    region: 'EMEA',
    accountManager: 'Victor Vance',
    contactEmail: 'erp-cloud@kpmg.com',
    logoPreset: 'KPMG Cyber',
    primaryColorHex: '#2563EB',
    accentColorHex: '#06B6D4',
    themeMode: 'Obsidian Dark',
    activeCustomersCount: 1,
    totalMrr: 16500,
    totalDataMigratedTb: 19.8,
    status: 'Active',
    cnameDomain: 'migration-desk.kpmg.com',
  },
];

export const MOCK_PARTNER_CUSTOMERS: PartnerCustomer[] = [
  {
    id: 'cust-101',
    partnerId: 'partner-avanade',
    partnerName: 'Avanade Global Migration Services',
    name: 'Global Logistics Corp',
    code: 'GLC-001',
    erpEcosystem: 'SAP S/4HANA',
    tier: 'Enterprise',
    accountManager: 'Sarah Jenkins (Avanade)',
    contactName: 'Robert Vance',
    contactEmail: 'rvance@globallogistics.com',
    region: 'North America',
    deploymentStage: 'Live Migration',
    healthScore: 99.2,
    dataMigratedTb: 34.8,
    activeJobs: 4,
    tenantId: 'tenant-sap-01',
    assignedLicenses: 12,
    mrrAmount: 18500,
    contractRenewalDate: '2027-03-15',
    status: 'Active',
  },
  {
    id: 'cust-102',
    partnerId: 'partner-deloitte',
    partnerName: 'Deloitte Digital Transformation',
    name: 'Nordic Retail Group',
    code: 'NRG-002',
    erpEcosystem: 'Microsoft Dynamics 365',
    tier: 'Enterprise',
    accountManager: 'Marcus Vance (Deloitte)',
    contactName: 'Astrid Lindqvist',
    contactEmail: 'a.lindqvist@nordicretail.se',
    region: 'EMEA',
    deploymentStage: 'Live Migration',
    healthScore: 98.7,
    dataMigratedTb: 22.4,
    activeJobs: 3,
    tenantId: 'tenant-d365-02',
    assignedLicenses: 8,
    mrrAmount: 14200,
    contractRenewalDate: '2026-11-30',
    status: 'Active',
  },
  {
    id: 'cust-103',
    partnerId: 'partner-pwc',
    partnerName: 'PwC Advisory Tech Practices',
    name: 'Apex Financial Services',
    code: 'AFS-003',
    erpEcosystem: 'Oracle Fusion Cloud',
    tier: 'Enterprise',
    accountManager: 'Elena Rostova (PwC)',
    contactName: 'David Sterling',
    contactEmail: 'dsterling@apexfin.com',
    region: 'North America',
    deploymentStage: 'Pre-Flight',
    healthScore: 96.5,
    dataMigratedTb: 5.1,
    activeJobs: 2,
    tenantId: 'tenant-ora-03',
    assignedLicenses: 10,
    mrrAmount: 21000,
    contractRenewalDate: '2027-01-10',
    status: 'Onboarding',
  },
  {
    id: 'cust-104',
    partnerId: 'partner-accenture',
    partnerName: 'Accenture Cloud First Solutions',
    name: 'Pacific BioTech Labs',
    code: 'PBL-004',
    erpEcosystem: 'NetSuite ERP',
    tier: 'Mid-Market',
    accountManager: 'David Chen (Accenture)',
    contactName: 'Dr. Evelyn Wu',
    contactEmail: 'ewu@pacificbiotech.io',
    region: 'APAC',
    deploymentStage: 'Post-Cutover',
    healthScore: 100,
    dataMigratedTb: 14.2,
    activeJobs: 1,
    tenantId: 'tenant-ns-04',
    assignedLicenses: 4,
    mrrAmount: 8900,
    contractRenewalDate: '2026-09-01',
    status: 'Active',
  },
  {
    id: 'cust-105',
    partnerId: 'partner-avanade',
    partnerName: 'Avanade Global Migration Services',
    name: 'Veritas Heavy Industries',
    code: 'VHI-005',
    erpEcosystem: 'Infor LN',
    tier: 'Enterprise',
    accountManager: 'Sarah Jenkins (Avanade)',
    contactName: 'Hans Gruber',
    contactEmail: 'hgruber@veritasheavy.de',
    region: 'EMEA',
    deploymentStage: 'Managed Services',
    healthScore: 97.8,
    dataMigratedTb: 48.6,
    activeJobs: 2,
    tenantId: 'tenant-inf-05',
    assignedLicenses: 6,
    mrrAmount: 12800,
    contractRenewalDate: '2026-12-15',
    status: 'Active',
  },
  {
    id: 'cust-106',
    partnerId: 'partner-deloitte',
    partnerName: 'Deloitte Digital Transformation',
    name: 'AeroSpace Components Int',
    code: 'ACI-006',
    erpEcosystem: 'SAP S/4HANA',
    tier: 'Enterprise',
    accountManager: 'Marcus Vance (Deloitte)',
    contactName: 'Michael Thorne',
    contactEmail: 'mthorne@aerocomp.com',
    region: 'North America',
    deploymentStage: 'Live Migration',
    healthScore: 99.8,
    dataMigratedTb: 62.1,
    activeJobs: 5,
    tenantId: 'tenant-sap-06',
    assignedLicenses: 15,
    mrrAmount: 26500,
    contractRenewalDate: '2027-06-20',
    status: 'Active',
  },
  {
    id: 'cust-107',
    partnerId: 'partner-kpmg',
    partnerName: 'KPMG Cyber & ERP Practice',
    name: 'Continental Energy AG',
    code: 'CEA-007',
    erpEcosystem: 'SAP S/4HANA',
    tier: 'Enterprise',
    accountManager: 'Victor Vance (KPMG)',
    contactName: 'Klara Schmidt',
    contactEmail: 'kschmidt@continentalenergy.de',
    region: 'EMEA',
    deploymentStage: 'Live Migration',
    healthScore: 98.4,
    dataMigratedTb: 19.8,
    activeJobs: 3,
    tenantId: 'tenant-sap-07',
    assignedLicenses: 10,
    mrrAmount: 16500,
    contractRenewalDate: '2027-08-10',
    status: 'Active',
  },
];

export const MOCK_PARTNER_TENANTS: PartnerTenant[] = [
  {
    id: 'tenant-sap-01',
    tenantName: 'GLC-SAP-Prod-Cluster',
    partnerId: 'partner-avanade',
    partnerName: 'Avanade Global Migration Services',
    customerId: 'cust-101',
    customerName: 'Global Logistics Corp',
    cloudRegion: 'Azure US East',
    instanceType: 'Dedicated High-Throughput Cluster',
    allocatedNodes: 8,
    allocatedMemoryGb: 64,
    cpuUtilizationPct: 42,
    storageAllocatedTb: 50,
    storageUsedTb: 34.8,
    erpConnectorsActive: ['SAP S/4HANA 2023', 'Microsoft Dynamics 365 FO', 'SQL Server Staging'],
    status: 'Active',
    provisionedAt: '2025-10-12',
    cnameDomain: 'migration.globallogistics.partner.com',
  },
  {
    id: 'tenant-d365-02',
    tenantName: 'NRG-D365-EU-Tenant',
    partnerId: 'partner-deloitte',
    partnerName: 'Deloitte Digital Transformation',
    customerId: 'cust-102',
    customerName: 'Nordic Retail Group',
    cloudRegion: 'Azure EU West',
    instanceType: 'Dedicated High-Throughput Cluster',
    allocatedNodes: 6,
    allocatedMemoryGb: 48,
    cpuUtilizationPct: 38,
    storageAllocatedTb: 30,
    storageUsedTb: 22.4,
    erpConnectorsActive: ['Microsoft Dynamics 365 BC', 'Azure Data Lake Gen2'],
    status: 'Active',
    provisionedAt: '2025-11-04',
    cnameDomain: 'd365-migration.nordicretail.se',
  },
  {
    id: 'tenant-ora-03',
    tenantName: 'AFS-Oracle-US-Node',
    partnerId: 'partner-pwc',
    partnerName: 'PwC Advisory Tech Practices',
    customerId: 'cust-103',
    customerName: 'Apex Financial Services',
    cloudRegion: 'AWS us-east-1',
    instanceType: 'Isolated Sovereign Cloud',
    allocatedNodes: 12,
    allocatedMemoryGb: 96,
    cpuUtilizationPct: 18,
    storageAllocatedTb: 100,
    storageUsedTb: 5.1,
    erpConnectorsActive: ['Oracle Fusion Cloud ERP', 'PostgreSQL Audit Store'],
    status: 'Provisioning',
    provisionedAt: '2026-02-01',
    cnameDomain: 'mig.apexfin.com',
  },
  {
    id: 'tenant-ns-04',
    tenantName: 'PBL-NetSuite-APAC',
    partnerId: 'partner-accenture',
    partnerName: 'Accenture Cloud First Solutions',
    customerId: 'cust-104',
    customerName: 'Pacific BioTech Labs',
    cloudRegion: 'GCP asia-east1',
    instanceType: 'Multi-Tenant Shared Engine',
    allocatedNodes: 4,
    allocatedMemoryGb: 32,
    cpuUtilizationPct: 25,
    storageAllocatedTb: 20,
    storageUsedTb: 14.2,
    erpConnectorsActive: ['NetSuite OneWorld', 'Salesforce CRM'],
    status: 'Active',
    provisionedAt: '2025-08-18',
    cnameDomain: 'data.pacificbiotech.io',
  },
  {
    id: 'tenant-inf-05',
    tenantName: 'VHI-Infor-EMEA-Agent',
    partnerId: 'partner-avanade',
    partnerName: 'Avanade Global Migration Services',
    customerId: 'cust-105',
    customerName: 'Veritas Heavy Industries',
    cloudRegion: 'On-Prem Hybrid Agent',
    instanceType: 'Dedicated High-Throughput Cluster',
    allocatedNodes: 6,
    allocatedMemoryGb: 48,
    cpuUtilizationPct: 52,
    storageAllocatedTb: 60,
    storageUsedTb: 48.6,
    erpConnectorsActive: ['Infor LN 10.7', 'SAP S/4HANA Destination'],
    status: 'Active',
    provisionedAt: '2025-06-22',
    cnameDomain: 'erp-sync.veritasheavy.de',
  },
  {
    id: 'tenant-sap-06',
    tenantName: 'ACI-SAP-HighScale-16N',
    partnerId: 'partner-deloitte',
    partnerName: 'Deloitte Digital Transformation',
    customerId: 'cust-106',
    customerName: 'AeroSpace Components Int',
    cloudRegion: 'AWS us-east-1',
    instanceType: 'Dedicated High-Throughput Cluster',
    allocatedNodes: 16,
    allocatedMemoryGb: 128,
    cpuUtilizationPct: 68,
    storageAllocatedTb: 100,
    storageUsedTb: 62.1,
    erpConnectorsActive: ['SAP ECC 6.0 EHP8', 'SAP S/4HANA Cloud', 'Apache Iceberg Lake'],
    status: 'Active',
    provisionedAt: '2025-09-01',
    cnameDomain: 'migration.aerocomp.com',
  },
  {
    id: 'tenant-sap-07',
    tenantName: 'CEA-SAP-Grid-8N',
    partnerId: 'partner-kpmg',
    partnerName: 'KPMG Cyber & ERP Practice',
    customerId: 'cust-107',
    customerName: 'Continental Energy AG',
    cloudRegion: 'Azure EU West',
    instanceType: 'Dedicated High-Throughput Cluster',
    allocatedNodes: 8,
    allocatedMemoryGb: 64,
    cpuUtilizationPct: 45,
    storageAllocatedTb: 40,
    storageUsedTb: 19.8,
    erpConnectorsActive: ['SAP S/4HANA 2023', 'Oracle Cloud DB'],
    status: 'Active',
    provisionedAt: '2025-12-01',
    cnameDomain: 'erp.continentalenergy.de',
  },
];

export const MOCK_LICENSE_PACKAGES: LicensePackage[] = [
  {
    id: 'lic-pkg-01',
    name: 'Microsoft Dynamics 365 Enterprise Suite',
    category: 'Named User',
    erpVendor: 'Microsoft Dynamics',
    totalPoolSeats: 50,
    assignedSeats: 38,
    costPerSeatMonthly: 450,
    expiryDate: '2027-12-31',
    autoRenew: true,
  },
  {
    id: 'lic-pkg-02',
    name: 'SAP S/4HANA CDC Real-Time Stream Engine',
    category: 'Consumption Based',
    erpVendor: 'SAP',
    totalPoolSeats: 30,
    assignedSeats: 27,
    costPerSeatMonthly: 850,
    expiryDate: '2027-06-30',
    autoRenew: true,
  },
  {
    id: 'lic-pkg-03',
    name: 'Oracle Fusion Cloud Migration Engine Seats',
    category: 'Per Project',
    erpVendor: 'Oracle',
    totalPoolSeats: 25,
    assignedSeats: 16,
    costPerSeatMonthly: 620,
    expiryDate: '2027-09-30',
    autoRenew: true,
  },
  {
    id: 'lic-pkg-04',
    name: 'Universal ERP Storage Pool (100 TB)',
    category: 'Per Tenant',
    erpVendor: 'Universal',
    totalPoolSeats: 500, // 500 TB pool
    assignedSeats: 380, // 380 TB assigned
    costPerSeatMonthly: 80, // per TB
    expiryDate: '2028-01-01',
    autoRenew: true,
  },
];

export const MOCK_LICENSE_ASSIGNMENTS: LicenseAssignment[] = [
  {
    id: 'asgn-01',
    licenseId: 'lic-pkg-01',
    licenseName: 'Microsoft Dynamics 365 Enterprise Suite',
    partnerId: 'partner-deloitte',
    partnerName: 'Deloitte Digital Transformation',
    customerId: 'cust-102',
    customerName: 'Nordic Retail Group',
    tenantId: 'tenant-d365-02',
    assignedSeats: 8,
    assignedAt: '2025-11-05',
    status: 'Active',
  },
  {
    id: 'asgn-02',
    licenseId: 'lic-pkg-02',
    licenseName: 'SAP S/4HANA CDC Real-Time Stream Engine',
    partnerId: 'partner-avanade',
    partnerName: 'Avanade Global Migration Services',
    customerId: 'cust-101',
    customerName: 'Global Logistics Corp',
    tenantId: 'tenant-sap-01',
    assignedSeats: 12,
    assignedAt: '2025-10-15',
    status: 'Active',
  },
  {
    id: 'asgn-03',
    licenseId: 'lic-pkg-03',
    licenseName: 'Oracle Fusion Cloud Migration Engine Seats',
    partnerId: 'partner-pwc',
    partnerName: 'PwC Advisory Tech Practices',
    customerId: 'cust-103',
    customerName: 'Apex Financial Services',
    tenantId: 'tenant-ora-03',
    assignedSeats: 10,
    assignedAt: '2026-02-02',
    status: 'Active',
  },
  {
    id: 'asgn-04',
    licenseId: 'lic-pkg-02',
    licenseName: 'SAP S/4HANA CDC Real-Time Stream Engine',
    partnerId: 'partner-deloitte',
    partnerName: 'Deloitte Digital Transformation',
    customerId: 'cust-106',
    customerName: 'AeroSpace Components Int',
    tenantId: 'tenant-sap-06',
    assignedSeats: 15,
    assignedAt: '2025-09-02',
    status: 'Active',
  },
  {
    id: 'asgn-05',
    licenseId: 'lic-pkg-02',
    licenseName: 'SAP S/4HANA CDC Real-Time Stream Engine',
    partnerId: 'partner-kpmg',
    partnerName: 'KPMG Cyber & ERP Practice',
    customerId: 'cust-107',
    customerName: 'Continental Energy AG',
    tenantId: 'tenant-sap-07',
    assignedSeats: 10,
    assignedAt: '2025-12-02',
    status: 'Active',
  },
];

export const MOCK_MONTHLY_USAGE: MonthlyUsageData[] = [
  { month: 'Sep', dataTransferredTb: 18.4, apiRequestsMillions: 4.2, migrationJobsCount: 28, cdcEventsBillions: 1.2, activeTenants: 4 },
  { month: 'Oct', dataTransferredTb: 26.1, apiRequestsMillions: 6.8, migrationJobsCount: 34, cdcEventsBillions: 2.1, activeTenants: 5 },
  { month: 'Nov', dataTransferredTb: 38.5, apiRequestsMillions: 9.4, migrationJobsCount: 42, cdcEventsBillions: 3.8, activeTenants: 5 },
  { month: 'Dec', dataTransferredTb: 52.0, apiRequestsMillions: 12.1, migrationJobsCount: 51, cdcEventsBillions: 5.4, activeTenants: 6 },
  { month: 'Jan', dataTransferredTb: 71.3, apiRequestsMillions: 16.5, migrationJobsCount: 64, cdcEventsBillions: 7.9, activeTenants: 6 },
  { month: 'Feb', dataTransferredTb: 98.6, apiRequestsMillions: 22.8, migrationJobsCount: 78, cdcEventsBillions: 11.2, activeTenants: 6 },
];

export const MOCK_REVENUE_DATA: PartnerRevenueData[] = [
  { month: 'Sep', grossRevenue: 64000, partnerMargin: 20480, netCommission: 16380, dynamicsRevenue: 22000, sapRevenue: 28000, oracleRevenue: 10000, otherRevenue: 4000 },
  { month: 'Oct', grossRevenue: 78500, partnerMargin: 25120, netCommission: 20090, dynamicsRevenue: 28000, sapRevenue: 34000, oracleRevenue: 11500, otherRevenue: 5000 },
  { month: 'Nov', grossRevenue: 92000, partnerMargin: 29440, netCommission: 23550, dynamicsRevenue: 32000, sapRevenue: 40000, oracleRevenue: 14000, otherRevenue: 6000 },
  { month: 'Dec', grossRevenue: 108000, partnerMargin: 34560, netCommission: 27648, dynamicsRevenue: 38000, sapRevenue: 46000, oracleRevenue: 17000, otherRevenue: 7000 },
  { month: 'Jan', grossRevenue: 124000, partnerMargin: 39680, netCommission: 31744, dynamicsRevenue: 42000, sapRevenue: 52000, oracleRevenue: 21000, otherRevenue: 9000 },
  { month: 'Feb', grossRevenue: 148500, partnerMargin: 51975, netCommission: 41580, dynamicsRevenue: 48000, sapRevenue: 64000, oracleRevenue: 26500, otherRevenue: 10000 },
];

export const DEFAULT_WHITE_LABEL_CONFIG: WhiteLabelConfig = {
  partnerName: 'Avanade Global Migration Services',
  tagline: 'Premier Microsoft Dynamics & SAP Enterprise Migration Partner',
  partnerTier: 'Platinum Global Strategic Partner',
  logoPreset: 'Avanade',
  primaryColorHex: '#4F46E5', // Indigo-600
  accentColorHex: '#10B981', // Emerald-500
  themeMode: 'Indigo Executive',
  cnameDomain: 'migration.avanade-partner.com',
  sslCertStatus: 'Active & Verified',
  supportEmail: 'erp-migration-support@avanade.com',
  customHeaderNotice: 'Confidential Avanade Partner Portal — Enterprise ERP Migration Command Center',
  coBrandingText: 'Powered by EDIMP Enterprise Engine v3.4',
  showPoweredByBadge: true,
  loginWelcomeMsg: 'Welcome to Avanade Partner Workspace. Sign in with your Enterprise Single Sign-On (SSO).',
};

export interface LiveActivityEvent {
  id: string;
  timestamp: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  partnerId: string;
  partnerName: string;
  eventType: 'CONFIG_CHANGE' | 'MIGRATION_START' | 'CLUSTER_PROVISION' | 'LICENSE_ASSIGN' | 'HEALTH_ALERT' | 'WHITE_LABEL_UPDATE';
  severity: 'info' | 'success' | 'warning' | 'critical';
  title: string;
  description: string;
  actor: string;
  actorRole: 'Partner Admin' | 'Partner Analyst' | 'Partner Support' | 'Account Manager' | 'Lead Architect' | 'System Auto-Provisioner' | string;
  metadata?: Record<string, string | number>;
}

export interface GanttMigrationJob {
  id: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  jobName: string;
  erpSource: string;
  targetCloud: string;
  phase: 'Pre-Flight Schema' | 'Initial Bulk Load' | 'CDC Delta Catchup' | 'Cutover Validation' | 'Live Mirroring';
  status: 'ACTIVE_SYNC' | 'CATCHUP' | 'QUEUED' | 'PAUSED' | 'COMPLETED';
  startHour: number; // 0 to 24 scale
  endHour: number;   // 0 to 24 scale
  progressPct: number; // 0 to 100
  elapsedDuration: string;
  estimatedRemaining: string;
  allocatedVCPUs: number;
  allocatedMemoryGb: number;
  throughputGbSec: number;
  parallelWorkerThreads: number;
}

export const MOCK_GANTT_MIGRATION_JOBS: GanttMigrationJob[] = [
  {
    id: 'gantt-101',
    customerId: 'cust-101',
    customerName: 'Contoso Pharmaceuticals',
    customerCode: 'CONT-PHARMA',
    jobName: 'Dynamics 365 FO Finance & GL CDC Stream',
    erpSource: 'Dynamics 365 F&O',
    targetCloud: 'Azure US East (D365 FO Staging)',
    phase: 'CDC Delta Catchup',
    status: 'ACTIVE_SYNC',
    startHour: 2,
    endHour: 18,
    progressPct: 78,
    elapsedDuration: '6h 45m elapsed',
    estimatedRemaining: '2h 15m remaining',
    allocatedVCPUs: 8,
    allocatedMemoryGb: 32,
    throughputGbSec: 2.14,
    parallelWorkerThreads: 12,
  },
  {
    id: 'gantt-102',
    customerId: 'cust-101',
    customerName: 'Contoso Pharmaceuticals',
    customerCode: 'CONT-PHARMA',
    jobName: 'Customer Master & AR Replication Stream',
    erpSource: 'Dynamics 365 F&O',
    targetCloud: 'Azure Data Lake Gen2',
    phase: 'Live Mirroring',
    status: 'ACTIVE_SYNC',
    startHour: 6,
    endHour: 22,
    progressPct: 92,
    elapsedDuration: '8h 30m elapsed',
    estimatedRemaining: '1h 10m remaining',
    allocatedVCPUs: 4,
    allocatedMemoryGb: 16,
    throughputGbSec: 1.45,
    parallelWorkerThreads: 6,
  },
  {
    id: 'gantt-103',
    customerId: 'cust-102',
    customerName: 'Acme Retail Group',
    customerCode: 'ACME-RETAIL',
    jobName: 'Oracle Fusion Inventory Delta Catchup',
    erpSource: 'Oracle Fusion Cloud',
    targetCloud: 'Oracle-to-Azure ExpressRoute',
    phase: 'CDC Delta Catchup',
    status: 'CATCHUP',
    startHour: 4,
    endHour: 16,
    progressPct: 65,
    elapsedDuration: '5h 20m elapsed',
    estimatedRemaining: '3h 40m remaining',
    allocatedVCPUs: 12,
    allocatedMemoryGb: 48,
    throughputGbSec: 2.85,
    parallelWorkerThreads: 16,
  },
  {
    id: 'gantt-104',
    customerId: 'cust-102',
    customerName: 'Acme Retail Group',
    customerCode: 'ACME-RETAIL',
    jobName: 'POS Store Order Real-Time Pipeline',
    erpSource: 'Oracle Retail POS',
    targetCloud: 'Azure Cosmos DB Replica',
    phase: 'Live Mirroring',
    status: 'ACTIVE_SYNC',
    startHour: 1,
    endHour: 23,
    progressPct: 88,
    elapsedDuration: '9h 15m elapsed',
    estimatedRemaining: '1h 45m remaining',
    allocatedVCPUs: 6,
    allocatedMemoryGb: 24,
    throughputGbSec: 1.90,
    parallelWorkerThreads: 8,
  },
  {
    id: 'gantt-105',
    customerId: 'cust-103',
    customerName: 'Nordic Freight & Logistics',
    customerCode: 'NORDIC-LOG',
    jobName: 'SAP S/4HANA Master Data Bulk Load',
    erpSource: 'SAP ECC 6.0 EHP8',
    targetCloud: 'SAP S/4HANA Cloud EU West',
    phase: 'Initial Bulk Load',
    status: 'ACTIVE_SYNC',
    startHour: 8,
    endHour: 20,
    progressPct: 42,
    elapsedDuration: '3h 10m elapsed',
    estimatedRemaining: '4h 50m remaining',
    allocatedVCPUs: 16,
    allocatedMemoryGb: 64,
    throughputGbSec: 3.10,
    parallelWorkerThreads: 20,
  },
  {
    id: 'gantt-106',
    customerId: 'cust-104',
    customerName: 'Global Heavy Industries',
    customerCode: 'GLOBAL-IND',
    jobName: 'SAP ECC 6.0 Table Index Pre-Flight',
    erpSource: 'SAP ECC 6.0',
    targetCloud: 'Azure SQL Managed Instance',
    phase: 'Pre-Flight Schema',
    status: 'ACTIVE_SYNC',
    startHour: 10,
    endHour: 15,
    progressPct: 25,
    elapsedDuration: '1h 05m elapsed',
    estimatedRemaining: '3h 25m remaining',
    allocatedVCPUs: 8,
    allocatedMemoryGb: 32,
    throughputGbSec: 0.95,
    parallelWorkerThreads: 8,
  },
  {
    id: 'gantt-107',
    customerId: 'cust-105',
    customerName: 'BioHealth Solutions',
    customerCode: 'BIOHEALTH',
    jobName: 'Healthcare EHR Patient Log Delta Stream',
    erpSource: 'Infor CloudSuite',
    targetCloud: 'Azure Health Data Services',
    phase: 'Cutover Validation',
    status: 'CATCHUP',
    startHour: 5,
    endHour: 19,
    progressPct: 55,
    elapsedDuration: '4h 50m elapsed',
    estimatedRemaining: '3h 30m remaining',
    allocatedVCPUs: 8,
    allocatedMemoryGb: 32,
    throughputGbSec: 1.80,
    parallelWorkerThreads: 10,
  },
];

export const MOCK_LIVE_ACTIVITY_EVENTS: LiveActivityEvent[] = [
  {
    id: 'act-101',
    timestamp: 'Just now (10:34:12)',
    customerId: 'cust-101',
    customerName: 'Contoso Pharmaceuticals',
    customerCode: 'CONT-PHARMA',
    partnerId: 'partner-avanade',
    partnerName: 'Avanade Global Migration Services',
    eventType: 'MIGRATION_START',
    severity: 'success',
    title: 'Delta Synchronization Engine Launched',
    description: 'High-throughput real-time CDC delta pipeline initiated for Dynamics 365 Finance & Operations staging cluster.',
    actor: 'Marcus Vance (Partner Lead)',
    actorRole: 'Partner Admin',
    metadata: {
      'Pipeline Engine': 'D365 FO CDC Relay',
      'Target Cloud': 'Azure US East',
      'Initial Rate': '2.14 GB/s',
      'Worker Nodes': 8,
    },
  },
  {
    id: 'act-102',
    timestamp: '2 mins ago',
    customerId: 'cust-102',
    customerName: 'Acme Retail Group',
    customerCode: 'ACME-RETAIL',
    partnerId: 'partner-avanade',
    partnerName: 'Avanade Global Migration Services',
    eventType: 'CONFIG_CHANGE',
    severity: 'info',
    title: 'Subscription Tier Upgraded to Enterprise',
    description: 'Customer commercial plan upgraded from Pro to Enterprise tier with 25 TB monthly storage quota & Priority SLA.',
    actor: 'Elena Rostova (Account Mgr)',
    actorRole: 'Partner Analyst',
    metadata: {
      'Old Tier': 'Pro ($12,000/mo)',
      'New Tier': 'Enterprise ($18,500/mo)',
      'Storage Quota': '25 TB',
      'Billing Cycle': 'Annual (-15%)',
    },
  },
  {
    id: 'act-103',
    timestamp: '5 mins ago',
    customerId: 'cust-103',
    customerName: 'Nordic Freight & Logistics',
    customerCode: 'NORDIC-LOG',
    partnerId: 'partner-avanade',
    partnerName: 'Avanade Global Migration Services',
    eventType: 'CLUSTER_PROVISION',
    severity: 'success',
    title: 'High-Throughput Tenant Cluster Provisioned',
    description: 'Dedicated Kubernetes worker node pool provisioned in Azure EU West with 12 isolated worker nodes.',
    actor: 'System Auto-Provisioner',
    actorRole: 'System Auto-Provisioner',
    metadata: {
      'Cluster ID': 'tenant-d365-03',
      'Allocated Nodes': 12,
      'RAM Capacity': '128 GB',
      'SSL cert': 'Auto-Renew Verified',
    },
  },
  {
    id: 'act-104',
    timestamp: '12 mins ago',
    customerId: 'cust-104',
    customerName: 'Global Heavy Industries',
    customerCode: 'GLOBAL-IND',
    partnerId: 'partner-pwc',
    partnerName: 'PwC ERP Advisory Practice',
    eventType: 'MIGRATION_START',
    severity: 'success',
    title: 'SAP S/4HANA Pre-Flight Validation Started',
    description: 'Schema compatibility verification and table index analysis initialized across 4,200 SAP GL & Material tables.',
    actor: 'Sarah Jenkins (PwC Lead)',
    actorRole: 'Partner Admin',
    metadata: {
      'Source ERP': 'SAP ECC 6.0 EHP8',
      'Target': 'SAP S/4HANA Cloud 2025',
      'Table Count': '4,280 tables',
    },
  },
  {
    id: 'act-105',
    timestamp: '18 mins ago',
    customerId: 'cust-101',
    customerName: 'Contoso Pharmaceuticals',
    customerCode: 'CONT-PHARMA',
    partnerId: 'partner-avanade',
    partnerName: 'Avanade Global Migration Services',
    eventType: 'LICENSE_ASSIGN',
    severity: 'info',
    title: 'D365 Enterprise Connector Seats Assigned',
    description: '10 additional license seats allocated from Avanade partner pool to tenant-d365-01.',
    actor: 'Marcus Vance (Partner Lead)',
    actorRole: 'Partner Admin',
    metadata: {
      'Package': 'Dynamics 365 FO Enterprise Connector',
      'Seats Added': 10,
      'Total Active': 15,
    },
  },
  {
    id: 'act-106',
    timestamp: '25 mins ago',
    customerId: 'cust-105',
    customerName: 'BioHealth Solutions',
    customerCode: 'BIOHEALTH',
    partnerId: 'partner-avanade',
    partnerName: 'Avanade Global Migration Services',
    eventType: 'HEALTH_ALERT',
    severity: 'warning',
    title: 'Storage Quota Threshold Warning (>85%)',
    description: 'Customer data volume reached 13.8 TB of 15.0 TB allocated quota. Automated warning dispatched.',
    actor: 'System Sentinel Monitor',
    actorRole: 'System Auto-Provisioner',
    metadata: {
      'Storage Used': '13.8 TB',
      'Quota Limit': '15.0 TB',
      'Capacity Used': '92%',
    },
  },
  {
    id: 'act-107',
    timestamp: '35 mins ago',
    customerId: 'cust-102',
    customerName: 'Acme Retail Group',
    customerCode: 'ACME-RETAIL',
    partnerId: 'partner-avanade',
    partnerName: 'Avanade Global Migration Services',
    eventType: 'MIGRATION_START',
    severity: 'success',
    title: 'Parallel CDC Worker Thread Pool Initialized',
    description: '4 parallel stream workers spun up for Oracle Fusion Cloud inventory delta catch-up.',
    actor: 'Jennifer Wu (Support Lead)',
    actorRole: 'Partner Support',
    metadata: {
      'Source System': 'Oracle Fusion Cloud',
      'Parallel Threads': 4,
      'Catchup Target': 'Zero Delta Backlog',
    },
  },
  {
    id: 'act-108',
    timestamp: '48 mins ago',
    customerId: 'cust-101',
    customerName: 'Contoso Pharmaceuticals',
    customerCode: 'CONT-PHARMA',
    partnerId: 'partner-avanade',
    partnerName: 'Avanade Global Migration Services',
    eventType: 'CONFIG_CHANGE',
    severity: 'info',
    title: 'SSO SAML Metadata Endpoint Re-bound',
    description: 'Okta Enterprise IdP metadata XML URL refreshed and ACS endpoint verified.',
    actor: 'Alexander Wright (IAM Analyst)',
    actorRole: 'Partner Analyst',
    metadata: {
      'Protocol': 'SAML 2.0',
      'IdP Issuer': 'https://contoso.okta.com',
      'Handshake Status': 'Verified',
    },
  },
];

