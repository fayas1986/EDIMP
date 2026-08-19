import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import {
  Grid,
  Filter,
  Sparkles,
  AlertOctagon,
  CheckCircle2,
  AlertTriangle,
  Info,
  RefreshCw,
  Zap,
  Layers,
  Database,
  Search,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Play,
  Pause,
  Radio,
  Activity,
  Clock,
  Flame,
  Loader2,
} from 'lucide-react';

export interface HeatmapCellData {
  datasetId: string;
  datasetName: string;
  sourceSystem: string;
  errorCategory: string;
  errorCount: number;
  totalRecords: number;
  errorRatePercent: number;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  topViolatingField: string;
  recommendedFix: string;
  sampleAnomalies: { rowId: string; fieldValue: string; issueReason: string }[];
}

const SOURCE_DATASETS = [
  { id: 'ds1', name: 'SAP_KNA1_Customers', system: 'SAP S/4HANA ERP', totalRecords: 14250 },
  { id: 'ds2', name: 'SFDC_Account_Master', system: 'Salesforce CRM', totalRecords: 28400 },
  { id: 'ds3', name: 'D365_Vendors_Global', system: 'Dynamics 365 BC', totalRecords: 12500 },
  { id: 'ds4', name: 'SQL_Legacy_GL_Ledger', system: 'SQL Server Legacy', totalRecords: 520000 },
  { id: 'ds5', name: 'Excel_Customer_Vault', system: 'Excel Master', totalRecords: 14250 },
  { id: 'ds6', name: 'D365_FO_Invoices', system: 'Dynamics 365 F&O', totalRecords: 38900 },
  { id: 'ds7', name: 'Postgres_Staging_Warehouse', system: 'PostgreSQL Warehouse', totalRecords: 185000 },
  { id: 'ds8', name: 'Sharepoint_HR_Audit_Docs', system: 'SharePoint Storage', totalRecords: 6400 },
  { id: 'ds9', name: 'REST_HRMS_Employees', system: 'Legacy HRMS REST', totalRecords: 4200 },
];

const ERROR_CATEGORIES = [
  { id: 'nulls', name: 'Null / Missing Required', desc: 'Mandatory primary or foreign keys missing value' },
  { id: 'format', name: 'Regex / Format Mismatch', desc: 'Email, tax ID, phone, or ISO code format failure' },
  { id: 'fk_integrity', name: 'FK Lookup Broken', desc: 'Foreign key value missing from target ERP reference tables' },
  { id: 'duplicate', name: 'Duplicate Keys', desc: 'Unique constraint violations across batch records' },
  { id: 'type_out-of-bounds', name: 'Range / Out-of-Bounds', desc: 'Numeric or date values outside valid range bounds' },
  { id: 'encoding', name: 'Character Encoding', desc: 'Corrupted unicode characters or unescaped symbols' },
];

// Initial pre-populated heatmap matrix data covering all 9 active connectors
const INITIAL_MATRIX: HeatmapCellData[] = [
  // 1. SAP S/4HANA ERP
  {
    datasetId: 'ds1', datasetName: 'SAP_KNA1_Customers', sourceSystem: 'SAP S/4HANA ERP',
    errorCategory: 'Null / Missing Required', errorCount: 412, totalRecords: 14250, errorRatePercent: 2.89,
    severity: 'High', topViolatingField: 'Tax_Registration_Num', recommendedFix: 'Apply fallback default or query tax registry lookup',
    sampleAnomalies: [
      { rowId: 'ROW-1042', fieldValue: 'NULL', issueReason: 'Tax registration number empty' },
      { rowId: 'ROW-1189', fieldValue: 'NULL', issueReason: 'Tax registration number empty' },
    ]
  },
  {
    datasetId: 'ds1', datasetName: 'SAP_KNA1_Customers', sourceSystem: 'SAP S/4HANA ERP',
    errorCategory: 'Regex / Format Mismatch', errorCount: 890, totalRecords: 14250, errorRatePercent: 6.25,
    severity: 'Critical', topViolatingField: 'VAT_Number', recommendedFix: 'Trim non-alphanumeric chars & strip invalid country prefix',
    sampleAnomalies: [
      { rowId: 'ROW-2011', fieldValue: 'DE--998234#', issueReason: 'Invalid characters in VAT string' },
      { rowId: 'ROW-2305', fieldValue: 'INVALID_TAX', issueReason: 'Placeholder text detected' },
    ]
  },
  {
    datasetId: 'ds1', datasetName: 'SAP_KNA1_Customers', sourceSystem: 'SAP S/4HANA ERP',
    errorCategory: 'FK Lookup Broken', errorCount: 124, totalRecords: 14250, errorRatePercent: 0.87,
    severity: 'Medium', topViolatingField: 'Payment_Terms_Code', recommendedFix: 'Auto-map unknown code to default "NET30"',
    sampleAnomalies: [{ rowId: 'ROW-0912', fieldValue: 'PT_9999', issueReason: 'Payment term key not in Business Central' }]
  },
  {
    datasetId: 'ds1', datasetName: 'SAP_KNA1_Customers', sourceSystem: 'SAP S/4HANA ERP',
    errorCategory: 'Duplicate Keys', errorCount: 45, totalRecords: 14250, errorRatePercent: 0.32,
    severity: 'Low', topViolatingField: 'Cust_No', recommendedFix: 'Deduplicate using latest record timestamp',
    sampleAnomalies: [{ rowId: 'ROW-0044', fieldValue: 'CUST-8812', issueReason: 'Duplicate customer number' }]
  },
  {
    datasetId: 'ds1', datasetName: 'SAP_KNA1_Customers', sourceSystem: 'SAP S/4HANA ERP',
    errorCategory: 'Range / Out-of-Bounds', errorCount: 12, totalRecords: 14250, errorRatePercent: 0.08,
    severity: 'Low', topViolatingField: 'Credit_Limit', recommendedFix: 'Cap negative credit limits to 0',
    sampleAnomalies: [{ rowId: 'ROW-3301', fieldValue: '-5000.00', issueReason: 'Credit limit cannot be negative' }]
  },
  {
    datasetId: 'ds1', datasetName: 'SAP_KNA1_Customers', sourceSystem: 'SAP S/4HANA ERP',
    errorCategory: 'Character Encoding', errorCount: 180, totalRecords: 14250, errorRatePercent: 1.26,
    severity: 'Medium', topViolatingField: 'Cust_Name', recommendedFix: 'Sanitize UTF-8 strings and convert latin1 accents',
    sampleAnomalies: [{ rowId: 'ROW-0812', fieldValue: 'MÃ¼ller GmbH', issueReason: 'Corrupted UTF-8 character encoding' }]
  },

  // 2. Salesforce CRM
  {
    datasetId: 'ds2', datasetName: 'SFDC_Account_Master', sourceSystem: 'Salesforce CRM',
    errorCategory: 'Null / Missing Required', errorCount: 1420, totalRecords: 28400, errorRatePercent: 5.0,
    severity: 'Critical', topViolatingField: 'Billing_Country_Iso2', recommendedFix: 'Infer ISO2 country code from address or zip lookup',
    sampleAnomalies: [
      { rowId: 'ACC-901', fieldValue: 'NULL', issueReason: 'Billing country ISO code missing' },
      { rowId: 'ACC-982', fieldValue: 'NULL', issueReason: 'Billing country ISO code missing' }
    ]
  },
  {
    datasetId: 'ds2', datasetName: 'SFDC_Account_Master', sourceSystem: 'Salesforce CRM',
    errorCategory: 'Regex / Format Mismatch', errorCount: 2310, totalRecords: 28400, errorRatePercent: 8.13,
    severity: 'Critical', topViolatingField: 'Primary_Email', recommendedFix: 'Mark for email verification & strip spaces',
    sampleAnomalies: [
      { rowId: 'ACC-1102', fieldValue: 'john.doe@domain..com', issueReason: 'Double dot in domain string' },
      { rowId: 'ACC-1409', fieldValue: 'sales@', issueReason: 'Incomplete email address' }
    ]
  },
  {
    datasetId: 'ds2', datasetName: 'SFDC_Account_Master', sourceSystem: 'Salesforce CRM',
    errorCategory: 'FK Lookup Broken', errorCount: 380, totalRecords: 28400, errorRatePercent: 1.34,
    severity: 'Medium', topViolatingField: 'Parent_Account_Id', recommendedFix: 'Orphan handling: attach to fallback root parent account',
    sampleAnomalies: [{ rowId: 'ACC-3101', fieldValue: '0010000000XXXX', issueReason: 'Parent Account ID non-existent' }]
  },
  {
    datasetId: 'ds2', datasetName: 'SFDC_Account_Master', sourceSystem: 'Salesforce CRM',
    errorCategory: 'Duplicate Keys', errorCount: 620, totalRecords: 28400, errorRatePercent: 2.18,
    severity: 'High', topViolatingField: 'DUNS_Number', recommendedFix: 'Merge record attributes into master account profile',
    sampleAnomalies: [{ rowId: 'ACC-0041', fieldValue: '123456789', issueReason: 'Multiple accounts with identical DUNS' }]
  },
  {
    datasetId: 'ds2', datasetName: 'SFDC_Account_Master', sourceSystem: 'Salesforce CRM',
    errorCategory: 'Range / Out-of-Bounds', errorCount: 40, totalRecords: 28400, errorRatePercent: 0.14,
    severity: 'Low', topViolatingField: 'Annual_Revenue', recommendedFix: 'Flag outliers > $1B for manual review',
    sampleAnomalies: [{ rowId: 'ACC-8819', fieldValue: '99999999999', issueReason: 'Revenue exceeds standard bounds' }]
  },
  {
    datasetId: 'ds2', datasetName: 'SFDC_Account_Master', sourceSystem: 'Salesforce CRM',
    errorCategory: 'Character Encoding', errorCount: 95, totalRecords: 28400, errorRatePercent: 0.33,
    severity: 'Low', topViolatingField: 'Billing_Street', recommendedFix: 'Replace illegal smart quotes and curly brackets',
    sampleAnomalies: [{ rowId: 'ACC-5122', fieldValue: 'Rue de lâ€™Ã‰cole', issueReason: 'Apostrophe encoding mismatch' }]
  },

  // 3. Dynamics 365 BC
  {
    datasetId: 'ds3', datasetName: 'D365_Vendors_Global', sourceSystem: 'Dynamics 365 BC',
    errorCategory: 'Null / Missing Required', errorCount: 90, totalRecords: 12500, errorRatePercent: 0.72,
    severity: 'Low', topViolatingField: 'Vendor_Group_Code', recommendedFix: 'Default to "GEN_SUPPLIER"',
    sampleAnomalies: [{ rowId: 'VND-102', fieldValue: 'NULL', issueReason: 'Vendor group missing' }]
  },
  {
    datasetId: 'ds3', datasetName: 'D365_Vendors_Global', sourceSystem: 'Dynamics 365 BC',
    errorCategory: 'Regex / Format Mismatch', errorCount: 140, totalRecords: 12500, errorRatePercent: 1.12,
    severity: 'Medium', topViolatingField: 'IBAN_Number', recommendedFix: 'Validate IBAN mod-97 check digit',
    sampleAnomalies: [{ rowId: 'VND-304', fieldValue: 'GB82WEST123456', issueReason: 'IBAN length deficient' }]
  },
  {
    datasetId: 'ds3', datasetName: 'D365_Vendors_Global', sourceSystem: 'Dynamics 365 BC',
    errorCategory: 'FK Lookup Broken', errorCount: 780, totalRecords: 12500, errorRatePercent: 6.24,
    severity: 'Critical', topViolatingField: 'Posting_Group_Id', recommendedFix: 'Create missing posting group mapping in staging catalog',
    sampleAnomalies: [{ rowId: 'VND-811', fieldValue: 'PG_FOREIGN_UNMAPPED', issueReason: 'Posting group key not found' }]
  },
  {
    datasetId: 'ds3', datasetName: 'D365_Vendors_Global', sourceSystem: 'Dynamics 365 BC',
    errorCategory: 'Duplicate Keys', errorCount: 15, totalRecords: 12500, errorRatePercent: 0.12,
    severity: 'Low', topViolatingField: 'Vendor_No', recommendedFix: 'Re-index sequence ID',
    sampleAnomalies: [{ rowId: 'VND-009', fieldValue: 'V-1004', issueReason: 'Duplicate Vendor No' }]
  },
  {
    datasetId: 'ds3', datasetName: 'D365_Vendors_Global', sourceSystem: 'Dynamics 365 BC',
    errorCategory: 'Range / Out-of-Bounds', errorCount: 220, totalRecords: 12500, errorRatePercent: 1.76,
    severity: 'Medium', topViolatingField: 'Discount_Percent', recommendedFix: 'Clamp discount percent between 0% and 100%',
    sampleAnomalies: [{ rowId: 'VND-501', fieldValue: '150%', issueReason: 'Discount percentage exceeds 100%' }]
  },
  {
    datasetId: 'ds3', datasetName: 'D365_Vendors_Global', sourceSystem: 'Dynamics 365 BC',
    errorCategory: 'Character Encoding', errorCount: 30, totalRecords: 12500, errorRatePercent: 0.24,
    severity: 'Low', topViolatingField: 'Bank_Name', recommendedFix: 'Standardize bank name string',
    sampleAnomalies: [{ rowId: 'VND-902', fieldValue: 'CrÃ©dit Agricole', issueReason: 'Accent character flaw' }]
  },

  // 4. SQL Server Legacy
  {
    datasetId: 'ds4', datasetName: 'SQL_Legacy_GL_Ledger', sourceSystem: 'SQL Server Legacy',
    errorCategory: 'Null / Missing Required', errorCount: 18500, totalRecords: 520000, errorRatePercent: 3.56,
    severity: 'High', topViolatingField: 'GL_Account_Code', recommendedFix: 'Derive GL account code from expense category matrix',
    sampleAnomalies: [{ rowId: 'GL-8801', fieldValue: 'NULL', issueReason: 'Mandatory GL account null' }]
  },
  {
    datasetId: 'ds4', datasetName: 'SQL_Legacy_GL_Ledger', sourceSystem: 'SQL Server Legacy',
    errorCategory: 'Regex / Format Mismatch', errorCount: 3200, totalRecords: 520000, errorRatePercent: 0.62,
    severity: 'Low', topViolatingField: 'Posting_Date', recommendedFix: 'Reformat date string to ISO-8601 (YYYY-MM-DD)',
    sampleAnomalies: [{ rowId: 'GL-1092', fieldValue: '31/02/2025', issueReason: 'Invalid calendar date' }]
  },
  {
    datasetId: 'ds4', datasetName: 'SQL_Legacy_GL_Ledger', sourceSystem: 'SQL Server Legacy',
    errorCategory: 'FK Lookup Broken', errorCount: 21500, totalRecords: 520000, errorRatePercent: 4.13,
    severity: 'High', topViolatingField: 'Cost_Center_Code', recommendedFix: 'Map unassigned cost centers to default overhead bucket',
    sampleAnomalies: [{ rowId: 'GL-4022', fieldValue: 'CC-991', issueReason: 'Cost center closed or inactive' }]
  },
  {
    datasetId: 'ds4', datasetName: 'SQL_Legacy_GL_Ledger', sourceSystem: 'SQL Server Legacy',
    errorCategory: 'Duplicate Keys', errorCount: 11200, totalRecords: 520000, errorRatePercent: 2.15,
    severity: 'High', topViolatingField: 'Voucher_Number', recommendedFix: 'Append sequence suffix to construct unique key',
    sampleAnomalies: [{ rowId: 'GL-0192', fieldValue: 'VCH-2025-001', issueReason: 'Duplicate voucher number across batch' }]
  },
  {
    datasetId: 'ds4', datasetName: 'SQL_Legacy_GL_Ledger', sourceSystem: 'SQL Server Legacy',
    errorCategory: 'Range / Out-of-Bounds', errorCount: 5400, totalRecords: 520000, errorRatePercent: 1.04,
    severity: 'Medium', topViolatingField: 'Amount_Debit', recommendedFix: 'Review negative debit amounts',
    sampleAnomalies: [{ rowId: 'GL-7721', fieldValue: '-1500.00', issueReason: 'Debit amount cannot be negative' }]
  },
  {
    datasetId: 'ds4', datasetName: 'SQL_Legacy_GL_Ledger', sourceSystem: 'SQL Server Legacy',
    errorCategory: 'Character Encoding', errorCount: 600, totalRecords: 520000, errorRatePercent: 0.12,
    severity: 'Low', topViolatingField: 'Description', recommendedFix: 'Strip control characters',
    sampleAnomalies: [{ rowId: 'GL-3011', fieldValue: 'REF-XYZ\x00', issueReason: 'Null byte character in string' }]
  },

  // 5. Excel Master
  {
    datasetId: 'ds5', datasetName: 'Excel_Customer_Vault', sourceSystem: 'Excel Master',
    errorCategory: 'Null / Missing Required', errorCount: 1820, totalRecords: 14250, errorRatePercent: 12.77,
    severity: 'Critical', topViolatingField: 'Zip_Code', recommendedFix: 'Infer postal code from geocoding coordinates',
    sampleAnomalies: [{ rowId: 'XLS-102', fieldValue: 'NULL', issueReason: 'Missing postal code' }]
  },
  {
    datasetId: 'ds5', datasetName: 'Excel_Customer_Vault', sourceSystem: 'Excel Master',
    errorCategory: 'Regex / Format Mismatch', errorCount: 1150, totalRecords: 14250, errorRatePercent: 8.07,
    severity: 'Critical', topViolatingField: 'Contact_Email', recommendedFix: 'Trim invalid trailing punctuation and spaces',
    sampleAnomalies: [{ rowId: 'XLS-304', fieldValue: 'user@domain..com', issueReason: 'Double dot in email string' }]
  },
  {
    datasetId: 'ds5', datasetName: 'Excel_Customer_Vault', sourceSystem: 'Excel Master',
    errorCategory: 'FK Lookup Broken', errorCount: 420, totalRecords: 14250, errorRatePercent: 2.95,
    severity: 'High', topViolatingField: 'Salesperson_Code', recommendedFix: 'Assign fallback salesperson code',
    sampleAnomalies: [{ rowId: 'XLS-811', fieldValue: 'SP_OLD_99', issueReason: 'Salesperson inactive' }]
  },
  {
    datasetId: 'ds5', datasetName: 'Excel_Customer_Vault', sourceSystem: 'Excel Master',
    errorCategory: 'Duplicate Keys', errorCount: 980, totalRecords: 14250, errorRatePercent: 6.88,
    severity: 'Critical', topViolatingField: 'Tax_Registration_Number', recommendedFix: 'Deduplicate based on latest spreadsheet row',
    sampleAnomalies: [{ rowId: 'XLS-009', fieldValue: 'US-883921049', issueReason: 'Duplicate tax ID across rows' }]
  },
  {
    datasetId: 'ds5', datasetName: 'Excel_Customer_Vault', sourceSystem: 'Excel Master',
    errorCategory: 'Range / Out-of-Bounds', errorCount: 210, totalRecords: 14250, errorRatePercent: 1.47,
    severity: 'Medium', topViolatingField: 'Credit_Limit', recommendedFix: 'Cap limit to maximum tier ceiling',
    sampleAnomalies: [{ rowId: 'XLS-501', fieldValue: '$999999999.00', issueReason: 'Credit limit exceeds standard bounds' }]
  },
  {
    datasetId: 'ds5', datasetName: 'Excel_Customer_Vault', sourceSystem: 'Excel Master',
    errorCategory: 'Character Encoding', errorCount: 340, totalRecords: 14250, errorRatePercent: 2.39,
    severity: 'High', topViolatingField: 'Cust_Name', recommendedFix: 'Decode ASCII HTML entities',
    sampleAnomalies: [{ rowId: 'XLS-902', fieldValue: 'Acme &amp; Co', issueReason: 'Raw HTML entity string' }]
  },

  // 6. Dynamics 365 F&O
  {
    datasetId: 'ds6', datasetName: 'D365_FO_Invoices', sourceSystem: 'Dynamics 365 F&O',
    errorCategory: 'Null / Missing Required', errorCount: 1210, totalRecords: 38900, errorRatePercent: 3.11,
    severity: 'High', topViolatingField: 'Dimension_Header', recommendedFix: 'Derive financial dimension header',
    sampleAnomalies: [{ rowId: 'FO-101', fieldValue: 'NULL', issueReason: 'Missing financial dimension' }]
  },
  {
    datasetId: 'ds6', datasetName: 'D365_FO_Invoices', sourceSystem: 'Dynamics 365 F&O',
    errorCategory: 'Regex / Format Mismatch', errorCount: 450, totalRecords: 38900, errorRatePercent: 1.16,
    severity: 'Medium', topViolatingField: 'Tax_Group_Code', recommendedFix: 'Validate ISO tax classification code',
    sampleAnomalies: [{ rowId: 'FO-204', fieldValue: 'TAX_XX_99', issueReason: 'Unrecognized tax format' }]
  },
  {
    datasetId: 'ds6', datasetName: 'D365_FO_Invoices', sourceSystem: 'Dynamics 365 F&O',
    errorCategory: 'FK Lookup Broken', errorCount: 2100, totalRecords: 38900, errorRatePercent: 5.40,
    severity: 'Critical', topViolatingField: 'Customer_Group_Id', recommendedFix: 'Map unassigned customer group to default bucket',
    sampleAnomalies: [{ rowId: 'FO-302', fieldValue: 'GRP_CLOSED', issueReason: 'Customer group key missing' }]
  },
  {
    datasetId: 'ds6', datasetName: 'D365_FO_Invoices', sourceSystem: 'Dynamics 365 F&O',
    errorCategory: 'Duplicate Keys', errorCount: 320, totalRecords: 38900, errorRatePercent: 0.82,
    severity: 'Medium', topViolatingField: 'Invoice_Account', recommendedFix: 'Consolidate invoice account key',
    sampleAnomalies: [{ rowId: 'FO-405', fieldValue: 'INV-ACC-100', issueReason: 'Duplicate invoice account entry' }]
  },
  {
    datasetId: 'ds6', datasetName: 'D365_FO_Invoices', sourceSystem: 'Dynamics 365 F&O',
    errorCategory: 'Range / Out-of-Bounds', errorCount: 190, totalRecords: 38900, errorRatePercent: 0.49,
    severity: 'Low', topViolatingField: 'Line_Amount', recommendedFix: 'Review zero line item totals',
    sampleAnomalies: [{ rowId: 'FO-509', fieldValue: '$0.00', issueReason: 'Line amount zero' }]
  },
  {
    datasetId: 'ds6', datasetName: 'D365_FO_Invoices', sourceSystem: 'Dynamics 365 F&O',
    errorCategory: 'Character Encoding', errorCount: 85, totalRecords: 38900, errorRatePercent: 0.22,
    severity: 'Low', topViolatingField: 'Invoice_Remarks', recommendedFix: 'Strip unsupported unicode characters',
    sampleAnomalies: [{ rowId: 'FO-612', fieldValue: 'Note \uFFFD', issueReason: 'Replacement character detected' }]
  },

  // 7. PostgreSQL Warehouse
  {
    datasetId: 'ds7', datasetName: 'Postgres_Staging_Warehouse', sourceSystem: 'PostgreSQL Warehouse',
    errorCategory: 'Null / Missing Required', errorCount: 1200, totalRecords: 185000, errorRatePercent: 0.65,
    severity: 'Low', topViolatingField: 'Staging_UUID', recommendedFix: 'Auto-generate v4 UUID for missing primary keys',
    sampleAnomalies: [{ rowId: 'PG-901', fieldValue: 'NULL', issueReason: 'Staging UUID missing' }]
  },
  {
    datasetId: 'ds7', datasetName: 'Postgres_Staging_Warehouse', sourceSystem: 'PostgreSQL Warehouse',
    errorCategory: 'Regex / Format Mismatch', errorCount: 850, totalRecords: 185000, errorRatePercent: 0.46,
    severity: 'Low', topViolatingField: 'Client_IP_Address', recommendedFix: 'Validate IPv4 / IPv6 structure',
    sampleAnomalies: [{ rowId: 'PG-902', fieldValue: '256.300.1.1', issueReason: 'Invalid IP address octet' }]
  },
  {
    datasetId: 'ds7', datasetName: 'Postgres_Staging_Warehouse', sourceSystem: 'PostgreSQL Warehouse',
    errorCategory: 'FK Lookup Broken', errorCount: 2400, totalRecords: 185000, errorRatePercent: 1.30,
    severity: 'Medium', topViolatingField: 'Tenant_Schema_Id', recommendedFix: 'Attach orphaned records to default tenant',
    sampleAnomalies: [{ rowId: 'PG-903', fieldValue: 'TENANT_UNKNOWN', issueReason: 'Tenant ID missing in catalog' }]
  },
  {
    datasetId: 'ds7', datasetName: 'Postgres_Staging_Warehouse', sourceSystem: 'PostgreSQL Warehouse',
    errorCategory: 'Duplicate Keys', errorCount: 310, totalRecords: 185000, errorRatePercent: 0.17,
    severity: 'Low', topViolatingField: 'Hash_Checksum', recommendedFix: 'De-duplicate row payloads',
    sampleAnomalies: [{ rowId: 'PG-904', fieldValue: '0x8f2a...', issueReason: 'Replayed checksum hash' }]
  },
  {
    datasetId: 'ds7', datasetName: 'Postgres_Staging_Warehouse', sourceSystem: 'PostgreSQL Warehouse',
    errorCategory: 'Range / Out-of-Bounds', errorCount: 4100, totalRecords: 185000, errorRatePercent: 2.22,
    severity: 'High', topViolatingField: 'Batch_Sequence_No', recommendedFix: 'Re-index sequence offset',
    sampleAnomalies: [{ rowId: 'PG-905', fieldValue: '99999999', issueReason: 'Sequence integer overflow' }]
  },
  {
    datasetId: 'ds7', datasetName: 'Postgres_Staging_Warehouse', sourceSystem: 'PostgreSQL Warehouse',
    errorCategory: 'Character Encoding', errorCount: 120, totalRecords: 185000, errorRatePercent: 0.06,
    severity: 'Low', topViolatingField: 'JSON_Payload', recommendedFix: 'Escape raw control chars inside JSON string',
    sampleAnomalies: [{ rowId: 'PG-906', fieldValue: '{"key": "val\x07"}', issueReason: 'Control character in JSON' }]
  },

  // 8. SharePoint Storage
  {
    datasetId: 'ds8', datasetName: 'Sharepoint_HR_Audit_Docs', sourceSystem: 'SharePoint Storage',
    errorCategory: 'Null / Missing Required', errorCount: 310, totalRecords: 6400, errorRatePercent: 4.84,
    severity: 'High', topViolatingField: 'Document_Owner_Email', recommendedFix: 'Default owner to HR Migration Lead',
    sampleAnomalies: [{ rowId: 'SP-101', fieldValue: 'NULL', issueReason: 'Document owner empty' }]
  },
  {
    datasetId: 'ds8', datasetName: 'Sharepoint_HR_Audit_Docs', sourceSystem: 'SharePoint Storage',
    errorCategory: 'Regex / Format Mismatch', errorCount: 190, totalRecords: 6400, errorRatePercent: 2.97,
    severity: 'High', topViolatingField: 'File_Extension_Type', recommendedFix: 'Standardize extension to lowercase .pdf / .docx',
    sampleAnomalies: [{ rowId: 'SP-202', fieldValue: 'FILE_NO_EXT', issueReason: 'Missing extension' }]
  },
  {
    datasetId: 'ds8', datasetName: 'Sharepoint_HR_Audit_Docs', sourceSystem: 'SharePoint Storage',
    errorCategory: 'FK Lookup Broken', errorCount: 80, totalRecords: 6400, errorRatePercent: 1.25,
    severity: 'Medium', topViolatingField: 'Employee_ID_Ref', recommendedFix: 'Flag orphan HR document for manual mapping',
    sampleAnomalies: [{ rowId: 'SP-303', fieldValue: 'EMP-DEL-99', issueReason: 'Employee record deleted in HRMS' }]
  },
  {
    datasetId: 'ds8', datasetName: 'Sharepoint_HR_Audit_Docs', sourceSystem: 'SharePoint Storage',
    errorCategory: 'Duplicate Keys', errorCount: 140, totalRecords: 6400, errorRatePercent: 2.19,
    severity: 'High', topViolatingField: 'SharePoint_GUID', recommendedFix: 'Re-index document version history',
    sampleAnomalies: [{ rowId: 'SP-404', fieldValue: '6f9619ff-8b86-d011...', issueReason: 'Duplicate GUID detected' }]
  },
  {
    datasetId: 'ds8', datasetName: 'Sharepoint_HR_Audit_Docs', sourceSystem: 'SharePoint Storage',
    errorCategory: 'Range / Out-of-Bounds', errorCount: 15, totalRecords: 6400, errorRatePercent: 0.23,
    severity: 'Low', topViolatingField: 'File_Size_MB', recommendedFix: 'Compress files exceeding 50MB limit',
    sampleAnomalies: [{ rowId: 'SP-505', fieldValue: '142.5 MB', issueReason: 'File size exceeds 50MB bound' }]
  },
  {
    datasetId: 'ds8', datasetName: 'Sharepoint_HR_Audit_Docs', sourceSystem: 'SharePoint Storage',
    errorCategory: 'Character Encoding', errorCount: 410, totalRecords: 6400, errorRatePercent: 6.41,
    severity: 'Critical', topViolatingField: 'Doc_Title', recommendedFix: 'Clean smart quotes and unescaped ampersands',
    sampleAnomalies: [{ rowId: 'SP-606', fieldValue: 'HR_Policy_â€œFinalâ€.pdf', issueReason: 'Corrupted unicode quotes' }]
  },

  // 9. Legacy HRMS REST
  {
    datasetId: 'ds9', datasetName: 'REST_HRMS_Employees', sourceSystem: 'Legacy HRMS REST',
    errorCategory: 'Null / Missing Required', errorCount: 420, totalRecords: 4200, errorRatePercent: 10.00,
    severity: 'Critical', topViolatingField: 'SSN_Tax_Identifier', recommendedFix: 'Flag employee record for identity compliance review',
    sampleAnomalies: [{ rowId: 'EMP-019', fieldValue: 'NULL', issueReason: 'SSN identifier missing' }]
  },
  {
    datasetId: 'ds9', datasetName: 'REST_HRMS_Employees', sourceSystem: 'Legacy HRMS REST',
    errorCategory: 'Regex / Format Mismatch', errorCount: 280, totalRecords: 4200, errorRatePercent: 6.67,
    severity: 'Critical', topViolatingField: 'Direct_Deposit_Routing', recommendedFix: 'Validate 9-digit ABA routing number algorithm',
    sampleAnomalies: [{ rowId: 'EMP-881', fieldValue: '12345', issueReason: 'Routing number length deficient' }]
  },
  {
    datasetId: 'ds9', datasetName: 'REST_HRMS_Employees', sourceSystem: 'Legacy HRMS REST',
    errorCategory: 'FK Lookup Broken', errorCount: 110, totalRecords: 4200, errorRatePercent: 2.62,
    severity: 'High', topViolatingField: 'Department_Code', recommendedFix: 'Map unassigned dept to General Admin',
    sampleAnomalies: [{ rowId: 'EMP-204', fieldValue: 'DEPT_OBSOLETE', issueReason: 'Department code not in target ERP' }]
  },
  {
    datasetId: 'ds9', datasetName: 'REST_HRMS_Employees', sourceSystem: 'Legacy HRMS REST',
    errorCategory: 'Duplicate Keys', errorCount: 95, totalRecords: 4200, errorRatePercent: 2.26,
    severity: 'High', topViolatingField: 'Work_Email', recommendedFix: 'Merge duplicate employee profiles',
    sampleAnomalies: [{ rowId: 'EMP-330', fieldValue: 'jsmith@legacyhrms.com', issueReason: 'Duplicate work email' }]
  },
  {
    datasetId: 'ds9', datasetName: 'REST_HRMS_Employees', sourceSystem: 'Legacy HRMS REST',
    errorCategory: 'Range / Out-of-Bounds', errorCount: 25, totalRecords: 4200, errorRatePercent: 0.60,
    severity: 'Low', topViolatingField: 'Base_Salary', recommendedFix: 'Verify zero or negative salary values',
    sampleAnomalies: [{ rowId: 'EMP-901', fieldValue: '$0.00', issueReason: 'Base salary cannot be zero' }]
  },
  {
    datasetId: 'ds9', datasetName: 'REST_HRMS_Employees', sourceSystem: 'Legacy HRMS REST',
    errorCategory: 'Character Encoding', errorCount: 160, totalRecords: 4200, errorRatePercent: 3.81,
    severity: 'High', topViolatingField: 'Employee_Full_Name', recommendedFix: 'Convert Latin-1 accent characters to UTF-8',
    sampleAnomalies: [{ rowId: 'EMP-412', fieldValue: 'Ren&eacute; Fran&ccedil;ois', issueReason: 'Raw HTML entity string' }]
  },
];

export const DataQualityHeatmap: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [matrixData, setMatrixData] = useState<HeatmapCellData[]>(INITIAL_MATRIX);
  const [metricMode, setMetricMode] = useState<'errorCount' | 'errorRatePercent'>('errorRatePercent');
  const [selectedSystem, setSelectedSystem] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Real-time Stream Process States
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(true);
  const [streamIntervalMs, setStreamIntervalMs] = useState<number>(3000);
  const [totalEventsIngested, setTotalEventsIngested] = useState<number>(1842910);
  const [ingestionRate, setIngestionRate] = useState<number>(2480);
  const [lastStreamTimestamp, setLastStreamTimestamp] = useState<string>(new Date().toLocaleTimeString());
  const [isBursting, setIsBursting] = useState<boolean>(false);
  const [burstToast, setBurstToast] = useState<string | null>(null);
  const [recentStreamLogs, setRecentStreamLogs] = useState<{ id: string; timestamp: string; system: string; message: string; severity: string }[]>([
    { id: '1', timestamp: new Date().toLocaleTimeString(), system: 'SAP ERP', message: 'CDC Ingestion Batch: 420 recs → 12 missing customer Tax IDs', severity: 'High' },
    { id: '2', timestamp: new Date(Date.now() - 4000).toLocaleTimeString(), system: 'Salesforce CRM', message: 'Real-time Webhook: 5 phone regex format anomalies flagged', severity: 'Medium' },
    { id: '3', timestamp: new Date(Date.now() - 8000).toLocaleTimeString(), system: 'Snowflake Analytics DW', message: 'Kafka Stream Partition: FK Lookup warning on Tenant_ID', severity: 'Low' },
  ]);

  const [selectedCell, setSelectedCell] = useState<HeatmapCellData | null>(
    INITIAL_MATRIX.find((c) => c.datasetId === 'ds2' && c.errorCategory.includes('Regex')) || INITIAL_MATRIX[0]
  );

  const [hoveredCell, setHoveredCell] = useState<HeatmapCellData | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Real-time Stream Engine
  useEffect(() => {
    if (!isLiveStreaming) return;

    const timer = setInterval(() => {
      setMatrixData((prevMatrix) => {
        if (!prevMatrix.length) return prevMatrix;
        const updated = [...prevMatrix];
        
        // Select 1 to 2 random cells to update in real time
        const updateCount = Math.floor(Math.random() * 2) + 1;
        let lastUpdatedSys = '';
        let lastUpdatedMsg = '';
        let lastUpdatedSev = 'Low';

        for (let i = 0; i < updateCount; i++) {
          const idx = Math.floor(Math.random() * updated.length);
          const cell = updated[idx];
          const delta = (Math.random() - 0.48) * 0.35;
          const newRate = Math.max(0.01, parseFloat((cell.errorRatePercent + delta).toFixed(2)));
          const newCount = Math.max(1, Math.round((newRate / 100) * cell.totalRecords));

          let severity: 'Critical' | 'High' | 'Medium' | 'Low' = 'Low';
          if (newRate >= 5.0) severity = 'Critical';
          else if (newRate >= 2.0) severity = 'High';
          else if (newRate >= 0.8) severity = 'Medium';

          updated[idx] = {
            ...cell,
            errorRatePercent: newRate,
            errorCount: newCount,
            severity,
          };

          lastUpdatedSys = cell.sourceSystem;
          lastUpdatedMsg = `Ingested ${Math.floor(Math.random() * 300 + 80)} recs into ${cell.datasetName} (${cell.errorCategory})`;
          lastUpdatedSev = severity;
        }

        const nowStr = new Date().toLocaleTimeString();
        setLastStreamTimestamp(nowStr);
        setTotalEventsIngested((prev) => prev + Math.floor(Math.random() * 150 + 40));
        setIngestionRate(Math.floor(Math.random() * 500 + 2200));

        if (lastUpdatedSys) {
          setRecentStreamLogs((prev) => [
            {
              id: Date.now().toString() + Math.random().toString().slice(2, 5),
              timestamp: nowStr,
              system: lastUpdatedSys,
              message: lastUpdatedMsg,
              severity: lastUpdatedSev,
            },
            ...prev.slice(0, 4),
          ]);
        }

        return updated;
      });
    }, streamIntervalMs);

    return () => clearInterval(timer);
  }, [isLiveStreaming, streamIntervalMs]);

  // Filter datasets & matrix
  const filteredData = matrixData.filter((cell) => {
    if (selectedSystem !== 'ALL' && cell.sourceSystem !== selectedSystem) return false;
    if (selectedSeverity !== 'ALL' && cell.severity !== selectedSeverity) return false;
    if (
      searchFilter &&
      !cell.datasetName.toLowerCase().includes(searchFilter.toLowerCase()) &&
      !cell.errorCategory.toLowerCase().includes(searchFilter.toLowerCase()) &&
      !cell.topViolatingField.toLowerCase().includes(searchFilter.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  // Unique datasets and categories present in filtered data
  const datasetsList = Array.from(
    new Set(filteredData.map((d) => `${d.datasetName}||${d.sourceSystem}`))
  ).map((str: string) => {
    const [name, system] = str.split('||');
    return { name, system };
  });

  const categoriesList = ERROR_CATEGORIES.map((c) => c.name);

  // Compute key summary metrics
  const totalErrorsCount = filteredData.reduce((acc, curr) => acc + curr.errorCount, 0);
  const maxClusterCell = filteredData.reduce(
    (max, curr) => (curr.errorRatePercent > (max?.errorRatePercent || 0) ? curr : max),
    filteredData[0]
  );
  const criticalCount = filteredData.filter((c) => c.severity === 'Critical').length;
  const avgErrorRate = filteredData.length
    ? (filteredData.reduce((acc, c) => acc + c.errorRatePercent, 0) / filteredData.length).toFixed(2)
    : '0.00';

  // Trigger high-throughput CDC Burst Scan across all 9 active connectors
  const handleSimulateRefresh = () => {
    setIsBursting(true);
    const nowStr = new Date().toLocaleTimeString();

    // Re-evaluate matrix data with random burst fluctuation
    const updated = matrixData.map((cell) => {
      const variation = (Math.random() - 0.42) * 0.6;
      const newRate = Math.max(0.01, parseFloat((cell.errorRatePercent * (1 + variation)).toFixed(2)));
      const newCount = Math.round((newRate / 100) * cell.totalRecords);
      let severity: 'Critical' | 'High' | 'Medium' | 'Low' = 'Low';
      if (newRate >= 5.0) severity = 'Critical';
      else if (newRate >= 2.0) severity = 'High';
      else if (newRate >= 0.8) severity = 'Medium';

      return {
        ...cell,
        errorRatePercent: newRate,
        errorCount: newCount,
        severity,
      };
    });

    setMatrixData(updated);

    const burstEvents = Math.floor(Math.random() * 8000 + 14500);
    const burstRate = Math.floor(Math.random() * 3000 + 7200);

    setTotalEventsIngested((prev) => prev + burstEvents);
    setIngestionRate(burstRate);
    setLastStreamTimestamp(nowStr);

    const systems = ['SAP S/4HANA ERP', 'Salesforce CRM', 'Dynamics 365 F&O', 'Oracle Financials Cloud', 'Snowflake Analytics DW', 'PostgreSQL Warehouse'];
    const randomSys = systems[Math.floor(Math.random() * systems.length)];

    setRecentStreamLogs((prev) => [
      {
        id: Date.now().toString() + '1',
        timestamp: nowStr,
        system: randomSys,
        message: `🔥 BURST SCAN: ${burstEvents.toLocaleString()} records ingested across 9 active connectors. Anomalies re-clustered.`,
        severity: 'Critical',
      },
      ...prev.slice(0, 4),
    ]);

    setBurstToast(`CDC Burst Scan Completed: ${burstEvents.toLocaleString()} records evaluated across all 9 connectors!`);

    setTimeout(() => {
      setIsBursting(false);
    }, 900);

    setTimeout(() => {
      setBurstToast(null);
    }, 3500);
  };

  // D3 Heatmap Render Effect
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    // Clear previous D3 chart
    d3.select(svgRef.current).selectAll('*').remove();

    const containerWidth = containerRef.current.clientWidth || 800;
    const margin = { top: 90, right: 30, bottom: 40, left: 190 };
    const width = Math.max(300, containerWidth - margin.left - margin.right);
    const height = Math.max(280, datasetsList.length * 48);

    const svg = d3
      .select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // X Scale (Error Categories)
    const xScale = d3
      .scaleBand()
      .range([0, width])
      .domain(categoriesList)
      .padding(0.08);

    // Y Scale (Datasets)
    const yScale = d3
      .scaleBand()
      .range([0, height])
      .domain(datasetsList.map((d) => d.name))
      .padding(0.08);

    // Color Scale - Warm anomaly density scale
    const maxRate = (d3.max(filteredData, (d: any) => d.errorRatePercent) as unknown as number) || 10;
    const maxCount = (d3.max(filteredData, (d: any) => d.errorCount) as unknown as number) || 1000;
    const maxValue = metricMode === 'errorRatePercent' ? Math.max(10, maxRate) : maxCount;

    const colorScale = d3
      .scaleSequential()
      .domain([0, maxValue])
      .interpolator((t) => {
        // Multi-stage color ramp: clean slate -> pale yellow -> warning orange -> critical crimson -> dark maroon
        if (t === 0) return '#f1f5f9';
        if (t < 0.2) return d3.interpolateYlOrRd(0.15 + t * 1.2);
        if (t < 0.6) return d3.interpolateYlOrRd(0.4 + t * 0.7);
        return d3.interpolateYlOrRd(Math.min(1.0, 0.7 + t * 0.3));
      });

    // Render X Axis (Top Rotated Header Labels)
    const xAxis = g
      .append('g')
      .attr('transform', `translate(0, 0)`)
      .call(d3.axisTop(xScale).tickSize(0));

    xAxis.select('.domain').remove();
    xAxis
      .selectAll('text')
      .style('text-anchor', 'start')
      .attr('dx', '8px')
      .attr('dy', '-8px')
      .attr('transform', 'rotate(-32)')
      .attr('fill', '#475569')
      .attr('font-size', '11px')
      .attr('font-weight', '700')
      .attr('font-family', 'sans-serif');

    // Render Y Axis (Dataset Names with Source System Badges)
    const yAxis = g.append('g').call(d3.axisLeft(yScale).tickSize(0));
    yAxis.select('.domain').remove();
    yAxis
      .selectAll('text')
      .attr('fill', '#0f172a')
      .attr('font-size', '11px')
      .attr('font-weight', '700')
      .attr('font-family', 'monospace')
      .attr('dx', '-10px');

    // Grid Background lines / cards
    g.selectAll('.cell-bg')
      .data(
        datasetsList.flatMap((ds) =>
          categoriesList.map((cat) => ({ datasetName: ds.name, categoryName: cat }))
        )
      )
      .enter()
      .append('rect')
      .attr('x', (d: any) => xScale(d.categoryName) || 0)
      .attr('y', (d: any) => yScale(d.datasetName) || 0)
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('rx', 6)
      .attr('fill', '#f8fafc')
      .attr('stroke', '#e2e8f0')
      .attr('stroke-width', 1);

    // Heatmap Cells (Rectangles)
    const cells = g
      .selectAll('.heatmap-rect')
      .data(filteredData, (d: any) => `${d.datasetName}_${d.errorCategory}`);

    cells
      .enter()
      .append('rect')
      .attr('class', 'heatmap-rect')
      .attr('x', (d: any) => xScale(d.errorCategory) || 0)
      .attr('y', (d: any) => yScale(d.datasetName) || 0)
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('rx', 6)
      .attr('fill', (d: any) => {
        const val = metricMode === 'errorRatePercent' ? d.errorRatePercent : d.errorCount;
        return val === 0 ? '#f1f5f9' : colorScale(val);
      })
      .attr('stroke', (d: any) =>
        selectedCell &&
        selectedCell.datasetName === d.datasetName &&
        selectedCell.errorCategory === d.errorCategory
          ? '#4f46e5'
          : '#cbd5e1'
      )
      .attr('stroke-width', (d: any) =>
        selectedCell &&
        selectedCell.datasetName === d.datasetName &&
        selectedCell.errorCategory === d.errorCategory
          ? 3
          : 1
      )
      .style('cursor', 'pointer')
      .style('transition', 'all 0.2s ease-in-out')
      .on('mouseover', (event, d: any) => {
        setHoveredCell(d);
        const [mouseX, mouseY] = d3.pointer(event, containerRef.current);
        setTooltipPos({ x: mouseX, y: mouseY });
        d3.select(event.currentTarget)
          .attr('stroke', '#4f46e5')
          .attr('stroke-width', 2.5)
          .attr('filter', 'drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.15))');
      })
      .on('mousemove', (event) => {
        const [mouseX, mouseY] = d3.pointer(event, containerRef.current);
        setTooltipPos({ x: mouseX, y: mouseY });
      })
      .on('mouseout', (event, d: any) => {
        setHoveredCell(null);
        setTooltipPos(null);
        const isSelected =
          selectedCell &&
          selectedCell.datasetName === d.datasetName &&
          selectedCell.errorCategory === d.errorCategory;
        d3.select(event.currentTarget)
          .attr('stroke', isSelected ? '#4f46e5' : '#cbd5e1')
          .attr('stroke-width', isSelected ? 3 : 1)
          .attr('filter', null);
      })
      .on('click', (event, d: any) => {
        setSelectedCell(d);
      });

    // Inner Cell Text (Value labels inside heatmap blocks)
    g.selectAll('.heatmap-label')
      .data(filteredData)
      .enter()
      .append('text')
      .attr('x', (d: any) => (xScale(d.errorCategory) || 0) + xScale.bandwidth() / 2)
      .attr('y', (d: any) => (yScale(d.datasetName) || 0) + yScale.bandwidth() / 2 + 4)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-weight', '800')
      .attr('font-family', 'monospace')
      .attr('pointer-events', 'none')
      .attr('fill', (d: any) => {
        const val = metricMode === 'errorRatePercent' ? d.errorRatePercent : d.errorCount;
        return val > maxValue * 0.45 ? '#ffffff' : '#0f172a';
      })
      .text((d: any) => {
        if (metricMode === 'errorRatePercent') {
          return d.errorRatePercent > 0 ? `${d.errorRatePercent}%` : '0%';
        } else {
          return d.errorCount > 0
            ? d.errorCount > 999
              ? `${(d.errorCount / 1000).toFixed(1)}k`
              : `${d.errorCount}`
            : '0';
        }
      });
  }, [
    filteredData,
    metricMode,
    selectedCell,
    datasetsList.length,
    selectedSystem,
    selectedSeverity,
  ]);

  return (
    <div className="space-y-6">
      {/* Real-time Streaming Status Bar & Stream Controls (White Theme) */}
      <div className="bg-white text-slate-800 rounded-2xl p-5 shadow-2xs space-y-4 border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
              <span className={`w-2.5 h-2.5 rounded-full ${isLiveStreaming ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="text-xs font-mono font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-600" />
                {isLiveStreaming ? 'REAL-TIME CDC INGESTION ACTIVE' : 'STREAM PAUSED'}
              </span>
            </div>
            <span className="text-xs font-mono text-slate-500">
              Last Sync: <span className="text-emerald-600 font-bold">{lastStreamTimestamp}</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Stream Toggle */}
            <button
              type="button"
              onClick={() => setIsLiveStreaming(!isLiveStreaming)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                isLiveStreaming
                  ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
              }`}
            >
              {isLiveStreaming ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-amber-600" /> Pause Telemetry
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" /> Resume Telemetry
                </>
              )}
            </button>

            {/* Interval Selector */}
            <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[10px] text-slate-500 uppercase font-mono font-bold">Speed:</span>
              <select
                value={streamIntervalMs}
                onChange={(e) => setStreamIntervalMs(Number(e.target.value))}
                className="bg-transparent text-indigo-600 font-mono font-bold text-xs focus:outline-hidden cursor-pointer"
              >
                <option value={1000} className="bg-white text-slate-800">1s (High Speed)</option>
                <option value={3000} className="bg-white text-slate-800">3s (Normal)</option>
                <option value={5000} className="bg-white text-slate-800">5s (Relaxed)</option>
              </select>
            </div>

            {/* Instant Burst Scan */}
            <button
              type="button"
              onClick={handleSimulateRefresh}
              disabled={isBursting}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer active:scale-95 ${
                isBursting
                  ? 'bg-amber-600 ring-2 ring-amber-300'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {isBursting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                  <span>Scanning Burst...</span>
                </>
              ) : (
                <>
                  <Flame className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
                  <span>Trigger Burst Scan</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Burst Scan Toast Alert Banner */}
        {burstToast && (
          <div className="flex items-center justify-between gap-2 px-3 py-2 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl text-xs font-semibold animate-fadeIn">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0" />
              <span>{burstToast}</span>
            </div>
            <span className="text-[10px] font-mono text-indigo-500 font-bold">CDC BURST ACTIVE</span>
          </div>
        )}

        {/* Real-Time Metrics & Live Log Feed Ticker */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center text-xs">
          <div className="lg:col-span-4 flex items-center gap-4 font-mono text-[11px] text-slate-700">
            <div>
              <span className="text-slate-400 text-[10px] uppercase block">Ingestion Rate</span>
              <span className="text-emerald-600 font-extrabold">{ingestionRate.toLocaleString()} rec/sec</span>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <span className="text-slate-400 text-[10px] uppercase block">Events Monitored Today</span>
              <span className="text-indigo-600 font-extrabold">{totalEventsIngested.toLocaleString()}</span>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <span className="text-slate-400 text-[10px] uppercase block">Connectors Monitored</span>
              <span className="text-amber-600 font-extrabold">9 / 9 Active</span>
            </div>
          </div>

          <div className="lg:col-span-8 bg-slate-50/80 rounded-xl p-2.5 border border-slate-200 overflow-hidden">
            <div className="flex items-center gap-2 mb-1.5">
              <Activity className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                Live Anomaly Stream Feed (Real-time CDC Process):
              </span>
            </div>
            <div className="space-y-1 font-mono text-[11px] max-h-16 overflow-y-auto pr-1 custom-scrollbar">
              {recentStreamLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between text-slate-700 gap-2">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-slate-400 text-[10px] shrink-0">[{log.timestamp}]</span>
                    <span className="px-1.5 py-0.5 bg-slate-200 text-indigo-700 rounded text-[9px] font-bold shrink-0">
                      {log.system}
                    </span>
                    <span className="truncate text-slate-800 font-medium">{log.message}</span>
                  </div>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold shrink-0 ${
                      log.severity === 'Critical'
                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                        : log.severity === 'High'
                        ? 'bg-orange-100 text-orange-700 border border-orange-200'
                        : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {log.severity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Banner & Control Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 text-xs font-bold rounded-full border border-rose-200 flex items-center gap-1">
                <Grid className="w-3 h-3 text-rose-600" /> D3 DATA QUALITY ANOMALY MATRIX
              </span>
              <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> 9 CONNECTORS STREAMING REAL-TIME
              </span>
            </div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Source Dataset Data Quality Heatmap
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Visualize concentrations of validation failures and anomalies across multi-ERP source data structures to prioritize cleansing routines in real time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Metric Mode Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setMetricMode('errorRatePercent')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  metricMode === 'errorRatePercent'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Error Rate (%)
              </button>
              <button
                type="button"
                onClick={() => setMetricMode('errorCount')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  metricMode === 'errorCount'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Error Count (#)
              </button>
            </div>

            {/* Refresh / Re-evaluate Simulation */}
            <button
              type="button"
              onClick={handleSimulateRefresh}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
              <span>Simulate Re-Scan</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter dataset, rule or field..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl w-52 focus:outline-hidden focus:border-indigo-500 font-medium"
              />
            </div>

            {/* Source System Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <Database className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] font-bold text-slate-500 uppercase">System:</span>
              <select
                value={selectedSystem}
                onChange={(e) => setSelectedSystem(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl px-2.5 py-1.5 focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">All Source Systems (9 Active)</option>
                <option value="SAP ERP">SAP ERP</option>
                <option value="Salesforce CRM">Salesforce CRM</option>
                <option value="Dynamics 365 F&O">Dynamics 365 F&O</option>
                <option value="Oracle Financials Cloud">Oracle Financials Cloud</option>
                <option value="HubSpot CRM">HubSpot CRM</option>
                <option value="Snowflake Analytics DW">Snowflake Analytics DW</option>
                <option value="PostgreSQL Warehouse">PostgreSQL Warehouse</option>
                <option value="SharePoint Storage">SharePoint Storage</option>
                <option value="Legacy HRMS REST">Legacy HRMS REST</option>
              </select>
            </div>

            {/* Severity Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] font-bold text-slate-500 uppercase">Severity:</span>
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl px-2.5 py-1.5 focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">All Severities</option>
                <option value="Critical">Critical (&gt;= 5%)</option>
                <option value="High">High (2% - 5%)</option>
                <option value="Medium">Medium (0.8% - 2%)</option>
                <option value="Low">Low (&lt; 0.8%)</option>
              </select>
            </div>
          </div>

          {/* Quick Legend Bar */}
          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
            <span>Density:</span>
            <div className="flex items-center gap-1 font-mono text-[10px]">
              <span className="w-3 h-3 rounded-xs bg-slate-100 border border-slate-300 inline-block" /> 0%
              <span className="w-3 h-3 rounded-xs bg-amber-200 inline-block ml-1" /> Low
              <span className="w-3 h-3 rounded-xs bg-orange-400 inline-block ml-1" /> Med
              <span className="w-3 h-3 rounded-xs bg-rose-600 inline-block ml-1" /> High
              <span className="w-3 h-3 rounded-xs bg-red-900 inline-block ml-1" /> Critical
            </div>
          </div>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-500" /> Total Anomaly Count
            </span>
            <span className="text-xs font-mono font-bold bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded">
              {filteredData.length} cells
            </span>
          </div>
          <div className="text-xl font-extrabold text-slate-900 font-mono">
            {totalErrorsCount.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500">Total record error instances detected</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <AlertOctagon className="w-3.5 h-3.5 text-amber-500" /> Highest Cluster
            </span>
            <span className="text-[10px] font-mono font-bold bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded">
              {maxClusterCell?.errorRatePercent}%
            </span>
          </div>
          <div className="text-sm font-extrabold text-slate-900 font-mono truncate">
            {maxClusterCell?.datasetName || 'N/A'}
          </div>
          <p className="text-[11px] text-slate-500 truncate">{maxClusterCell?.errorCategory}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Critical Hotspots
            </span>
            <span className="text-[10px] font-mono font-bold bg-rose-600 text-white px-1.5 py-0.5 rounded">
              SLA Risk
            </span>
          </div>
          <div className="text-xl font-extrabold text-rose-600 font-mono">{criticalCount}</div>
          <p className="text-[11px] text-slate-500">Cells exceeding 5.0% error rate</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-indigo-500" /> Avg Anomaly Density
            </span>
            <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">
              Batch Mean
            </span>
          </div>
          <div className="text-xl font-extrabold text-indigo-600 font-mono">{avgErrorRate}%</div>
          <p className="text-[11px] text-slate-500">Average error frequency across datasets</p>
        </div>
      </div>

      {/* Main Heatmap Visualization Canvas & Interactive Cell Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* D3 Heatmap SVG Canvas Container */}
        <div
          ref={containerRef}
          className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs relative overflow-x-auto"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Grid className="w-4 h-4 text-indigo-600" />
              Source Dataset × Validation Anomaly Matrix
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              Click any block to inspect anomalies & automated fixes
            </span>
          </div>

          <svg ref={svgRef} className="w-full min-w-[640px] select-none" />

          {/* D3 Tooltip */}
          {hoveredCell && tooltipPos && (
            <div
              style={{
                position: 'absolute',
                left: `${tooltipPos.x + 12}px`,
                top: `${tooltipPos.y - 12}px`,
                pointerEvents: 'none',
              }}
              className="z-50 bg-slate-900 text-white rounded-xl p-3 text-xs shadow-2xl border border-slate-700 space-y-1.5 w-64 backdrop-blur-md bg-opacity-95"
            >
              <div className="flex items-center justify-between border-b border-slate-700 pb-1">
                <span className="font-bold text-slate-300 font-mono text-[10px]">
                  {hoveredCell.sourceSystem}
                </span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold ${
                    hoveredCell.severity === 'Critical'
                      ? 'bg-rose-500 text-white'
                      : hoveredCell.severity === 'High'
                      ? 'bg-orange-500 text-white'
                      : 'bg-amber-500 text-slate-950'
                  }`}
                >
                  {hoveredCell.severity} Severity
                </span>
              </div>
              <div className="font-extrabold text-white text-xs">{hoveredCell.datasetName}</div>
              <div className="text-slate-300 text-[11px] font-semibold">{hoveredCell.errorCategory}</div>
              <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[9px]">ERROR COUNT</span>
                  <span className="font-bold text-rose-400">
                    {hoveredCell.errorCount.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px]">ERROR RATE</span>
                  <span className="font-bold text-indigo-300">{hoveredCell.errorRatePercent}%</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Selected Cell Drill-Down Drawer */}
        <div className="lg:col-span-4 space-y-4">
          {selectedCell ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs">
              <div className="border-b border-slate-100 pb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-mono font-bold rounded border border-indigo-100">
                    {selectedCell.sourceSystem}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-extrabold rounded ${
                      selectedCell.severity === 'Critical'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : selectedCell.severity === 'High'
                        ? 'bg-orange-100 text-orange-800 border border-orange-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {selectedCell.severity} Priority
                  </span>
                </div>
                <h3 className="text-sm font-extrabold text-slate-900 font-mono">
                  {selectedCell.datasetName}
                </h3>
                <p className="text-xs font-semibold text-indigo-600 mt-0.5">
                  Category: {selectedCell.errorCategory}
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase block">
                    Total Affected
                  </span>
                  <span className="text-sm font-bold text-slate-800">
                    {selectedCell.errorCount.toLocaleString()} recs
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase block">
                    Batch Error %
                  </span>
                  <span className="text-sm font-bold text-rose-600">
                    {selectedCell.errorRatePercent}%
                  </span>
                </div>
              </div>

              {/* Top Violating Field & Action */}
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                    Primary Violating Field
                  </span>
                  <div className="p-2 bg-slate-900 text-emerald-400 font-mono rounded-xl font-bold text-xs flex items-center justify-between">
                    <span>{selectedCell.topViolatingField}</span>
                    <span className="text-[10px] text-slate-400 font-normal">Indexed Field</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                    Recommended Automated Fix
                  </span>
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{selectedCell.recommendedFix}</span>
                  </div>
                </div>
              </div>

              {/* Sample Anomalies List */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Sample Record Anomaly Payloads
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {selectedCell.sampleAnomalies.map((sample, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-[11px] font-mono space-y-0.5"
                    >
                      <div className="flex items-center justify-between text-slate-500 text-[10px]">
                        <span className="font-bold text-slate-700">{sample.rowId}</span>
                        <span className="text-rose-600 font-semibold">{sample.issueReason}</span>
                      </div>
                      <div className="text-slate-900 bg-white p-1 rounded border border-slate-200 truncate">
                        Value: <span className="text-rose-700 font-bold">{sample.fieldValue}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-8 text-center space-y-2 text-slate-500">
              <Grid className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs font-bold">Select a Heatmap Cell</p>
              <p className="text-[11px] text-slate-400">
                Click any cell in the matrix to view top violating fields and cleansing recommendations.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
