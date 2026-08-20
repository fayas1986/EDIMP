import React, { useState, useMemo } from 'react';
import { DataObject, ColumnProfile, Connector, FieldSchema } from '../types';
import { SOURCE_CUSTOMER_SCHEMA, SAMPLE_SOURCE_ROWS, COLUMN_PROFILES, TARGET_BC_CUSTOMER_SCHEMA, TARGET_COLUMN_PROFILES, INITIAL_CONNECTORS } from '../data/mockData';
import { fetchAiProfileData } from '../services/aiService';
import { DataProfilingSummary } from './DataProfilingSummary';
import { ProfilingReportsView } from './ProfilingReportsView';
import { SchemaDriftTrendGraph } from './SchemaDriftTrendGraph';
import { OverflowTableWrapper } from './OverflowTableWrapper';
import {
  Layers,
  Sparkles,
  Table,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  BarChart2,
  ShieldAlert,
  FileSpreadsheet,
  ShieldCheck,
  TrendingUp,
  Zap,
  ChevronDown,
  ChevronUp,
  Wand2,
  Building2,
  Database,
  Users,
  Briefcase,
  Server,
  Cloud,
  Code,
  Check,
  X,
  FolderTree,
  CheckSquare,
  Square,
  Sparkle,
  GitCompare,
} from 'lucide-react';

const renderConnectorIcon = (iconName: string, className?: string) => {
  switch (iconName) {
    case 'Building2':
      return <Building2 className={className || "w-4 h-4"} />;
    case 'Database':
      return <Database className={className || "w-4 h-4"} />;
    case 'FileSpreadsheet':
      return <FileSpreadsheet className={className || "w-4 h-4"} />;
    case 'Layers':
      return <Layers className={className || "w-4 h-4"} />;
    case 'Users':
      return <Users className={className || "w-4 h-4"} />;
    case 'Briefcase':
      return <Briefcase className={className || "w-4 h-4"} />;
    case 'Server':
      return <Server className={className || "w-4 h-4"} />;
    case 'Cloud':
      return <Cloud className={className || "w-4 h-4"} />;
    case 'Code':
      return <Code className={className || "w-4 h-4"} />;
    default:
      return <Layers className={className || "w-4 h-4"} />;
  }
};

const getMockSchemaAndProfileForConnector = (c: Connector) => {
  let fields: FieldSchema[] = [
    { fieldName: 'id', dataType: 'String' as const, isNullable: false, isPrimaryKey: true, sampleValue: 'CUST-00921', description: 'Unique Key ID' },
    { fieldName: 'name', dataType: 'String' as const, isNullable: false, sampleValue: 'Acme International', description: 'Legal Business Name' },
    { fieldName: 'status', dataType: 'String' as const, isNullable: true, sampleValue: 'Active', description: 'Account Status' },
    { fieldName: 'revenue', dataType: 'Decimal' as const, isNullable: true, sampleValue: '450000.00', description: 'Estimated Annual Revenue' },
    { fieldName: 'created_date', dataType: 'Date' as const, isNullable: true, sampleValue: '2026-08-01', description: 'Creation Timestamp' }
  ];

  if (c.category === 'CRM') {
    fields = [
      { fieldName: 'account_id', dataType: 'String' as const, isNullable: false, isPrimaryKey: true, sampleValue: 'ACC-88391', description: 'CRM Account Identifier' },
      { fieldName: 'company_name', dataType: 'String' as const, isNullable: false, sampleValue: 'Starlight Retail Inc' },
      { fieldName: 'contact_email', dataType: 'String' as const, isNullable: true, sampleValue: 'operations@starlight.com' },
      { fieldName: 'contact_phone', dataType: 'String' as const, isNullable: true, sampleValue: '+1-202-555-0143' },
      { fieldName: 'lead_source', dataType: 'String' as const, isNullable: true, sampleValue: 'Webinar' }
    ];
  } else if (c.category === 'Database') {
    fields = [
      { fieldName: 'uuid', dataType: 'String' as const, isNullable: false, isPrimaryKey: true, sampleValue: '550e8400-e29b-41d4-a716-446655440000' },
      { fieldName: 'org_name', dataType: 'String' as const, isNullable: false, sampleValue: 'Apex Industrial' },
      { fieldName: 'billing_address', dataType: 'String' as const, isNullable: true, sampleValue: '123 Enterprise Way' },
      { fieldName: 'postal_code', dataType: 'String' as const, isNullable: true, sampleValue: '90210' },
      { fieldName: 'is_active', dataType: 'Boolean' as const, isNullable: false, sampleValue: 'true' }
    ];
  } else if (c.category === 'Files') {
    fields = [
      { fieldName: 'Row_Index', dataType: 'Integer' as const, isNullable: false, isPrimaryKey: true, sampleValue: '1' },
      { fieldName: 'Client_Name', dataType: 'String' as const, isNullable: false, sampleValue: 'Novartis Ltd' },
      { fieldName: 'Postal_Address', dataType: 'String' as const, isNullable: true, sampleValue: '88 Swiss Parkway' },
      { fieldName: 'Phone_Num', dataType: 'String' as const, isNullable: true, sampleValue: '+41 61 123 4567' },
      { fieldName: 'Tax_Id', dataType: 'String' as const, isNullable: true, sampleValue: 'CHE-102.938.475' }
    ];
  }

  const profiles = fields.map(f => {
    return {
      columnName: f.fieldName,
      dataType: f.dataType,
      totalCount: 5000,
      nullCount: f.isNullable ? 450 : 0,
      nullPercentage: f.isNullable ? 9.0 : 0,
      uniqueCount: f.isPrimaryKey ? 5000 : 4200,
      uniquenessPercentage: f.isPrimaryKey ? 100 : 84.0,
      sampleValues: [f.sampleValue || ''],
      hasAnomalies: f.fieldName.toLowerCase().includes('phone') || f.fieldName.toLowerCase().includes('tax') || f.fieldName.toLowerCase().includes('email'),
      anomalyDescription: f.fieldName.toLowerCase().includes('phone') ? 'Various non-standard formatting conventions detected' : f.fieldName.toLowerCase().includes('email') ? 'Invalid syntax structures detected' : 'Format validation flags triggered'
    };
  });

  return {
    id: c.id,
    name: c.name,
    category: c.category,
    icon: c.icon || 'Database',
    schema: {
      id: `schema-${c.id}`,
      connectorId: c.id,
      name: `${c.name} Primary Table`,
      type: c.category === 'Database' ? 'SQL Table' : c.category === 'Files' ? 'Excel Sheet' : 'API Object',
      recordCount: 5000,
      qualityScore: 92,
      fields,
    },
    profiles,
  };
};

const AVAILABLE_DATASETS = [
  {
    id: 'conn-bc-prod',
    name: 'Dynamics 365 Business Central (Prod)',
    category: 'ERP',
    icon: 'Building2',
    schema: TARGET_BC_CUSTOMER_SCHEMA,
    profiles: TARGET_COLUMN_PROFILES,
  },
  {
    id: 'conn-excel-files',
    name: 'Customer Master Excel (.xlsx)',
    category: 'Files',
    icon: 'FileSpreadsheet',
    schema: SOURCE_CUSTOMER_SCHEMA,
    profiles: COLUMN_PROFILES,
  },
  {
    id: 'conn-sfdc-main',
    name: 'Salesforce Enterprise CRM',
    category: 'CRM',
    icon: 'Users',
    schema: {
      id: 'obj-sfdc-acct',
      connectorId: 'conn-sfdc-main',
      name: 'Account (Salesforce CRM SOQL)',
      type: 'SOQL Table',
      recordCount: 12000,
      qualityScore: 92,
      fields: [
        { fieldName: 'Id', dataType: 'String', isNullable: false, isPrimaryKey: true, sampleValue: '0018000000abcDE', description: 'Unique Salesforce ID' },
        { fieldName: 'Name', dataType: 'String', isNullable: false, sampleValue: 'Acme Logistics & Trade Corp', description: 'Account Name' },
        { fieldName: 'BillingStreet', dataType: 'String', isNullable: true, sampleValue: '742 Evergreen Terrace' },
        { fieldName: 'BillingCity', dataType: 'String', isNullable: true, sampleValue: 'Springfield' },
        { fieldName: 'BillingState', dataType: 'String', isNullable: true, sampleValue: 'IL' },
        { fieldName: 'BillingPostalCode', dataType: 'String', isNullable: true, sampleValue: '62704' },
        { fieldName: 'BillingCountry', dataType: 'String', isNullable: true, sampleValue: 'US' },
        { fieldName: 'Phone', dataType: 'String', isNullable: true, sampleValue: '+1 (555) 234-5678' },
        { fieldName: 'Website', dataType: 'String', isNullable: true, sampleValue: 'https://acmelogistics.com' },
        { fieldName: 'AnnualRevenue', dataType: 'Decimal', isNullable: true, sampleValue: '2500000.00' },
        { fieldName: 'Industry', dataType: 'String', isNullable: true, sampleValue: 'Logistics' },
      ],
    },
    profiles: [
      { columnName: 'Id', dataType: 'String', totalCount: 12000, nullCount: 0, nullPercentage: 0, uniqueCount: 12000, uniquenessPercentage: 100, sampleValues: ['0018000000abcDE'], hasAnomalies: false },
      { columnName: 'Name', dataType: 'String', totalCount: 12000, nullCount: 0, nullPercentage: 0, uniqueCount: 11800, uniquenessPercentage: 98.3, sampleValues: ['Acme Logistics', 'Global Tech'], hasAnomalies: false },
      { columnName: 'BillingStreet', dataType: 'String', totalCount: 12000, nullCount: 340, nullPercentage: 2.8, uniqueCount: 10400, uniquenessPercentage: 86.6, sampleValues: ['742 Evergreen Terrace'], hasAnomalies: false },
      { columnName: 'BillingCity', dataType: 'String', totalCount: 12000, nullCount: 45, nullPercentage: 0.3, uniqueCount: 420, uniquenessPercentage: 3.5, sampleValues: ['Springfield'], hasAnomalies: false },
      { columnName: 'BillingState', dataType: 'String', totalCount: 12000, nullCount: 112, nullPercentage: 0.9, uniqueCount: 50, uniquenessPercentage: 0.4, sampleValues: ['IL'], hasAnomalies: false },
      { columnName: 'BillingPostalCode', dataType: 'String', totalCount: 12000, nullCount: 68, nullPercentage: 0.5, uniqueCount: 8900, uniquenessPercentage: 74.1, sampleValues: ['62704'], hasAnomalies: false },
      { columnName: 'BillingCountry', dataType: 'String', totalCount: 12000, nullCount: 0, nullPercentage: 0, uniqueCount: 15, uniquenessPercentage: 0.12, sampleValues: ['US'], hasAnomalies: false },
      { columnName: 'Phone', dataType: 'String', totalCount: 12000, nullCount: 210, nullPercentage: 1.7, uniqueCount: 11200, uniquenessPercentage: 93.3, sampleValues: ['+1 (555) 234-5678'], hasAnomalies: true, anomalyDescription: 'Non-standardized phone format' },
      { columnName: 'Website', dataType: 'String', totalCount: 12000, nullCount: 1250, nullPercentage: 10.4, uniqueCount: 9400, uniquenessPercentage: 78.3, sampleValues: ['https://acmelogistics.com'], hasAnomalies: false },
      { columnName: 'AnnualRevenue', dataType: 'Decimal', totalCount: 12000, nullCount: 1800, nullPercentage: 15.0, uniqueCount: 450, uniquenessPercentage: 3.75, sampleValues: ['2500000.00'], hasAnomalies: false },
      { columnName: 'Industry', dataType: 'String', totalCount: 12000, nullCount: 420, nullPercentage: 3.5, uniqueCount: 18, uniquenessPercentage: 0.15, sampleValues: ['Logistics'], hasAnomalies: false },
    ],
  },
  {
    id: 'conn-sap-s4',
    name: 'SAP S/4HANA Cloud Engine',
    category: 'ERP',
    icon: 'Layers',
    schema: {
      id: 'obj-sap-kna1',
      connectorId: 'conn-sap-s4',
      name: 'SAP Customer Master (KNA1)',
      type: 'RFC Table',
      recordCount: 48500,
      qualityScore: 95,
      fields: [
        { fieldName: 'KUNNR', dataType: 'String', isNullable: false, isPrimaryKey: true, sampleValue: '0001002341', description: 'Customer Account Number' },
        { fieldName: 'NAME1', dataType: 'String', isNullable: false, sampleValue: 'Acme Logistics & Trade Corp', description: 'Name 1' },
        { fieldName: 'STRAS', dataType: 'String', isNullable: true, sampleValue: '742 Evergreen Terrace' },
        { fieldName: 'ORT01', dataType: 'String', isNullable: true, sampleValue: 'Springfield' },
        { fieldName: 'REGIO', dataType: 'String', isNullable: true, sampleValue: 'IL' },
        { fieldName: 'PSTLZ', dataType: 'String', isNullable: true, sampleValue: '62704' },
        { fieldName: 'LAND1', dataType: 'String', isNullable: true, sampleValue: 'US' },
        { fieldName: 'TELF1', dataType: 'String', isNullable: true, sampleValue: '+1 (555) 234-5678' },
        { fieldName: 'SMTP_ADDR', dataType: 'String', isNullable: true, sampleValue: 'billing@acmelogistics.com' },
        { fieldName: 'STCEG', dataType: 'String', isNullable: true, sampleValue: 'US-883921049', description: 'VAT Registration Number' },
        { fieldName: 'KLIMK', dataType: 'Decimal', isNullable: true, sampleValue: '250000.00', description: 'Customer Credit Limit' },
      ],
    },
    profiles: [
      { columnName: 'KUNNR', dataType: 'String', totalCount: 48500, nullCount: 0, nullPercentage: 0, uniqueCount: 48500, uniquenessPercentage: 100, sampleValues: ['0001002341'], hasAnomalies: false },
      { columnName: 'NAME1', dataType: 'String', totalCount: 48500, nullCount: 0, nullPercentage: 0, uniqueCount: 47200, uniquenessPercentage: 97.3, sampleValues: ['Acme Logistics GMBH'], hasAnomalies: false },
      { columnName: 'STRAS', dataType: 'String', totalCount: 48500, nullCount: 940, nullPercentage: 1.9, uniqueCount: 42100, uniquenessPercentage: 86.8, sampleValues: ['Industriestrasse 42'], hasAnomalies: false },
      { columnName: 'ORT01', dataType: 'String', totalCount: 48500, nullCount: 200, nullPercentage: 0.4, uniqueCount: 1540, uniquenessPercentage: 3.1, sampleValues: ['Frankfurt'], hasAnomalies: false },
      { columnName: 'REGIO', dataType: 'String', totalCount: 48500, nullCount: 420, nullPercentage: 0.8, uniqueCount: 120, uniquenessPercentage: 0.24, sampleValues: ['HE'], hasAnomalies: false },
      { columnName: 'PSTLZ', dataType: 'String', totalCount: 48500, nullCount: 340, nullPercentage: 0.7, uniqueCount: 22000, uniquenessPercentage: 45.3, sampleValues: ['60311'], hasAnomalies: false },
      { columnName: 'LAND1', dataType: 'String', totalCount: 48500, nullCount: 0, nullPercentage: 0, uniqueCount: 42, uniquenessPercentage: 0.08, sampleValues: ['DE'], hasAnomalies: false },
      { columnName: 'TELF1', dataType: 'String', totalCount: 48500, nullCount: 1205, nullPercentage: 2.4, uniqueCount: 41200, uniquenessPercentage: 84.9, sampleValues: ['+49 69 1234 5678'], hasAnomalies: true, anomalyDescription: 'Non-standardized formats' },
      { columnName: 'SMTP_ADDR', dataType: 'String', totalCount: 48500, nullCount: 380, nullPercentage: 0.78, uniqueCount: 46100, uniquenessPercentage: 95.0, sampleValues: ['billing@acme.de'], hasAnomalies: false },
      { columnName: 'STCEG', dataType: 'String', totalCount: 48500, nullCount: 4800, nullPercentage: 9.8, uniqueCount: 38200, uniquenessPercentage: 78.7, sampleValues: ['DE123456789'], hasAnomalies: false },
      { columnName: 'KLIMK', dataType: 'Decimal', totalCount: 48500, nullCount: 12500, nullPercentage: 25.7, uniqueCount: 840, uniquenessPercentage: 1.73, sampleValues: ['1000000.00'], hasAnomalies: false },
    ],
  },
  {
    id: 'conn-sql-legacy',
    name: 'SQL Server - Legacy ERP DB',
    category: 'Database',
    icon: 'Database',
    schema: {
      id: 'obj-sql-legacy',
      connectorId: 'conn-sql-legacy',
      name: 'dbo.tbl_Customer_Legacy',
      type: 'SQL Table',
      recordCount: 95000,
      qualityScore: 84,
      fields: [
        { fieldName: 'cust_id', dataType: 'String', isNullable: false, isPrimaryKey: true, sampleValue: 'C-1002', description: 'Legacy Customer primary key' },
        { fieldName: 'cust_company_name', dataType: 'String', isNullable: false, sampleValue: 'Acme Logistics & Trade Corp' },
        { fieldName: 'cust_addr_street', dataType: 'String', isNullable: true, sampleValue: '742 Evergreen Terrace' },
        { fieldName: 'cust_addr_city', dataType: 'String', isNullable: true, sampleValue: 'Springfield' },
        { fieldName: 'cust_addr_state', dataType: 'String', isNullable: true, sampleValue: 'IL' },
        { fieldName: 'cust_addr_zip', dataType: 'String', isNullable: true, sampleValue: '62704' },
        { fieldName: 'cust_country_code', dataType: 'String', isNullable: true, sampleValue: 'US' },
        { fieldName: 'cust_phone_no', dataType: 'String', isNullable: true, sampleValue: '+1 (555) 234-5678' },
        { fieldName: 'cust_email_address', dataType: 'String', isNullable: true, sampleValue: 'billing@acmelogistics.com' },
        { fieldName: 'cust_tax_no', dataType: 'String', isNullable: true, sampleValue: 'US-883921049' },
        { fieldName: 'cust_credit_limit', dataType: 'Decimal', isNullable: true, sampleValue: '250000.00' },
      ],
    },
    profiles: [
      { columnName: 'cust_id', dataType: 'String', totalCount: 95000, nullCount: 0, nullPercentage: 0, uniqueCount: 95000, uniquenessPercentage: 100, sampleValues: ['C-1002'], hasAnomalies: false },
      { columnName: 'cust_company_name', dataType: 'String', totalCount: 95000, nullCount: 0, nullPercentage: 0, uniqueCount: 92100, uniquenessPercentage: 96.9, sampleValues: ['Acme Logistics'], hasAnomalies: false },
      { columnName: 'cust_addr_street', dataType: 'String', totalCount: 95000, nullCount: 4210, nullPercentage: 4.4, uniqueCount: 84500, uniquenessPercentage: 88.9, sampleValues: ['742 Evergreen Terrace'], hasAnomalies: false },
      { columnName: 'cust_addr_city', dataType: 'String', totalCount: 95000, nullCount: 120, nullPercentage: 0.12, uniqueCount: 4210, uniquenessPercentage: 4.4, sampleValues: ['Springfield'], hasAnomalies: false },
      { columnName: 'cust_addr_state', dataType: 'String', totalCount: 95000, nullCount: 2200, nullPercentage: 2.3, uniqueCount: 154, uniquenessPercentage: 0.16, sampleValues: ['IL'], hasAnomalies: false },
      { columnName: 'cust_addr_zip', dataType: 'String', totalCount: 95000, nullCount: 1100, nullPercentage: 1.1, uniqueCount: 65000, uniquenessPercentage: 68.4, sampleValues: ['62704'], hasAnomalies: false },
      { columnName: 'cust_country_code', dataType: 'String', totalCount: 95000, nullCount: 0, nullPercentage: 0, uniqueCount: 54, uniquenessPercentage: 0.05, sampleValues: ['US'], hasAnomalies: false },
      { columnName: 'cust_phone_no', dataType: 'String', totalCount: 95000, nullCount: 8900, nullPercentage: 9.3, uniqueCount: 81000, uniquenessPercentage: 85.2, sampleValues: ['+1 (555) 234-5678'], hasAnomalies: true, anomalyDescription: 'Non-standard phone strings' },
      { columnName: 'cust_email_address', dataType: 'String', totalCount: 95000, nullCount: 12000, nullPercentage: 12.6, uniqueCount: 78000, uniquenessPercentage: 82.1, sampleValues: ['billing@acme.com'], hasAnomalies: true, anomalyDescription: '89 syntax issues detected' },
      { columnName: 'cust_tax_no', dataType: 'String', totalCount: 95000, nullCount: 22000, nullPercentage: 23.1, uniqueCount: 61000, uniquenessPercentage: 64.2, sampleValues: ['US-883921049'], hasAnomalies: false },
      { columnName: 'cust_credit_limit', dataType: 'Decimal', totalCount: 95000, nullCount: 45000, nullPercentage: 47.3, uniqueCount: 1200, uniquenessPercentage: 1.26, sampleValues: ['250000.00'], hasAnomalies: false },
    ],
  },
  {
    id: 'conn-d365-fo',
    name: 'Dynamics 365 Finance & Operations',
    category: 'ERP',
    icon: 'Briefcase',
    schema: {
      id: 'obj-d365-fo',
      connectorId: 'conn-d365-fo',
      name: 'CustCustomerV3Entity',
      type: 'OData Entity',
      recordCount: 18000,
      qualityScore: 97,
      fields: [
        { fieldName: 'CustomerAccount', dataType: 'String', isNullable: false, isPrimaryKey: true, sampleValue: 'US-0012', description: 'Customer Account ID' },
        { fieldName: 'OrganizationName', dataType: 'String', isNullable: false, sampleValue: 'Acme Logistics & Trade Corp' },
        { fieldName: 'AddressStreet', dataType: 'String', isNullable: true, sampleValue: '742 Evergreen Terrace' },
        { fieldName: 'AddressCity', dataType: 'String', isNullable: true, sampleValue: 'Springfield' },
        { fieldName: 'AddressState', dataType: 'String', isNullable: true, sampleValue: 'IL' },
        { fieldName: 'AddressZipCode', dataType: 'String', isNullable: true, sampleValue: '62704' },
        { fieldName: 'AddressCountryRegionId', dataType: 'String', isNullable: true, sampleValue: 'USA' },
        { fieldName: 'PrimaryContactPhone', dataType: 'String', isNullable: true, sampleValue: '+1 (555) 234-5678' },
        { fieldName: 'PrimaryContactEmail', dataType: 'String', isNullable: true, sampleValue: 'billing@acmelogistics.com' },
        { fieldName: 'FederalTaxID', dataType: 'String', isNullable: true, sampleValue: 'US-883921049' },
        { fieldName: 'SalesCurrencyCode', dataType: 'String', isNullable: true, sampleValue: 'USD' },
      ],
    },
    profiles: [
      { columnName: 'CustomerAccount', dataType: 'String', totalCount: 18000, nullCount: 0, nullPercentage: 0, uniqueCount: 18000, uniquenessPercentage: 100, sampleValues: ['US-0012'], hasAnomalies: false },
      { columnName: 'OrganizationName', dataType: 'String', totalCount: 18000, nullCount: 0, nullPercentage: 0, uniqueCount: 17800, uniquenessPercentage: 98.8, sampleValues: ['Acme Logistics'], hasAnomalies: false },
      { columnName: 'AddressStreet', dataType: 'String', totalCount: 18000, nullCount: 120, nullPercentage: 0.6, uniqueCount: 16500, uniquenessPercentage: 91.6, sampleValues: ['742 Evergreen Terrace'], hasAnomalies: false },
      { columnName: 'AddressCity', dataType: 'String', totalCount: 18000, nullCount: 10, nullPercentage: 0.05, uniqueCount: 450, uniquenessPercentage: 2.5, sampleValues: ['Springfield'], hasAnomalies: false },
      { columnName: 'AddressState', dataType: 'String', totalCount: 18000, nullCount: 300, nullPercentage: 1.6, uniqueCount: 50, uniquenessPercentage: 0.27, sampleValues: ['IL'], hasAnomalies: false },
      { columnName: 'AddressZipCode', dataType: 'String', totalCount: 18000, nullCount: 150, nullPercentage: 0.8, uniqueCount: 12500, uniquenessPercentage: 69.4, sampleValues: ['62704'], hasAnomalies: false },
      { columnName: 'AddressCountryRegionId', dataType: 'String', totalCount: 18000, nullCount: 0, nullPercentage: 0, uniqueCount: 12, uniquenessPercentage: 0.06, sampleValues: ['USA'], hasAnomalies: false },
      { columnName: 'PrimaryContactPhone', dataType: 'String', totalCount: 18000, nullCount: 450, nullPercentage: 2.5, uniqueCount: 16100, uniquenessPercentage: 89.4, sampleValues: ['+1 (555) 234-5678'], hasAnomalies: false },
      { columnName: 'PrimaryContactEmail', dataType: 'String', totalCount: 18000, nullCount: 80, nullPercentage: 0.4, uniqueCount: 17400, uniquenessPercentage: 96.6, sampleValues: ['billing@acme.com'], hasAnomalies: false },
      { columnName: 'FederalTaxID', dataType: 'String', totalCount: 18000, nullCount: 1200, nullPercentage: 6.6, uniqueCount: 15400, uniquenessPercentage: 85.5, sampleValues: ['US-883921049'], hasAnomalies: false },
      { columnName: 'SalesCurrencyCode', dataType: 'String', totalCount: 18000, nullCount: 0, nullPercentage: 0, uniqueCount: 4, uniquenessPercentage: 0.02, sampleValues: ['USD'], hasAnomalies: false },
    ],
  },
  {
    id: 'conn-postgres-warehouse',
    name: 'PostgreSQL Staging Warehouse',
    category: 'Database',
    icon: 'Server',
    schema: {
      id: 'obj-postgres-stage',
      connectorId: 'conn-postgres-warehouse',
      name: 'staging.customer_master_consolidated',
      type: 'PostgreSQL Table',
      recordCount: 150000,
      qualityScore: 94,
      fields: [
        { fieldName: 'uuid', dataType: 'String', isNullable: false, isPrimaryKey: true, sampleValue: 'a0eebc99-9c0b', description: 'Consolidated UUID' },
        { fieldName: 'src_id', dataType: 'String', isNullable: false, sampleValue: 'CUS-10029', description: 'Original source ID reference' },
        { fieldName: 'company_name', dataType: 'String', isNullable: false, sampleValue: 'Acme Logistics & Trade Corp' },
        { fieldName: 'street', dataType: 'String', isNullable: true, sampleValue: '742 Evergreen Terrace' },
        { fieldName: 'city', dataType: 'String', isNullable: true, sampleValue: 'Springfield' },
        { fieldName: 'state', dataType: 'String', isNullable: true, sampleValue: 'IL' },
        { fieldName: 'zip_code', dataType: 'String', isNullable: true, sampleValue: '62704' },
        { fieldName: 'country', dataType: 'String', isNullable: true, sampleValue: 'US' },
        { fieldName: 'phone', dataType: 'String', isNullable: true, sampleValue: '+1 (555) 234-5678' },
        { fieldName: 'email', dataType: 'String', isNullable: true, sampleValue: 'billing@acmelogistics.com' },
      ],
    },
    profiles: [
      { columnName: 'uuid', dataType: 'String', totalCount: 150000, nullCount: 0, nullPercentage: 0, uniqueCount: 150000, uniquenessPercentage: 100, sampleValues: ['a0eebc99-9c0b'], hasAnomalies: false },
      { columnName: 'src_id', dataType: 'String', totalCount: 150000, nullCount: 0, nullPercentage: 0, uniqueCount: 142100, uniquenessPercentage: 94.7, sampleValues: ['CUS-10029'], hasAnomalies: false },
      { columnName: 'company_name', dataType: 'String', totalCount: 150000, nullCount: 0, nullPercentage: 0, uniqueCount: 139500, uniquenessPercentage: 93.0, sampleValues: ['Acme Logistics'], hasAnomalies: false },
      { columnName: 'street', dataType: 'String', totalCount: 150000, nullCount: 8200, nullPercentage: 5.4, uniqueCount: 129000, uniquenessPercentage: 86.0, sampleValues: ['742 Evergreen Terrace'], hasAnomalies: false },
      { columnName: 'city', dataType: 'String', totalCount: 150000, nullCount: 1500, nullPercentage: 1.0, uniqueCount: 8400, uniquenessPercentage: 5.6, sampleValues: ['Springfield'], hasAnomalies: false },
      { columnName: 'state', dataType: 'String', totalCount: 150000, nullCount: 4200, nullPercentage: 2.8, uniqueCount: 650, uniquenessPercentage: 0.43, sampleValues: ['IL'], hasAnomalies: false },
      { columnName: 'zip_code', dataType: 'String', totalCount: 150000, nullCount: 1800, nullPercentage: 1.2, uniqueCount: 92000, uniquenessPercentage: 61.3, sampleValues: ['62704'], hasAnomalies: false },
      { columnName: 'country', dataType: 'String', totalCount: 150000, nullCount: 0, nullPercentage: 0, uniqueCount: 110, uniquenessPercentage: 0.07, sampleValues: ['US'], hasAnomalies: false },
      { columnName: 'phone', dataType: 'String', totalCount: 150000, nullCount: 4120, nullPercentage: 2.7, uniqueCount: 131000, uniquenessPercentage: 87.3, sampleValues: ['+1 (555) 234-5678'], hasAnomalies: false },
      { columnName: 'email', dataType: 'String', totalCount: 150000, nullCount: 850, nullPercentage: 0.5, uniqueCount: 145000, uniquenessPercentage: 96.6, sampleValues: ['billing@acmelogistics.com'], hasAnomalies: false },
    ],
  },
  {
    id: 'conn-sharepoint-docs',
    name: 'SharePoint Document Library',
    category: 'Cloud Storage',
    icon: 'Cloud',
    schema: {
      id: 'obj-sharepoint-csv',
      connectorId: 'conn-sharepoint-docs',
      name: 'SharePoint - Customer List.csv',
      type: 'CSV File',
      recordCount: 5000,
      qualityScore: 78,
      fields: [
        { fieldName: 'CSV_Row_ID', dataType: 'String', isNullable: false, isPrimaryKey: true, sampleValue: '1', description: 'Auto-increment key' },
        { fieldName: 'Business_Name', dataType: 'String', isNullable: false, sampleValue: 'Acme Logistics & Trade Corp' },
        { fieldName: 'Street_Line_1', dataType: 'String', isNullable: true, sampleValue: '742 Evergreen Terrace' },
        { fieldName: 'City_Name', dataType: 'String', isNullable: true, sampleValue: 'Springfield' },
        { fieldName: 'State_Name', dataType: 'String', isNullable: true, sampleValue: 'IL' },
        { fieldName: 'Postal_Code', dataType: 'String', isNullable: true, sampleValue: '62704' },
        { fieldName: 'Country', dataType: 'String', isNullable: true, sampleValue: 'US' },
        { fieldName: 'Telephone_No', dataType: 'String', isNullable: true, sampleValue: '+1 (555) 234-5678' },
      ],
    },
    profiles: [
      { columnName: 'CSV_Row_ID', dataType: 'String', totalCount: 5000, nullCount: 0, nullPercentage: 0, uniqueCount: 5000, uniquenessPercentage: 100, sampleValues: ['1'], hasAnomalies: false },
      { columnName: 'Business_Name', dataType: 'String', totalCount: 5000, nullCount: 0, nullPercentage: 0, uniqueCount: 4850, uniquenessPercentage: 97.0, sampleValues: ['Acme Logistics'], hasAnomalies: false },
      { columnName: 'Street_Line_1', dataType: 'String', totalCount: 5000, nullCount: 120, nullPercentage: 2.4, uniqueCount: 4100, uniquenessPercentage: 82.0, sampleValues: ['742 Evergreen Terrace'], hasAnomalies: false },
      { columnName: 'City_Name', dataType: 'String', totalCount: 5000, nullCount: 50, nullPercentage: 1.0, uniqueCount: 180, uniquenessPercentage: 3.6, sampleValues: ['Springfield'], hasAnomalies: false },
      { columnName: 'State_Name', dataType: 'String', totalCount: 5000, nullCount: 80, nullPercentage: 1.6, uniqueCount: 45, uniquenessPercentage: 0.9, sampleValues: ['IL'], hasAnomalies: false },
      { columnName: 'Postal_Code', dataType: 'String', totalCount: 5000, nullCount: 110, nullPercentage: 2.2, uniqueCount: 3200, uniquenessPercentage: 64.0, sampleValues: ['62704'], hasAnomalies: false },
      { columnName: 'Country', dataType: 'String', totalCount: 5000, nullCount: 0, nullPercentage: 0, uniqueCount: 8, uniquenessPercentage: 0.16, sampleValues: ['US'], hasAnomalies: false },
      { columnName: 'Telephone_No', dataType: 'String', totalCount: 5000, nullCount: 310, nullPercentage: 6.2, uniqueCount: 4400, uniquenessPercentage: 88.0, sampleValues: ['+1 (555) 234-5678'], hasAnomalies: true, anomalyDescription: 'Various syntax variants' },
    ],
  },
  {
    id: 'conn-custom-rest',
    name: 'Legacy HRMS REST API Endpoint',
    category: 'Custom API',
    icon: 'Code',
    schema: {
      id: 'obj-hrms-api',
      connectorId: 'conn-custom-rest',
      name: 'REST API /employees GET Response',
      type: 'JSON Body',
      recordCount: 1250,
      qualityScore: 91,
      fields: [
        { fieldName: 'emp_code', dataType: 'String', isNullable: false, isPrimaryKey: true, sampleValue: 'EMP-9921', description: 'Employee Unique ID' },
        { fieldName: 'full_name', dataType: 'String', isNullable: false, sampleValue: 'Acme Logistics & Trade Corp' },
        { fieldName: 'office_street', dataType: 'String', isNullable: true, sampleValue: '742 Evergreen Terrace' },
        { fieldName: 'office_city', dataType: 'String', isNullable: true, sampleValue: 'Springfield' },
        { fieldName: 'office_state', dataType: 'String', isNullable: true, sampleValue: 'IL' },
        { fieldName: 'office_zip', dataType: 'String', isNullable: true, sampleValue: '62704' },
        { fieldName: 'work_phone', dataType: 'String', isNullable: true, sampleValue: '+1 (555) 234-5678' },
        { fieldName: 'work_email', dataType: 'String', isNullable: true, sampleValue: 'billing@acmelogistics.com' },
      ],
    },
    profiles: [
      { columnName: 'emp_code', dataType: 'String', totalCount: 1250, nullCount: 0, nullPercentage: 0, uniqueCount: 1250, uniquenessPercentage: 100, sampleValues: ['EMP-9921'], hasAnomalies: false },
      { columnName: 'full_name', dataType: 'String', totalCount: 1250, nullCount: 0, nullPercentage: 0, uniqueCount: 1240, uniquenessPercentage: 99.2, sampleValues: ['Johnathan Doe'], hasAnomalies: false },
      { columnName: 'office_street', dataType: 'String', totalCount: 1250, nullCount: 10, nullPercentage: 0.8, uniqueCount: 1100, uniquenessPercentage: 88.0, sampleValues: ['742 Evergreen Terrace'], hasAnomalies: false },
      { columnName: 'office_city', dataType: 'String', totalCount: 1250, nullCount: 5, nullPercentage: 0.4, uniqueCount: 85, uniquenessPercentage: 6.8, sampleValues: ['Springfield'], hasAnomalies: false },
      { columnName: 'office_state', dataType: 'String', totalCount: 1250, nullCount: 12, nullPercentage: 0.96, uniqueCount: 18, uniquenessPercentage: 1.44, sampleValues: ['IL'], hasAnomalies: false },
      { columnName: 'office_zip', dataType: 'String', totalCount: 1250, nullCount: 8, nullPercentage: 0.64, uniqueCount: 950, uniquenessPercentage: 76.0, sampleValues: ['62704'], hasAnomalies: false },
      { columnName: 'work_phone', dataType: 'String', totalCount: 1250, nullCount: 42, nullPercentage: 3.36, uniqueCount: 1180, uniquenessPercentage: 94.4, sampleValues: ['+1 (555) 234-5678'], hasAnomalies: false },
      { columnName: 'work_email', dataType: 'String', totalCount: 1250, nullCount: 2, nullPercentage: 0.16, uniqueCount: 1245, uniquenessPercentage: 99.6, sampleValues: ['john.doe@acme..com'], hasAnomalies: true, anomalyDescription: 'Consecutive dots typo' },
    ],
  },
];

interface DiscoveryViewProps {
  onProceedToMapping: () => void;
  connectors?: Connector[];
}

export const DiscoveryView: React.FC<DiscoveryViewProps> = ({ onProceedToMapping, connectors }) => {
  const allConnectors = useMemo(() => {
    return connectors && connectors.length > 0 ? connectors : INITIAL_CONNECTORS;
  }, [connectors]);

  const allDatasets = useMemo(() => {
    return allConnectors.map(c => {
      const existing = AVAILABLE_DATASETS.find(d => d.id === c.id);
      if (existing) {
        return {
          ...existing,
          name: c.name,
          category: c.category,
        };
      }
      return getMockSchemaAndProfileForConnector(c);
    });
  }, [allConnectors]);

  // Manage source/target dropdown selection
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>(['conn-excel-files']);
  const [selectedTargetIds, setSelectedTargetIds] = useState<string[]>(['conn-bc-prod']);

  const selectedDatasetIds = useMemo(() => {
    return Array.from(new Set([...selectedSourceIds, ...selectedTargetIds]));
  }, [selectedSourceIds, selectedTargetIds]);

  const [sourceDropdownOpen, setSourceDropdownOpen] = useState<boolean>(false);
  const [targetDropdownOpen, setTargetDropdownOpen] = useState<boolean>(false);

  const [sourceSearch, setSourceSearch] = useState<string>('');
  const [targetSearch, setTargetSearch] = useState<string>('');

  const [comparisonMode, setComparisonMode] = useState<boolean>(true);
  const [connectorCategoryFilter, setConnectorCategoryFilter] = useState<string>('All');
  const [connectorSearch, setConnectorSearch] = useState<string>('');
  
  const [activeSubTab, setActiveSubTab] = useState<'profiler' | 'visualizer' | 'reports' | 'preview' | 'drift'>('drift');
  const [qualityScore, setQualityScore] = useState<number>(89);
  const [isProfiling, setIsProfiling] = useState<boolean>(false);
  const [isMalformedDetailsOpen, setIsMalformedDetailsOpen] = useState<boolean>(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([
    'Format telephone numbers into international E.164 standard before import',
    '3 records contain invalid GST/Tax ID strings ("INVALID_TAX")',
    'Fill default payment terms "NET30" for 12 null entries',
  ]);
  const [previewFilter, setPreviewFilter] = useState('');

  const selectedDatasets = useMemo(() => {
    return allDatasets.filter(d => selectedDatasetIds.includes(d.id));
  }, [selectedDatasetIds, allDatasets]);

  const primaryDataset = useMemo(() => {
    return selectedDatasets[0] || allDatasets[0] || AVAILABLE_DATASETS[0];
  }, [selectedDatasets, allDatasets]);

  const selectedEntity = useMemo(() => {
    return primaryDataset?.schema || TARGET_BC_CUSTOMER_SCHEMA;
  }, [primaryDataset]);

  const columnProfiles = useMemo(() => {
    return primaryDataset?.profiles || TARGET_COLUMN_PROFILES;
  }, [primaryDataset]);

  // Dynamic malformed fields calculations
  const totalRecords = useMemo(() => {
    if (!selectedEntity.recordCount) return 14250;
    return parseInt(String(selectedEntity.recordCount).replace(/,/g, ''), 10) || 14250;
  }, [selectedEntity]);

  const totalFields = useMemo(() => {
    return totalRecords * columnProfiles.length;
  }, [totalRecords, columnProfiles]);

  const columnMalformedStats = useMemo(() => {
    return columnProfiles.map((col) => {
      let malformedCount = 0;
      let issueType = 'Clean / Compliant';
      let severity: 'low' | 'medium' | 'high' = 'low';

      if (col.hasAnomalies) {
        malformedCount = Math.round(totalRecords * 0.142);
        issueType = col.anomalyDescription || 'Format non-compliance & placeholder values';
        severity = 'high';
      } else if (col.nullPercentage > 10) {
        malformedCount = Math.round(totalRecords * (col.nullPercentage / 100));
        issueType = `${col.nullPercentage}% null/missing values`;
        severity = 'medium';
      } else if (col.nullPercentage > 0) {
        malformedCount = Math.round(totalRecords * (col.nullPercentage / 100));
        issueType = `Minor null padding (${col.nullPercentage}%)`;
        severity = 'low';
      }

      const percentage = totalRecords > 0 ? ((malformedCount / totalRecords) * 100).toFixed(1) : '0.0';
      return {
        ...col,
        malformedCount,
        malformedPercentage: parseFloat(percentage),
        issueType,
        severity,
      };
    });
  }, [columnProfiles, totalRecords]);

  const totalMalformedValues = useMemo(() => {
    return columnMalformedStats.reduce((sum, col) => sum + col.malformedCount, 0);
  }, [columnMalformedStats]);

  const malformedPercentageTotal = useMemo(() => {
    if (!totalFields) return '0.0';
    return ((totalMalformedValues / totalFields) * 100).toFixed(1);
  }, [totalMalformedValues, totalFields]);

  const handleRunAiProfiling = async () => {
    setIsProfiling(true);
    try {
      const res = await fetchAiProfileData(
        selectedEntity.name,
        SAMPLE_SOURCE_ROWS,
        columnProfiles
      );
      if (res.success) {
        setQualityScore(res.qualityScore || 91);
        if (res.cleansingSuggestions && res.cleansingSuggestions.length > 0) {
          setAiSuggestions(res.cleansingSuggestions);
        }
      }
    } catch (err) {
      console.error('Failed to run AI profiling:', err);
    } finally {
      setIsProfiling(false);
    }
  };

  const filteredRows = useMemo(() => {
    return SAMPLE_SOURCE_ROWS.filter((row) =>
      Object.values(row).some((val) =>
        String(val).toLowerCase().includes(previewFilter.toLowerCase())
      )
    );
  }, [previewFilter]);

  // Dynamic stats calculation
  const totalCols = useMemo(() => columnProfiles.length, [columnProfiles]);
  const stringCols = useMemo(() => columnProfiles.filter(c => ["STRING", "TEXT", "VARCHAR"].includes(c.dataType.toUpperCase())).length, [columnProfiles]);
  const numCols = useMemo(() => columnProfiles.filter(c => ["INTEGER", "DECIMAL", "NUMBER", "FLOAT"].includes(c.dataType.toUpperCase())).length, [columnProfiles]);
  const dateCols = useMemo(() => columnProfiles.filter(c => ["DATE", "DATETIME", "TIMESTAMP"].includes(c.dataType.toUpperCase())).length, [columnProfiles]);
  const completeCols = useMemo(() => columnProfiles.filter(c => c.nullPercentage === 0).length, [columnProfiles]);
  const sparseCols = useMemo(() => columnProfiles.filter(c => c.nullPercentage > 50).length, [columnProfiles]);
  const avgCompleteness = useMemo(() => totalCols ? ((columnProfiles as any[]).reduce((acc: number, c: any) => acc + (100 - c.nullPercentage), 0) / totalCols).toFixed(1) : "0.0", [columnProfiles, totalCols]);
  const avgUniqueness = useMemo(() => totalCols ? ((columnProfiles as any[]).reduce((acc: number, c: any) => acc + c.uniquenessPercentage, 0) / totalCols).toFixed(1) : "0.0", [columnProfiles, totalCols]);
  const highCardinality = useMemo(() => columnProfiles.filter((c: any) => c.uniquenessPercentage > 80).length, [columnProfiles]);
  const anomalyCount = useMemo(() => columnProfiles.filter((c: any) => c.hasAnomalies).length, [columnProfiles]);

  const filteredSourceOptions = useMemo(() => {
    return allDatasets.filter(ds => {
      const conn = allConnectors.find(c => c.id === ds.id);
      const isSourceType = conn ? (conn.systemType === 'Source' || conn.systemType === 'Both') : true;
      const matchesSearch = ds.name.toLowerCase().includes(sourceSearch.toLowerCase()) || 
                            ds.category.toLowerCase().includes(sourceSearch.toLowerCase());
      return isSourceType && matchesSearch;
    });
  }, [allDatasets, allConnectors, sourceSearch]);

  const filteredTargetOptions = useMemo(() => {
    return allDatasets.filter(ds => {
      const conn = allConnectors.find(c => c.id === ds.id);
      const isTargetType = conn ? (conn.systemType === 'Destination' || conn.systemType === 'Both') : true;
      const matchesSearch = ds.name.toLowerCase().includes(targetSearch.toLowerCase()) || 
                            ds.category.toLowerCase().includes(targetSearch.toLowerCase());
      return isTargetType && matchesSearch;
    });
  }, [allDatasets, allConnectors, targetSearch]);

  const handleToggleSource = (id: string) => {
    setSelectedSourceIds(prev => {
      if (prev.includes(id)) {
        if (prev.length > 1 || selectedTargetIds.length > 0) {
          return prev.filter(x => x !== id);
        }
        return prev;
      } else {
        return [...prev, id];
      }
    });
  };

  const handleToggleTarget = (id: string) => {
    setSelectedTargetIds(prev => {
      if (prev.includes(id)) {
        if (prev.length > 1 || selectedSourceIds.length > 0) {
          return prev.filter(x => x !== id);
        }
        return prev;
      } else {
        return [...prev, id];
      }
    });
  };

  // Filter connectors dynamically
  const filteredConnectors = useMemo(() => {
    return allDatasets.filter(conn => {
      const matchesCategory = connectorCategoryFilter === 'All' || conn.category === connectorCategoryFilter;
      const matchesSearch = conn.name.toLowerCase().includes(connectorSearch.toLowerCase()) || 
                            conn.category.toLowerCase().includes(connectorSearch.toLowerCase()) ||
                            conn.schema.name.toLowerCase().includes(connectorSearch.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [connectorCategoryFilter, connectorSearch, allDatasets]);

  const toggleDatasetSelection = (id: string) => {
    const conn = allConnectors.find(c => c.id === id);
    const isSource = conn 
      ? (conn.systemType === 'Source' || conn.systemType === 'Both') 
      : (id.includes('excel') || id.includes('file') || id.includes('legacy') || id.includes('api') || id.includes('sharepoint') || id.includes('sfdc') || id.includes('sap'));

    if (isSource) {
      setSelectedSourceIds(prev => {
        if (prev.includes(id)) {
          return (prev.length > 1 || selectedTargetIds.length > 0) ? prev.filter(item => item !== id) : prev;
        } else {
          return [...prev, id];
        }
      });
    } else {
      setSelectedTargetIds(prev => {
        if (prev.includes(id)) {
          return (prev.length > 1 || selectedSourceIds.length > 0) ? prev.filter(item => item !== id) : prev;
        } else {
          return [...prev, id];
        }
      });
    }
  };

  const handleApplyPreset = (ids: string[]) => {
    const sources: string[] = [];
    const targets: string[] = [];
    ids.forEach(id => {
      const conn = allConnectors.find(c => c.id === id);
      const isSource = conn 
        ? (conn.systemType === 'Source' || conn.systemType === 'Both') 
        : (id.includes('excel') || id.includes('file') || id.includes('legacy') || id.includes('api') || id.includes('sharepoint') || id.includes('sfdc') || id.includes('sap'));
      const isTarget = conn 
        ? (conn.systemType === 'Destination' || conn.systemType === 'Both') 
        : (!isSource || id === 'conn-sap-s4' || id === 'conn-sfdc-main');

      if (isSource) sources.push(id);
      if (isTarget) targets.push(id);
    });

    setSelectedSourceIds(sources.length > 0 ? sources : [ids[0]]);
    setSelectedTargetIds(targets.length > 0 ? targets : [ids[1] || ids[0]]);
    setComparisonMode(true);
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Dynamic Header & Actions Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
              <Layers className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-950">
              Data Discovery Engine
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Audit and map system schemas in real-time. Choose any combination of the system connectors below to perform side-by-side structure reconciliation, null-sparsity profiles, and anomaly scans.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleRunAiProfiling}
            disabled={isProfiling}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-all shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {isProfiling ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            )}
            <span>{isProfiling ? 'Analyzing Structure...' : 'Deep Profile (AI)'}</span>
          </button>

          <button
            onClick={onProceedToMapping}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-all shadow-md cursor-pointer"
          >
            <span>Proceed to Mapping Studio</span>
          </button>
        </div>
      </div>

      {/* NEW: DYNAMIC CONNECTOR HUB CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-indigo-600" />
              Dynamic System Connectors Hub
            </h2>
            <p className="text-xs text-slate-500">
              Select or deselect active connectors to compare schemas instantly.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Presets:</span>
            <button
              onClick={() => handleApplyPreset(['conn-bc-prod', 'conn-excel-files'])}
              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md text-[11px] font-semibold transition"
            >
              ERP vs Excel Sync
            </button>
            <button
              onClick={() => handleApplyPreset(['conn-bc-prod', 'conn-sfdc-main', 'conn-sap-s4'])}
              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md text-[11px] font-semibold transition"
            >
              Enterprise Tri-Sync (ERP & CRM)
            </button>
            <button
              onClick={() => handleApplyPreset(['conn-postgres-warehouse', 'conn-sql-legacy'])}
              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md text-[11px] font-semibold transition"
            >
              Database Consolidation
            </button>
          </div>
        </div>

        {/* Dynamic Multi-Select Dropdowns for Pipeline Modeling */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 bg-slate-50 p-4.5 rounded-xl border border-slate-200/80">
          {/* Source Multi-Select */}
          <div className="space-y-1.5 relative">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Source System Connectors
            </label>
            <div className="relative">
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  setSourceDropdownOpen(!sourceDropdownOpen);
                  setTargetDropdownOpen(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSourceDropdownOpen(!sourceDropdownOpen);
                    setTargetDropdownOpen(false);
                  }
                }}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg hover:border-slate-300 shadow-2xs text-left cursor-pointer transition-all duration-200 min-h-[42px]"
              >
                <div className="flex flex-wrap gap-1 items-center">
                  {selectedSourceIds.length === 0 ? (
                    <span className="text-xs text-slate-400">Select active source connectors...</span>
                  ) : (
                    selectedSourceIds.map(id => {
                      const ds = allDatasets.find(d => d.id === id);
                      return (
                        <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 border border-indigo-150 text-indigo-700 text-xs font-semibold rounded-md shadow-3xs">
                          {ds ? renderConnectorIcon(ds.icon, "w-3 h-3 text-indigo-500") : <Database className="w-3 h-3 text-indigo-500" />}
                          <span>{ds ? ds.name : id}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleSource(id);
                            }}
                            className="hover:bg-indigo-100 p-0.5 rounded text-indigo-400 hover:text-indigo-600 transition ml-0.5"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      );
                    })
                  )}
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${sourceDropdownOpen ? 'rotate-180' : ''}`} />
              </div>

              {sourceDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-20 cursor-default" onClick={() => setSourceDropdownOpen(false)} />
                  <div className="absolute left-0 right-0 z-30 mt-1.5 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto p-2 space-y-1">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-2 px-1">
                      <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <input
                        type="text"
                        placeholder="Search source systems..."
                        value={sourceSearch}
                        onChange={(e) => setSourceSearch(e.target.value)}
                        className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                        onClick={(e) => e.stopPropagation()}
                      />
                      {sourceSearch && (
                        <button
                          type="button"
                          onClick={() => setSourceSearch('')}
                          className="text-slate-400 hover:text-slate-600 text-xs font-semibold"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    {filteredSourceOptions.map(ds => {
                      const isSelected = selectedSourceIds.includes(ds.id);
                      return (
                        <div
                          key={ds.id}
                          onClick={() => handleToggleSource(ds.id)}
                          className={`flex items-center justify-between px-2 py-1.5 hover:bg-slate-50 rounded-md cursor-pointer transition select-none text-xs ${
                            isSelected ? 'bg-indigo-50/30' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`p-1 rounded bg-slate-100 text-slate-600 border border-slate-200`}>
                              {renderConnectorIcon(ds.icon, "w-3.5 h-3.5")}
                            </span>
                            <div>
                              <div className="font-semibold text-slate-800">{ds.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{ds.schema.name} • {ds.schema.fields.length} Columns</div>
                            </div>
                          </div>
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                    {filteredSourceOptions.length === 0 && (
                      <div className="text-[11px] text-slate-400 text-center py-4">No matching sources</div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Target Multi-Select */}
          <div className="space-y-1.5 relative">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Target System Connectors
            </label>
            <div className="relative">
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  setTargetDropdownOpen(!targetDropdownOpen);
                  setSourceDropdownOpen(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setTargetDropdownOpen(!targetDropdownOpen);
                    setSourceDropdownOpen(false);
                  }
                }}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg hover:border-slate-300 shadow-2xs text-left cursor-pointer transition-all duration-200 min-h-[42px]"
              >
                <div className="flex flex-wrap gap-1 items-center">
                  {selectedTargetIds.length === 0 ? (
                    <span className="text-xs text-slate-400">Select active target connectors...</span>
                  ) : (
                    selectedTargetIds.map(id => {
                      const ds = allDatasets.find(d => d.id === id);
                      return (
                        <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 border border-indigo-150 text-indigo-700 text-xs font-semibold rounded-md shadow-3xs">
                          {ds ? renderConnectorIcon(ds.icon, "w-3 h-3 text-indigo-500") : <Database className="w-3 h-3 text-indigo-500" />}
                          <span>{ds ? ds.name : id}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleTarget(id);
                            }}
                            className="hover:bg-indigo-100 p-0.5 rounded text-indigo-400 hover:text-indigo-600 transition ml-0.5"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      );
                    })
                  )}
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${targetDropdownOpen ? 'rotate-180' : ''}`} />
              </div>

              {targetDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-20 cursor-default" onClick={() => setTargetDropdownOpen(false)} />
                  <div className="absolute left-0 right-0 z-30 mt-1.5 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto p-2 space-y-1">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-2 px-1">
                      <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <input
                        type="text"
                        placeholder="Search target systems..."
                        value={targetSearch}
                        onChange={(e) => setTargetSearch(e.target.value)}
                        className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                        onClick={(e) => e.stopPropagation()}
                      />
                      {targetSearch && (
                        <button
                          type="button"
                          onClick={() => setTargetSearch('')}
                          className="text-slate-400 hover:text-slate-600 text-xs font-semibold"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    {filteredTargetOptions.map(ds => {
                      const isSelected = selectedTargetIds.includes(ds.id);
                      return (
                        <div
                          key={ds.id}
                          onClick={() => handleToggleTarget(ds.id)}
                          className={`flex items-center justify-between px-2 py-1.5 hover:bg-slate-50 rounded-md cursor-pointer transition select-none text-xs ${
                            isSelected ? 'bg-indigo-50/30' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`p-1 rounded bg-slate-100 text-slate-600 border border-slate-200`}>
                              {renderConnectorIcon(ds.icon, "w-3.5 h-3.5")}
                            </span>
                            <div>
                              <div className="font-semibold text-slate-800">{ds.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{ds.schema.name} • {ds.schema.fields.length} Columns</div>
                            </div>
                          </div>
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                    {filteredTargetOptions.length === 0 && (
                      <div className="text-[11px] text-slate-400 text-center py-4">No matching targets</div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Categories, Search & Actions */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-1.5">
            {['All', 'ERP', 'CRM', 'Database', 'Cloud Storage', 'Custom API', 'Files'].map(category => (
              <button
                key={category}
                onClick={() => setConnectorCategoryFilter(category)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all border ${
                  connectorCategoryFilter === category
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Search bar & mode switch */}
          <div className="flex items-center gap-3">
            <div className="relative w-full md:w-64">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                placeholder="Search connectors..."
                value={connectorSearch}
                onChange={(e) => setConnectorSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all placeholder:text-slate-400"
              />
              {connectorSearch && (
                <button
                  onClick={() => setConnectorSearch('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <button
              onClick={() => {
                if (selectedDatasetIds.length < 2) {
                  // Ensure at least 2 are selected when forcing comparison
                  const availableOthers = allDatasets.filter(d => !selectedDatasetIds.includes(d.id));
                  if (availableOthers.length > 0) {
                    const nextId = availableOthers[0].id;
                    const conn = allConnectors.find(c => c.id === nextId);
                    const isSource = conn 
                      ? (conn.systemType === 'Source' || conn.systemType === 'Both') 
                      : (nextId.includes('excel') || nextId.includes('file') || nextId.includes('legacy') || nextId.includes('api'));
                    if (isSource) {
                      setSelectedSourceIds(prev => [...prev, nextId]);
                    } else {
                      setSelectedTargetIds(prev => [...prev, nextId]);
                    }
                  }
                }
                setComparisonMode(!comparisonMode);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all border flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                comparisonMode
                  ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Side-by-Side: {comparisonMode ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>

        {/* Dynamic Connectors Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {filteredConnectors.map(conn => {
            const isSelected = selectedDatasetIds.includes(conn.id);
            const isPrimary = selectedDatasetIds[0] === conn.id;
            return (
              <div
                key={conn.id}
                onClick={() => toggleDatasetSelection(conn.id)}
                className={`relative group p-4 rounded-xl border transition-all cursor-pointer select-none text-left flex flex-col justify-between h-40 ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`p-1.5 rounded-lg border ${
                      isSelected 
                        ? 'bg-indigo-600 text-white border-indigo-500' 
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {renderConnectorIcon(conn.icon, "w-4 h-4")}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium tracking-wide border uppercase ${
                      conn.category === 'ERP' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      conn.category === 'CRM' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      conn.category === 'Database' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' :
                      conn.category === 'Files' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                      'bg-slate-50 text-slate-600 border-slate-200'
                    }`}>
                      {conn.category}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-slate-900 mt-2.5 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                    {conn.name}
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-1 font-mono line-clamp-1">
                    {conn.schema.name}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 mt-2 text-[10px] text-slate-500">
                  <div className="flex items-center gap-2">
                    <span>Fields: <strong className="text-slate-700 font-semibold">{conn.schema.fields.length}</strong></span>
                    <span className="text-slate-300">|</span>
                    <span>Score: <strong className="text-emerald-600 font-semibold">{conn.schema.qualityScore}%</strong></span>
                  </div>
                  
                  <div>
                    {isSelected ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-200">
                        {isPrimary ? 'Primary' : 'Active'}
                        <Check className="w-3 h-3" />
                      </span>
                    ) : (
                      <span className="text-slate-400 group-hover:text-indigo-500 font-medium">
                        Compare
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredConnectors.length === 0 && (
            <div className="col-span-full py-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-2">
              <Layers className="w-6 h-6 text-slate-400 mx-auto" />
              <p className="text-xs font-semibold text-slate-600">No matching connectors found</p>
              <p className="text-[10px] text-slate-400">Try adjusting your search filter or category tabs</p>
            </div>
          )}
        </div>

        {/* Selected Compare Summary Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200/60 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-600">Currently Aligned ({selectedDatasetIds.length}):</span>
            <div className="flex flex-wrap gap-1.5">
              {selectedDatasets.map((ds, index) => (
                <span
                  key={ds.id}
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-semibold text-[11px] border ${
                    index === 0
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  <span className="font-mono text-[9px] opacity-75">{index === 0 ? 'PRIMARY' : `CONN #${index + 1}`}</span>
                  <span>{ds.name}</span>
                  {selectedDatasetIds.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleDatasetSelection(ds.id);
                      }}
                      className={`hover:bg-slate-200/50 p-0.5 rounded transition ${index === 0 ? 'hover:bg-indigo-700 text-white' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                </span>
              ))}
            </div>
          </div>

          <div className="text-[10px] text-slate-500 font-medium italic">
            * Drag and drop / map these fields inside the mapping studio afterwards.
          </div>
        </div>
      </div>

      {comparisonMode && selectedDatasets.length > 1 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Table className="w-5 h-5 text-indigo-600" /> Multi-Dataset Comparison Mode
            </h3>
            <span className="text-xs text-slate-500">Comparing {selectedDatasets.length} datasets side-by-side</span>
          </div>
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-900 text-white shadow-md">
                <tr>
                  <th className="py-3 px-4 border-r border-slate-700 font-semibold text-xs whitespace-nowrap bg-slate-950">Field Name (Union)</th>
                  {selectedDatasets.map(ds => (
                    <th key={ds.id} className="py-3 px-4 border-r border-slate-700 font-semibold text-xs text-center" colSpan={4}>
                      {ds.name}
                    </th>
                  ))}
                </tr>
                <tr className="bg-slate-800">
                  <th className="py-2 px-4 border-r border-slate-700 border-b border-slate-700 bg-slate-900"></th>
                  {selectedDatasets.map(ds => (
                    <React.Fragment key={ds.id}>
                      <th className="py-2 px-2 text-[10px] uppercase tracking-wider text-slate-300 font-medium border-b border-slate-700">Type</th>
                      <th className="py-2 px-2 text-[10px] uppercase tracking-wider text-slate-300 font-medium border-b border-slate-700 text-right">Null %</th>
                      <th className="py-2 px-2 text-[10px] uppercase tracking-wider text-slate-300 font-medium border-b border-slate-700 text-right">Unique %</th>
                      <th className="py-2 px-2 text-[10px] uppercase tracking-wider text-slate-300 font-medium border-r border-b border-slate-700 text-center">Anomaly</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {Array.from(new Set(selectedDatasets.flatMap(ds => ds.profiles.map(p => p.columnName)))).sort().map(field => (
                  <tr key={field} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 border-r border-slate-100 font-bold text-slate-900 font-mono bg-slate-50/50">{field}</td>
                    {selectedDatasets.map(ds => {
                      const profile = ds.profiles.find(p => p.columnName === field);
                      if (!profile) {
                        return (
                          <React.Fragment key={ds.id}>
                            <td className="py-3 px-2 text-slate-400 text-center bg-slate-50/30 font-mono">-</td>
                            <td className="py-3 px-2 text-slate-400 text-center bg-slate-50/30 font-mono">-</td>
                            <td className="py-3 px-2 text-slate-400 text-center bg-slate-50/30 font-mono">-</td>
                            <td className="py-3 px-2 border-r border-slate-100 text-slate-400 text-center bg-slate-50/30">-</td>
                          </React.Fragment>
                        );
                      }
                      return (
                        <React.Fragment key={ds.id}>
                          <td className="py-3 px-2 font-mono text-[11px] text-slate-700">{profile.dataType}</td>
                          <td className={`py-3 px-2 text-right font-mono ${profile.nullPercentage > 5 ? 'text-amber-600 font-bold' : 'text-slate-700'}`}>{profile.nullPercentage}%</td>
                          <td className="py-3 px-2 text-right font-mono text-slate-700">{profile.uniquenessPercentage}%</td>
                          <td className="py-3 px-2 border-r border-slate-100 text-center">
                            {profile.hasAnomalies ? <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mx-auto" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mx-auto" />}
                          </td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
          {/* AI-DRIVEN DATA QUALITY SCORE & REAL-TIME MALFORMED FIELDS CARD */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white p-5 rounded-2xl border border-indigo-500/30 shadow-xl space-y-4">
            {/* Header row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-600/30 border border-indigo-400/40 rounded-xl text-indigo-300">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-extrabold text-white tracking-wide">
                      AI Data Quality Score & Real-Time Malformed Fields
                    </h2>
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      Live Inspection Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Gemini Neural Inspector continuously auditing syntax, schema constraints, and malformed field patterns across datasets.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('drift')}
                  className="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                  <span>Schema Drift Radar</span>
                  <span className="px-1.5 py-0.2 bg-amber-400 text-slate-950 rounded-full text-[10px] font-black">2</span>
                </button>
                <button
                  type="button"
                  onClick={handleRunAiProfiling}
                  disabled={isProfiling}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isProfiling ? 'animate-spin' : ''}`} />
                  <span>{isProfiling ? 'Scanning...' : 'Re-scan AI Profiler'}</span>
                </button>
              </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 text-xs">
              {/* COL 1: Overall Quality Score Gauge */}
              <div className="lg:col-span-4 bg-slate-950/70 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-400 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    Overall Data Quality Score
                  </span>
                  <span className="px-2 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded font-mono text-[10px] font-bold">
                    Grade A
                  </span>
                </div>

                <div className="my-3 flex items-center gap-4">
                  <div className="relative flex items-center justify-center w-20 h-20 shrink-0">
                    <svg className="w-20 h-20 transform -rotate-90">
                      <circle cx="40" cy="40" r="32" stroke="currentColor" strokeWidth="8" className="text-slate-800" fill="transparent" />
                      <circle
                        cx="40"
                        cy="40"
                        r="32"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-indigo-400 transition-all duration-1000"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 32}
                        strokeDashoffset={2 * Math.PI * 32 * (1 - qualityScore / 100)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute font-mono font-extrabold text-xl text-white">
                      {qualityScore}%
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm font-bold text-slate-100">Dataset Hygiene Index</div>
                    <div className="text-[11px] text-slate-400 leading-snug">
                      {qualityScore >= 90
                        ? 'High fidelity source data. Ready for immediate target schema mapping.'
                        : 'Moderate hygiene. Requires pre-migration cleansing rules.'}
                    </div>
                    <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 pt-0.5">
                      <TrendingUp className="w-3 h-3" />
                      +2.4% hygiene index vs raw ingest
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Source Target Object:</span>
                  <span className="text-white font-bold">{selectedEntity.name}</span>
                </div>
              </div>

              {/* COL 2: Real-time Percentage of Malformed Fields Detected */}
              <div className="lg:col-span-5 bg-slate-950/70 p-4 rounded-xl border border-rose-500/30 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-300 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      Malformed Fields Detected Rate
                    </span>
                    <span className="px-2 py-0.5 bg-rose-950/80 text-rose-300 border border-rose-800 rounded font-mono text-[10px] font-bold animate-pulse">
                      {totalMalformedValues.toLocaleString()} Malformed Values
                    </span>
                  </div>

                  <div className="mt-2 flex items-baseline gap-3">
                    <span className="text-3xl font-mono font-extrabold text-rose-400">
                      {malformedPercentageTotal}%
                    </span>
                    <div className="text-xs text-slate-300 font-medium">
                      malformed rate across <span className="font-mono text-white font-bold">{totalFields.toLocaleString()}</span> inspected fields in source
                    </div>
                  </div>

                  {/* Breakdown by error categories */}
                  <div className="mt-3 space-y-2">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-slate-300">
                        <span>Telephone / E.164 Format Non-compliance</span>
                        <span className="text-amber-400 font-bold">1.8% (2,565 values)</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: '1.8%' }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-slate-300">
                        <span>Invalid Tax ID / GST Identifier Strings</span>
                        <span className="text-rose-400 font-bold">1.2% (1,710 values)</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500 rounded-full" style={{ width: '1.2%' }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-slate-300">
                        <span>Null Padding & Unsanitized Characters</span>
                        <span className="text-indigo-400 font-bold">0.8% (1,140 values)</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: '0.8%' }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setIsMalformedDetailsOpen(!isMalformedDetailsOpen)}
                    className="text-[11px] font-mono text-indigo-300 hover:text-white flex items-center gap-1 cursor-pointer font-bold transition-colors"
                  >
                    <span>{isMalformedDetailsOpen ? 'Hide Column Malformed Inventory' : 'Inspect Per-Column Malformed Rates'}</span>
                    {isMalformedDetailsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* COL 3: AI Hygiene & Remediation */}
              <div className="lg:col-span-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="font-bold text-indigo-300 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                    <Wand2 className="w-4 h-4 text-indigo-400" />
                    AI Cleansing Actions
                  </span>
                  <p className="text-[11px] text-slate-400 mt-1">Recommended pre-migration sanitization rules:</p>

                  <div className="mt-2 space-y-2 text-xs">
                    {aiSuggestions.map((sug, idx) => (
                      <div key={idx} className="p-2 bg-slate-900/90 rounded-lg border border-slate-800 text-[11px] text-slate-200 flex items-start gap-2">
                        <span className="text-amber-400 font-bold">•</span>
                        <span className="leading-tight">{sug}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onProceedToMapping}
                  className="mt-3 w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <span>Apply Rules in Mapping Studio</span>
                  <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                </button>
              </div>
            </div>

            {/* EXPANDABLE INVENTORY TABLE FOR PER-COLUMN MALFORMED RATES */}
            {isMalformedDetailsOpen && (
              <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    <Table className="w-4 h-4 text-indigo-400" />
                    Per-Column Real-Time Malformed Field Rate Inventory
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Source: {selectedEntity.name} ({columnProfiles.length} columns)
                  </span>
                </div>

                <OverflowTableWrapper hintLabel="Scroll horizontally to inspect full column malformation audit" theme="dark">
                  <table className="w-full text-left font-mono text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                        <th className="p-2.5">Column Name</th>
                        <th className="p-2.5">Data Type</th>
                        <th className="p-2.5 text-right">Total Inspected</th>
                        <th className="p-2.5 text-right">Malformed Values</th>
                        <th className="p-2.5 text-right">Malformed Rate %</th>
                        <th className="p-2.5">AI Primary Defect Classification</th>
                        <th className="p-2.5 text-center">Severity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {columnMalformedStats.map((col) => (
                        <tr key={col.columnName} className="hover:bg-slate-900/50 transition-colors">
                          <td className="p-2.5 font-bold text-indigo-300">{col.columnName}</td>
                          <td className="p-2.5 text-slate-400 text-[11px]">{col.dataType}</td>
                          <td className="p-2.5 text-right text-slate-300">{totalRecords.toLocaleString()}</td>
                          <td className="p-2.5 text-right font-bold text-white">{col.malformedCount.toLocaleString()}</td>
                          <td className="p-2.5 text-right font-bold">
                            <span className={`px-2 py-0.5 rounded text-[11px] ${
                              col.malformedPercentage > 10 ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                              col.malformedPercentage > 0 ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                              'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            }`}>
                              {col.malformedPercentage}%
                            </span>
                          </td>
                          <td className="p-2.5 text-slate-300 text-[11px]">{col.issueType}</td>
                          <td className="p-2.5 text-center">
                            {col.severity === 'high' && (
                              <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full text-[10px] font-bold">
                                Critical
                              </span>
                            )}
                            {col.severity === 'medium' && (
                              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-[10px] font-bold">
                                Warning
                              </span>
                            )}
                            {col.severity === 'low' && (
                              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-[10px] font-bold">
                                Normal
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </OverflowTableWrapper>
              </div>
            )}
          </div>

          {/* Real-time Data Profiling Summary Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 className="w-5 h-5 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-800">Data Profiling Summary</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Data Type Consistency</span>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center"><span className="text-slate-600">String / Text</span><span className="font-mono text-slate-900 font-bold">{Math.round((stringCols/(totalCols||1))*100)}%</span></div>
                  <div className="flex justify-between items-center"><span className="text-slate-600">Numeric</span><span className="font-mono text-slate-900 font-bold">{Math.round((numCols/(totalCols||1))*100)}%</span></div>
                  <div className="flex justify-between items-center"><span className="text-slate-600">Dates / Times</span><span className="font-mono text-slate-900 font-bold">{Math.round((dateCols/(totalCols||1))*100)}%</span></div>
                </div>
              </div>
              <div className="space-y-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Null-Value Ratios</span>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center"><span className="text-slate-600">Complete (0% Nulls)</span><span className="font-mono text-emerald-600 font-bold">{completeCols} Cols</span></div>
                  <div className="flex justify-between items-center"><span className="text-slate-600">Sparse (&gt;50% Nulls)</span><span className="font-mono text-amber-600 font-bold">{sparseCols} Cols</span></div>
                  <div className="flex justify-between items-center"><span className="text-slate-600">Average Completeness</span><span className="font-mono text-slate-900 font-bold">{avgCompleteness}%</span></div>
                </div>
              </div>
              <div className="space-y-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Distribution Stats</span>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center"><span className="text-slate-600">Avg. Uniqueness</span><span className="font-mono text-slate-900 font-bold">{avgUniqueness}%</span></div>
                  <div className="flex justify-between items-center"><span className="text-slate-600">High Cardinality (&gt;80%)</span><span className="font-mono text-indigo-600 font-bold">{highCardinality} Cols</span></div>
                  <div className="flex justify-between items-center"><span className="text-slate-600">Anomalies Detected</span><span className="font-mono text-rose-600 font-bold">{anomalyCount} Flags</span></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  id="disc-tab-drift"
                  onClick={() => setActiveSubTab('drift')}
                  className={`px-4 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    activeSubTab === 'drift'
                      ? 'bg-white text-indigo-700 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Schema Drift & Metadata Trends</span>
                  <span className="ml-1 px-1.5 py-0.2 bg-amber-100 text-amber-800 border border-amber-200 rounded-full text-[10px] font-bold">
                    2 Alerts
                  </span>
                </button>
                <button
                  id="disc-tab-profiler"
                  onClick={() => setActiveSubTab('profiler')}
                  className={`px-4 py-1.5 rounded-lg transition-all ${
                    activeSubTab === 'profiler'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Column Statistics & Quality Index
                </button>
                <button
                  id="disc-tab-visualizer"
                  onClick={() => setActiveSubTab('visualizer')}
                  className={`px-4 py-1.5 rounded-lg transition-all ${
                    activeSubTab === 'visualizer'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Visual Profiling Dashboard
                </button>
                <button
                  id="disc-tab-reports"
                  onClick={() => setActiveSubTab('reports')}
                  className={`px-4 py-1.5 rounded-lg transition-all ${
                    activeSubTab === 'reports'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Profiling Reports
                </button>
                <button
                  id="disc-tab-preview"
                  onClick={() => setActiveSubTab('preview')}
                  className={`px-4 py-1.5 rounded-lg transition-all ${
                    activeSubTab === 'preview'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  100-Row Sample Data Preview
                </button>
              </div>
              {activeSubTab === 'preview' && (
                <div className="relative w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={previewFilter}
                    onChange={(e) => setPreviewFilter(e.target.value)}
                    placeholder="Filter sample rows..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              )}
            </div>
            
            {activeSubTab === 'drift' && (
              <div className="p-5">
                <SchemaDriftTrendGraph
                  datasetId={primaryDataset.id}
                  datasetName={primaryDataset.name}
                  onProceedToMapping={onProceedToMapping}
                  availableDatasets={allDatasets.map((d) => ({
                    id: d.id,
                    name: d.name,
                    category: d.category,
                  }))}
                />
              </div>
            )}

            {activeSubTab === 'profiler' && (
              <OverflowTableWrapper hintLabel="Scroll horizontally to view column profile statistics">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      <th className="py-3 px-4">Column Name</th>
                      <th className="py-3 px-4">Data Type</th>
                      <th className="py-3 px-4 text-right">Null Count (%)</th>
                      <th className="py-3 px-4 text-right">Uniqueness (%)</th>
                      <th className="py-3 px-4">Sample Values</th>
                      <th className="py-3 px-4 text-center">Anomaly Flag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {columnProfiles.map((col, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                          {col.columnName}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-mono border border-slate-200">
                            {col.dataType}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          <span className={col.nullPercentage > 5 ? 'text-amber-600 font-bold' : 'text-slate-700'}>
                            {col.nullCount.toLocaleString()} ({col.nullPercentage}%)
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-700">
                          {col.uniquenessPercentage}%
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                          {col.sampleValues.slice(0, 2).join(', ')}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {col.hasAnomalies ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-[11px] font-medium border border-amber-200">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              Anomaly
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-emerald-600 text-[11px] font-medium">
                              <CheckCircle2 className="w-3 h-3" /> Clean
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </OverflowTableWrapper>
            )}
            
            {activeSubTab === 'visualizer' && (
              <DataProfilingSummary columnProfiles={columnProfiles} />
            )}
            
            {activeSubTab === 'reports' && (
              <div className="p-4">
                <ProfilingReportsView
                  datasets={allDatasets.map((d) => ({
                    id: d.id,
                    name: d.name,
                    recordCount: d.schema.recordCount || 14250,
                    profiles: d.profiles,
                  }))}
                  selectedDatasetId={primaryDataset.id}
                  onSelectDataset={(id) => {
                    const conn = allConnectors.find(c => c.id === id);
                    const isSource = conn 
                      ? (conn.systemType === 'Source' || conn.systemType === 'Both') 
                      : (id.includes('excel') || id.includes('file') || id.includes('legacy') || id.includes('api'));
                    if (isSource) {
                      setSelectedSourceIds([id]);
                    } else {
                      setSelectedTargetIds([id]);
                    }
                  }}
                  columnProfiles={columnProfiles}
                />
              </div>
            )}
            
            {activeSubTab === 'preview' && (
              <OverflowTableWrapper hintLabel="Scroll horizontally to inspect full raw dataset record columns" containerClassName="max-h-[500px]">
                <table className="w-full text-left border-collapse font-mono text-xs">
                  <thead className="sticky top-0 bg-slate-900 text-white z-10">
                    <tr>
                      <th className="py-2.5 px-3 border-r border-slate-800 font-semibold text-[11px]">#</th>
                      {selectedEntity.fields.map((f) => (
                        <th key={f.fieldName} className="py-2.5 px-3 border-r border-slate-800 font-semibold text-[11px]">
                          {f.fieldName}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-indigo-50/40">
                        <td className="py-2 px-3 border-r border-slate-100 text-slate-400 font-bold">{idx + 1}</td>
                        {selectedEntity.fields.map((f) => {
                          const val = (row as any)[f.fieldName] || '-';
                          const isTaxError = f.fieldName === 'Tax_Registration_Number' && val === 'INVALID_TAX';
                          return (
                            <td
                              key={f.fieldName}
                              className={`py-2 px-3 border-r border-slate-100 whitespace-nowrap ${
                                isTaxError ? 'bg-rose-100 text-rose-800 font-bold' : 'text-slate-800'
                              }`}
                            >
                              {val}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </OverflowTableWrapper>
            )}
          </div>
        </>
      )}
    </div>
  );
};
