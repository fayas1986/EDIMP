import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { FieldLineageD3Graph } from './FieldLineageD3Graph';
import {
  GitCommit,
  Database,
  ArrowRight,
  ShieldCheck,
  Zap,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Code2,
  Table,
  Layers,
  Sparkles,
  ChevronRight,
  Info,
  Server,
  FileSpreadsheet,
  Download,
  FileImage,
  FileCode,
  Check,
  Copy,
  Eye,
  X,
  Share2,
  ZoomIn,
  ZoomOut,
  Play,
  Maximize2,
  SlidersHorizontal,
  Terminal,
  Activity,
  Workflow,
  HelpCircle,
} from 'lucide-react';

interface LineageNode {
  id: string;
  stageName: string;
  type: 'Source' | 'Ingest' | 'Transform' | 'Validate' | 'Target';
  systemName: string;
  recordsCount: number;
  status: 'Completed' | 'Processing' | 'Warning' | 'Passed';
  details: string;
  latencyMs: number;
}

export interface TransformationStep {
  stepNumber: number;
  title: string;
  logic: string;
  outputSample: string;
}

export interface FieldLineageMap {
  sourceField: string;
  sourceType: string;
  sourceTable?: string;
  sourceSystem?: string;
  transformationLogic: string;
  transformationType: 'Direct Copy' | 'Format Normalization' | 'ISO Standardization' | 'Lookup & Enrichment' | 'Encryption / Hash';
  transformationSteps?: TransformationStep[];
  targetField: string;
  targetType: string;
  targetTable?: string;
  targetSystem?: string;
  sampleBefore: string;
  sampleAfter: string;
  isValid: boolean;
  passRatePercent?: number;
  errorReason?: string;
  sqlSnippet?: string;
  pysparkSnippet?: string;
  dbtSnippet?: string;
}

const entityFieldLineageMaps: Record<string, FieldLineageMap[]> = {
  Customers: [
    {
      sourceField: 'KUNNR',
      sourceType: 'VARCHAR(10)',
      sourceTable: 'KNA1',
      sourceSystem: 'SAP ECC ERP',
      transformationLogic: 'TRIM() -> PADDED_ZERO_REMOVE() -> PREFIX("CUST-")',
      transformationType: 'Format Normalization',
      targetField: 'Customer_No',
      targetType: 'String(20)',
      targetTable: 'Account',
      targetSystem: 'Dynamics 365 BC',
      sampleBefore: '0000100482',
      sampleAfter: 'CUST-100482',
      isValid: true,
      passRatePercent: 100,
      transformationSteps: [
        { stepNumber: 1, title: 'Trim Whitespace', logic: 'TRIM(KUNNR)', outputSample: '0000100482' },
        { stepNumber: 2, title: 'Strip Leading Zeroes', logic: 'REGEXP_REPLACE(val, "^0+", "")', outputSample: '100482' },
        { stepNumber: 3, title: 'Apply Canonical Prefix', logic: 'CONCAT("CUST-", val)', outputSample: 'CUST-100482' },
      ],
      sqlSnippet: "SELECT CONCAT('CUST-', LTRIM(KUNNR, '0')) AS Customer_No FROM KNA1;",
      pysparkSnippet: "df.withColumn('Customer_No', concat(lit('CUST-'), regexp_replace(col('KUNNR'), '^0+', '')))",
      dbtSnippet: "concat('CUST-', regexp_replace(KUNNR, '^0+', '')) as customer_no",
    },
    {
      sourceField: 'NAME1',
      sourceType: 'NVARCHAR(80)',
      sourceTable: 'KNA1',
      sourceSystem: 'SAP ECC ERP',
      transformationLogic: 'TRIM(NAME1) -> INITCAP_PROPER()',
      transformationType: 'Direct Copy',
      targetField: 'Full_Name',
      targetType: 'String(100)',
      targetTable: 'Account',
      targetSystem: 'Dynamics 365 BC',
      sampleBefore: 'ACME LOGISTICS LLC',
      sampleAfter: 'Acme Logistics LLC',
      isValid: true,
      passRatePercent: 99.8,
      transformationSteps: [
        { stepNumber: 1, title: 'Sanitize Characters', logic: 'TRIM(NAME1)', outputSample: 'ACME LOGISTICS LLC' },
        { stepNumber: 2, title: 'Title Case Formatting', logic: 'INITCAP(LOWER(val))', outputSample: 'Acme Logistics LLC' },
      ],
      sqlSnippet: "SELECT INITCAP(TRIM(NAME1)) AS Full_Name FROM KNA1;",
      pysparkSnippet: "df.withColumn('Full_Name', initcap(trim(col('NAME1'))))",
      dbtSnippet: "initcap(trim(NAME1)) as full_name",
    },
    {
      sourceField: 'STCEG',
      sourceType: 'VARCHAR(20)',
      sourceTable: 'KNA1',
      sourceSystem: 'SAP ECC ERP',
      transformationLogic: 'TAX_ID_REGEX_VALIDATE(STCEG, Country) -> FORMAT_EU_VAT()',
      transformationType: 'Format Normalization',
      targetField: 'Tax_Registration_Number',
      targetType: 'String(30)',
      targetTable: 'Account',
      targetSystem: 'Dynamics 365 BC',
      sampleBefore: 'DE 123456789',
      sampleAfter: 'DE123456789',
      isValid: false,
      passRatePercent: 98.2,
      errorReason: '12 records failed EU VAT checksum syntax validation and were flagged for manual review',
      transformationSteps: [
        { stepNumber: 1, title: 'Remove Non-Alphanumeric', logic: 'REGEXP_REPLACE(STCEG, "[^A-Z0-9]", "")', outputSample: 'DE123456789' },
        { stepNumber: 2, title: 'EU VAT Modulus Check', logic: 'EU_VAT_CHECKSUM_VAL(val, LAND1)', outputSample: 'DE123456789 (VALID)' },
      ],
      sqlSnippet: "SELECT REGEXP_REPLACE(STCEG, '[^A-Za-z0-9]', '') AS Tax_Registration_Number FROM KNA1;",
      pysparkSnippet: "df.withColumn('Tax_Registration_Number', regexp_replace(col('STCEG'), '[^A-Za-z0-9]', ''))",
      dbtSnippet: "regexp_replace(STCEG, '[^A-Za-z0-9]', '') as tax_registration_number",
    },
    {
      sourceField: 'LAND1',
      sourceType: 'CHAR(3)',
      sourceTable: 'KNA1',
      sourceSystem: 'SAP ECC ERP',
      transformationLogic: 'ISO3_TO_ISO2_LOOKUP(LAND1)',
      transformationType: 'ISO Standardization',
      targetField: 'Country_Region_Code',
      targetType: 'String(2)',
      targetTable: 'Account',
      targetSystem: 'Dynamics 365 BC',
      sampleBefore: 'DEU',
      sampleAfter: 'DE',
      isValid: true,
      passRatePercent: 100,
      transformationSteps: [
        { stepNumber: 1, title: 'Upper Trim', logic: 'UPPER(TRIM(LAND1))', outputSample: 'DEU' },
        { stepNumber: 2, title: 'ISO 3166-1 Crosswalk', logic: 'LOOKUP_ISO3_TO_ISO2(val)', outputSample: 'DE' },
      ],
      sqlSnippet: "SELECT iso2_code AS Country_Region_Code FROM iso_crosswalk WHERE iso3_code = LAND1;",
      pysparkSnippet: "df.join(iso_df, df.LAND1 == iso_df.iso3_code, 'left').select('iso2_code')",
      dbtSnippet: "coalesce(iso_map.iso2_code, LAND1) as country_region_code",
    },
    {
      sourceField: 'SMTP_ADDR',
      sourceType: 'VARCHAR(241)',
      sourceTable: 'ADR6',
      sourceSystem: 'SAP ECC ERP',
      transformationLogic: 'LOWER(TRIM(SMTP_ADDR)) -> EMAIL_SYNTAX_CHECK()',
      transformationType: 'Format Normalization',
      targetField: 'Contact_Email',
      targetType: 'String(100)',
      targetTable: 'Account',
      targetSystem: 'Dynamics 365 BC',
      sampleBefore: 'BILLING@ACME.COM ',
      sampleAfter: 'billing@acme.com',
      isValid: true,
      passRatePercent: 99.4,
      transformationSteps: [
        { stepNumber: 1, title: 'Case Conversion & Trim', logic: 'LOWER(TRIM(SMTP_ADDR))', outputSample: 'billing@acme.com' },
        { stepNumber: 2, title: 'RFC 5322 Syntax Check', logic: 'REGEX_MATCH(val, "^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$")', outputSample: 'billing@acme.com (PASSED)' },
      ],
      sqlSnippet: "SELECT LOWER(TRIM(SMTP_ADDR)) AS Contact_Email FROM ADR6;",
      pysparkSnippet: "df.withColumn('Contact_Email', lower(trim(col('SMTP_ADDR'))))",
      dbtSnippet: "lower(trim(SMTP_ADDR)) as contact_email",
    },
    {
      sourceField: 'WAERS',
      sourceType: 'CHAR(5)',
      sourceTable: 'KNA1',
      sourceSystem: 'SAP ECC ERP',
      transformationLogic: 'CURRENCY_MAPPER(WAERS, Default: USD)',
      transformationType: 'Lookup & Enrichment',
      targetField: 'Currency_Code',
      targetType: 'String(3)',
      targetTable: 'Account',
      targetSystem: 'Dynamics 365 BC',
      sampleBefore: 'EUR',
      sampleAfter: 'EUR',
      isValid: true,
      passRatePercent: 100,
      transformationSteps: [
        { stepNumber: 1, title: 'Default Value Injection', logic: 'COALESCE(TRIM(WAERS), "USD")', outputSample: 'EUR' },
        { stepNumber: 2, title: 'ISO 4217 Validation', logic: 'VALIDATE_CURRENCY(val)', outputSample: 'EUR' },
      ],
      sqlSnippet: "SELECT COALESCE(NULLIF(TRIM(WAERS), ''), 'USD') AS Currency_Code FROM KNA1;",
      pysparkSnippet: "df.withColumn('Currency_Code', coalesce(nullif(trim(col('WAERS')), ''), lit('USD')))",
      dbtSnippet: "coalesce(nullif(trim(WAERS), ''), 'USD') as currency_code",
    },
  ],
  Invoices: [
    {
      sourceField: 'TRX_NUMBER',
      sourceType: 'VARCHAR(20)',
      sourceTable: 'INVOICE_HEADERS',
      sourceSystem: 'Oracle EBS Financials',
      transformationLogic: 'TRIM() -> ADD_BRANCH_PREFIX("FIN-US-")',
      transformationType: 'Format Normalization',
      targetField: 'Invoice_Ref_Num',
      targetType: 'String(30)',
      targetTable: 'FIN_INVOICES',
      targetSystem: 'Snowflake Core DWH',
      sampleBefore: 'INV-2026-9902',
      sampleAfter: 'FIN-US-INV-2026-9902',
      isValid: true,
      passRatePercent: 100,
      transformationSteps: [
        { stepNumber: 1, title: 'Trim Padding', logic: 'TRIM(TRX_NUMBER)', outputSample: 'INV-2026-9902' },
        { stepNumber: 2, title: 'Append Region Code', logic: 'CONCAT("FIN-US-", val)', outputSample: 'FIN-US-INV-2026-9902' },
      ],
      sqlSnippet: "SELECT CONCAT('FIN-US-', TRIM(TRX_NUMBER)) AS Invoice_Ref_Num FROM INVOICE_HEADERS;",
      pysparkSnippet: "df.withColumn('Invoice_Ref_Num', concat(lit('FIN-US-'), trim(col('TRX_NUMBER'))))",
      dbtSnippet: "concat('FIN-US-', trim(TRX_NUMBER)) as invoice_ref_num",
    },
    {
      sourceField: 'AMOUNT_DUE_ORIGINAL',
      sourceType: 'NUMERIC(15,2)',
      sourceTable: 'INVOICE_HEADERS',
      sourceSystem: 'Oracle EBS Financials',
      transformationLogic: 'CURRENCY_CONVERT(AMOUNT_DUE, CURR_CODE, EXCHANGE_DATE) -> ROUND(2)',
      transformationType: 'Lookup & Enrichment',
      targetField: 'Gross_Amount_USD',
      targetType: 'DECIMAL(18,2)',
      targetTable: 'FIN_INVOICES',
      targetSystem: 'Snowflake Core DWH',
      sampleBefore: '12450.00 EUR',
      sampleAfter: '$13,446.00',
      isValid: true,
      passRatePercent: 99.9,
      transformationSteps: [
        { stepNumber: 1, title: 'FX Rate Lookup', logic: 'LOOKUP_EXCHANGE_RATE(CURRENCY, DATE)', outputSample: '1.0800 USD/EUR' },
        { stepNumber: 2, title: 'FX Conversion', logic: 'AMOUNT_DUE * FX_RATE', outputSample: '13446.00' },
      ],
      sqlSnippet: "SELECT ROUND(a.AMOUNT_DUE_ORIGINAL * r.rate, 2) AS Gross_Amount_USD FROM INVOICE_HEADERS a JOIN rates r ON a.INVOICE_DATE = r.date;",
      pysparkSnippet: "df.withColumn('Gross_Amount_USD', round(col('AMOUNT_DUE_ORIGINAL') * col('fx_rate'), 2))",
      dbtSnippet: "round(a.amount_due_original * r.exchange_rate, 2) as gross_amount_usd",
    },
    {
      sourceField: 'INVOICE_DATE',
      sourceType: 'VARCHAR(15)',
      sourceTable: 'INVOICE_HEADERS',
      sourceSystem: 'Oracle EBS Financials',
      transformationLogic: 'DATE_PARSE("DD-MON-YYYY") -> TO_ISO8601()',
      transformationType: 'ISO Standardization',
      targetField: 'Post_Date_ISO',
      targetType: 'TIMESTAMP',
      targetTable: 'FIN_INVOICES',
      targetSystem: 'Snowflake Core DWH',
      sampleBefore: '14-MAR-2026',
      sampleAfter: '2026-03-14T00:00:00Z',
      isValid: true,
      passRatePercent: 100,
      transformationSteps: [
        { stepNumber: 1, title: 'Parse String Date', logic: 'TO_DATE(INVOICE_DATE, "DD-MON-YYYY")', outputSample: '2026-03-14' },
        { stepNumber: 2, title: 'Format ISO 8601', logic: 'TO_TIMESTAMP_NTZ(val)', outputSample: '2026-03-14T00:00:00Z' },
      ],
      sqlSnippet: "SELECT TO_TIMESTAMP_NTZ(INVOICE_DATE, 'DD-MON-YYYY') AS Post_Date_ISO FROM INVOICE_HEADERS;",
      pysparkSnippet: "df.withColumn('Post_Date_ISO', to_timestamp(col('INVOICE_DATE'), 'dd-MMM-yyyy'))",
      dbtSnippet: "to_timestamp_ntz(INVOICE_DATE, 'DD-MON-YYYY') as post_date_iso",
    },
    {
      sourceField: 'GL_ACCOUNT_CODE',
      sourceType: 'VARCHAR(25)',
      sourceTable: 'INVOICE_HEADERS',
      sourceSystem: 'Oracle EBS Financials',
      transformationLogic: 'SPLIT("-") -> CROSSWALK_MAPPER(ORACLE_GL, SNOWFLAKE_GL)',
      transformationType: 'Lookup & Enrichment',
      targetField: 'General_Ledger_Code',
      targetType: 'String(20)',
      targetTable: 'FIN_INVOICES',
      targetSystem: 'Snowflake Core DWH',
      sampleBefore: '01-4100-882-00',
      sampleAfter: 'GL-4100-REV',
      isValid: false,
      passRatePercent: 97.5,
      errorReason: '8 invoice records contained obsolete segment codes unmapped in Snowflake COA table',
      transformationSteps: [
        { stepNumber: 1, title: 'Extract Account Segment', logic: 'SPLIT_PART(GL_ACCOUNT_CODE, "-", 2)', outputSample: '4100' },
        { stepNumber: 2, title: 'COA Crosswalk Mapping', logic: 'LOOKUP_NEW_GL_MAP(segment)', outputSample: 'GL-4100-REV' },
      ],
      sqlSnippet: "SELECT m.target_gl_code AS General_Ledger_Code FROM INVOICE_HEADERS h LEFT JOIN gl_crosswalk m ON h.GL_ACCOUNT_CODE = m.legacy_code;",
      pysparkSnippet: "df.join(gl_map_df, 'GL_ACCOUNT_CODE', 'left').select('target_gl_code')",
      dbtSnippet: "coalesce(gl_crosswalk.target_gl_code, 'GL-UNMAPPED') as general_ledger_code",
    },
  ],
  Orders: [
    {
      sourceField: 'OrderNumber',
      sourceType: 'VARCHAR(30)',
      sourceTable: 'Order__c',
      sourceSystem: 'Salesforce Commerce API',
      transformationLogic: 'TRIM() -> UUID_GEN_V5("salesforce.order")',
      transformationType: 'Encryption / Hash',
      targetField: 'order_id',
      targetType: 'UUID',
      targetTable: 'orders_tbl',
      targetSystem: 'Aurora PG SQL DB',
      sampleBefore: 'ORD-984021',
      sampleAfter: 'e4f2a381-8192-50d4-a129-91823ab1293f',
      isValid: true,
      passRatePercent: 100,
      transformationSteps: [
        { stepNumber: 1, title: 'Clean Input String', logic: 'TRIM(OrderNumber)', outputSample: 'ORD-984021' },
        { stepNumber: 2, title: 'SHA-256 / UUID v5 Hash', logic: 'UUID_GENERATE_V5(NAMESPACE_URL, val)', outputSample: 'e4f2a381-8192-50d4-a129-91823ab1293f' },
      ],
      sqlSnippet: "SELECT uuid_generate_v5('a3b2c1d0-0000-0000-0000-000000000000'::uuid, OrderNumber) AS order_id FROM Order__c;",
      pysparkSnippet: "df.withColumn('order_id', expr('uuid_v5(OrderNumber)'))",
      dbtSnippet: "uuid_generate_v5('a3b2c1d0-0000-0000-0000-000000000000'::uuid, OrderNumber) as order_id",
    },
    {
      sourceField: 'TotalAmount',
      sourceType: 'DECIMAL(12,2)',
      sourceTable: 'Order__c',
      sourceSystem: 'Salesforce Commerce API',
      transformationLogic: 'MULTIPLY(100) -> CAST_AS_BIGINT()',
      transformationType: 'Format Normalization',
      targetField: 'total_cents',
      targetType: 'BIGINT',
      targetTable: 'orders_tbl',
      targetSystem: 'Aurora PG SQL DB',
      sampleBefore: '149.99',
      sampleAfter: '14999',
      isValid: true,
      passRatePercent: 100,
      transformationSteps: [
        { stepNumber: 1, title: 'Scale to Cents', logic: 'TotalAmount * 100', outputSample: '14999.00' },
        { stepNumber: 2, title: 'Cast Integer', logic: 'CAST(val AS BIGINT)', outputSample: '14999' },
      ],
      sqlSnippet: "SELECT CAST(TotalAmount * 100 AS BIGINT) AS total_cents FROM Order__c;",
      pysparkSnippet: "df.withColumn('total_cents', (col('TotalAmount') * 100).cast('long'))",
      dbtSnippet: "cast(TotalAmount * 100 as bigint) as total_cents",
    },
    {
      sourceField: 'Status',
      sourceType: 'VARCHAR(20)',
      sourceTable: 'Order__c',
      sourceSystem: 'Salesforce Commerce API',
      transformationLogic: 'ENUM_MAPPER("Activated"->"COMPLETED", "Draft"->"PENDING")',
      transformationType: 'Lookup & Enrichment',
      targetField: 'order_status',
      targetType: 'VARCHAR(15)',
      targetTable: 'orders_tbl',
      targetSystem: 'Aurora PG SQL DB',
      sampleBefore: 'Activated',
      sampleAfter: 'COMPLETED',
      isValid: true,
      passRatePercent: 100,
      transformationSteps: [
        { stepNumber: 1, title: 'String Upper Trim', logic: 'UPPER(TRIM(Status))', outputSample: 'ACTIVATED' },
        { stepNumber: 2, title: 'Status Enum Mapping', logic: 'CASE WHEN "ACTIVATED" THEN "COMPLETED"', outputSample: 'COMPLETED' },
      ],
      sqlSnippet: "SELECT CASE Status WHEN 'Activated' THEN 'COMPLETED' WHEN 'Draft' THEN 'PENDING' ELSE 'UNKNOWN' END AS order_status FROM Order__c;",
      pysparkSnippet: "df.withColumn('order_status', when(col('Status') == 'Activated', 'COMPLETED').otherwise('PENDING'))",
      dbtSnippet: "case when Status = 'Activated' then 'COMPLETED' else 'PENDING' end as order_status",
    },
  ],
  Products: [
    {
      sourceField: 'ITMNO',
      sourceType: 'CHAR(15)',
      sourceTable: 'ITMMAST',
      sourceSystem: 'IBM AS400 DB2 Ledger',
      transformationLogic: 'TRIM() -> PAD_LEFT(18, "0")',
      transformationType: 'Format Normalization',
      targetField: 'MATNR',
      targetType: 'CHAR(18)',
      targetTable: 'MARA',
      targetSystem: 'SAP S/4HANA Cloud',
      sampleBefore: '88392011',
      sampleAfter: '000000000088392011',
      isValid: true,
      passRatePercent: 100,
      transformationSteps: [
        { stepNumber: 1, title: 'Clean Whitespace', logic: 'TRIM(ITMNO)', outputSample: '88392011' },
        { stepNumber: 2, title: 'Left Pad Zeroes (18 Width)', logic: 'LPAD(val, 18, "0")', outputSample: '000000000088392011' },
      ],
      sqlSnippet: "SELECT LPAD(TRIM(ITMNO), 18, '0') AS MATNR FROM ITMMAST;",
      pysparkSnippet: "df.withColumn('MATNR', lpad(trim(col('ITMNO')), 18, '0'))",
      dbtSnippet: "lpad(trim(ITMNO), 18, '0') as matnr",
    },
    {
      sourceField: 'ITMDESC',
      sourceType: 'CHAR(60)',
      sourceTable: 'ITMMAST',
      sourceSystem: 'IBM AS400 DB2 Ledger',
      transformationLogic: 'CONVERT_ENCODING("EBCDIC", "UTF-8") -> SUBSTRING(0, 40)',
      transformationType: 'Format Normalization',
      targetField: 'MAKTX',
      targetType: 'VARCHAR(40)',
      targetTable: 'MAKT',
      targetSystem: 'SAP S/4HANA Cloud',
      sampleBefore: 'STAINLESS STEEL 316 FLANGE VALVE HEAVY DUTY',
      sampleAfter: 'STAINLESS STEEL 316 FLANGE VALVE HEAVY D',
      isValid: false,
      passRatePercent: 98.6,
      errorReason: '20 oversized descriptions were truncated to fit SAP 40-char limit',
      transformationSteps: [
        { stepNumber: 1, title: 'UTF-8 Decoding', logic: 'CONVERT_ENCODING(ITMDESC, "EBCDIC", "UTF-8")', outputSample: 'STAINLESS STEEL 316 FLANGE VALVE HEAVY DUTY' },
        { stepNumber: 2, title: 'Truncate Length', logic: 'SUBSTRING(val, 1, 40)', outputSample: 'STAINLESS STEEL 316 FLANGE VALVE HEAVY D' },
      ],
      sqlSnippet: "SELECT SUBSTRING(TRIM(ITMDESC), 1, 40) AS MAKTX FROM ITMMAST;",
      pysparkSnippet: "df.withColumn('MAKTX', substring(trim(col('ITMDESC')), 1, 40))",
      dbtSnippet: "substring(trim(ITMDESC), 1, 40) as maktx",
    },
    {
      sourceField: 'UOM',
      sourceType: 'CHAR(3)',
      sourceTable: 'ITMMAST',
      sourceSystem: 'IBM AS400 DB2 Ledger',
      transformationLogic: 'UOM_ISO_CONVERT("EA"->"PC", "LBS"->"KG")',
      transformationType: 'ISO Standardization',
      targetField: 'MEINS',
      targetType: 'CHAR(3)',
      targetTable: 'MARA',
      targetSystem: 'SAP S/4HANA Cloud',
      sampleBefore: 'EA',
      sampleAfter: 'PC',
      isValid: true,
      passRatePercent: 100,
      transformationSteps: [
        { stepNumber: 1, title: 'UOM Lookup Mapping', logic: 'LOOKUP_ISO_UOM(TRIM(UOM))', outputSample: 'PC' },
      ],
      sqlSnippet: "SELECT iso_uom AS MEINS FROM uom_crosswalk WHERE as400_uom = ITMMAST.UOM;",
      pysparkSnippet: "df.join(uom_df, df.UOM == uom_df.as400_uom).select('iso_uom')",
      dbtSnippet: "coalesce(uom_map.iso_uom, UOM) as meins",
    },
  ],
  SupplyChain: [
    {
      sourceField: 'TRACK_ID',
      sourceType: 'VARCHAR(25)',
      sourceTable: 'SHIP_LOGS',
      sourceSystem: 'FedEx Web API',
      transformationLogic: 'TRIM() -> HASH_MD5()',
      transformationType: 'Encryption / Hash',
      targetField: 'shipping_uid',
      targetType: 'UUID',
      targetTable: 'WAREHOUSE_RECEIPTS',
      targetSystem: 'Oracle Warehouse Mgmt',
      sampleBefore: '783920110492',
      sampleAfter: 'a93f-b281-c918-23af',
      isValid: true,
      passRatePercent: 100,
      transformationSteps: [
        { stepNumber: 1, title: 'Normalize ID', logic: 'TRIM(TRACK_ID)', outputSample: '783920110492' },
        { stepNumber: 2, title: 'MD5 Obfuscation', logic: 'MD5(val)', outputSample: 'a93f-b281-c918-23af' },
      ],
    },
  ],
  Finance: [
    {
      sourceField: 'LOC_AMT',
      sourceType: 'DECIMAL(18,2)',
      sourceTable: 'GL_ENTRY',
      sourceSystem: 'Global Subsidiary DB',
      transformationLogic: 'CURR_CONV(LOC_AMT, LOC_CURR, "USD") -> AGGREGATE_SUM()',
      transformationType: 'Lookup & Enrichment',
      targetField: 'Consolidated_USD',
      targetType: 'DECIMAL(18,2)',
      targetTable: 'FIN_CONSOLIDATED',
      targetSystem: 'Consolidation Engine',
      sampleBefore: '1500.00 EUR',
      sampleAfter: '1620.00 USD',
      isValid: true,
      passRatePercent: 99.9,
    },
  ],
  Support: [
    {
      sourceField: 'ticket_text',
      sourceType: 'TEXT',
      sourceTable: 'ZENDESK_TICKETS',
      sourceSystem: 'Zendesk Service API',
      transformationLogic: 'GEMINI_SENTIMENT_ANALYSIS() -> ENUM("Positive", "Neutral", "Negative")',
      transformationType: 'Lookup & Enrichment',
      targetField: 'Sentiment_Score',
      targetType: 'VARCHAR(15)',
      targetTable: 'CUSTOMER_HEALTH',
      targetSystem: 'CRM Profile Studio',
      sampleBefore: 'The migration was very smooth, thanks!',
      sampleAfter: 'Positive',
      isValid: true,
      passRatePercent: 96.5,
    },
  ],
  HR: [
    {
      sourceField: 'worker_id',
      sourceType: 'VARCHAR(12)',
      sourceTable: 'WORKDAY_PEOPLE',
      sourceSystem: 'Workday HCM',
      transformationLogic: 'TRIM() -> PAD(8, "0")',
      transformationType: 'Format Normalization',
      targetField: 'Employee_Number',
      targetType: 'CHAR(8)',
      targetTable: 'AD_USERS',
      targetSystem: 'Azure AD Provisioning',
      sampleBefore: 'W-9902',
      sampleAfter: '00009902',
      isValid: true,
      passRatePercent: 100,
    },
  ],
  Marketing: [
    {
      sourceField: 'campaign_id',
      sourceType: 'BIGINT',
      sourceTable: 'ADS_PERFORMANCE',
      sourceSystem: 'Google Ads API',
      transformationLogic: 'LOOKUP_UTM_PARAM() -> JOIN(CRM_LEADS)',
      transformationType: 'Lookup & Enrichment',
      targetField: 'Attributed_ROI',
      targetType: 'DECIMAL(12,2)',
      targetTable: 'MKT_ANALYTICS',
      targetSystem: 'Snowflake Marketing DWH',
      sampleBefore: '88392104',
      sampleAfter: '4.2x',
      isValid: true,
      passRatePercent: 94.2,
    },
  ],
};

interface D3LineageNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: 'Source' | 'Ingest' | 'Validate' | 'Transform' | 'Target';
  system: string;
  records: number;
  status: 'Completed' | 'Warning' | 'Processing' | 'Passed';
  details: string;
  latencyMs: number;
}

interface D3LineageEdge {
  id: string;
  source: string | D3LineageNode;
  target: string | D3LineageNode;
  type: string;
  latencyMs: number;
  dataVolume: string;
}

const entityGraphs: Record<string, { nodes: D3LineageNode[]; edges: D3LineageEdge[] }> = {
  Customers: {
    nodes: [
      { id: 'sap-ecc', label: 'SAP ECC Customers', type: 'Source', system: 'SAP ERP (KNA1 Table)', records: 14250, status: 'Completed', details: 'Extracted raw table KNA1 Customer Master via CDC.', latencyMs: 14 },
      { id: 'oracle-crm', label: 'Oracle Leads DB', type: 'Source', system: 'Oracle CRM', records: 3200, status: 'Completed', details: 'Ingesting potential prospects and direct leads.', latencyMs: 11 },
      { id: 'kafka-ingest', label: 'Kafka Raw Queue', type: 'Ingest', system: 'EDIMP Kafka Topic', records: 17450, status: 'Completed', details: 'Unified real-time stream buffers before ingestion.', latencyMs: 8 },
      { id: 's3-landing', label: 'S3 Bronze Landing', type: 'Ingest', system: 'AWS S3 Parquet', records: 17450, status: 'Completed', details: 'Parquet partitioning with raw JSON metadata logs.', latencyMs: 6 },
      { id: 'quality-eng', label: 'Data Quality Engine', type: 'Validate', system: 'EDIMP Quality Rules', records: 17422, status: 'Warning', details: 'Flagged 28 structural anomalies (blank postal codes, bad tax IDs).', latencyMs: 22 },
      { id: 'ai-transform', label: 'Gemini Transformer', type: 'Transform', system: 'Gemini AI Mapping', records: 17422, status: 'Processing', details: 'Executing fuzzy company matching, name splitting, and ISO country mapping.', latencyMs: 31 },
      { id: 'dynamics-target', label: 'Dynamics 365 ERP', type: 'Target', system: 'Business Central API', records: 17422, status: 'Completed', details: 'OData REST API Bulk Upserts with idempotency checks.', latencyMs: 45 },
      { id: 'marketing-hub', label: 'Marketing Cloud', type: 'Target', system: 'Salesforce Marketing API', records: 17422, status: 'Completed', details: 'Synchronizing customer contact emails for newsletters.', latencyMs: 19 }
    ],
    edges: [
      { id: 'e1', source: 'sap-ecc', target: 'kafka-ingest', type: 'CDC Stream', latencyMs: 12, dataVolume: '1.2 MB/s' },
      { id: 'e2', source: 'oracle-crm', target: 'kafka-ingest', type: 'Webhook', latencyMs: 15, dataVolume: '320 KB/s' },
      { id: 'e3', source: 'kafka-ingest', target: 's3-landing', type: 'JSON to Parquet', latencyMs: 7, dataVolume: '1.5 MB/s' },
      { id: 'e4', source: 's3-landing', target: 'quality-eng', type: 'Schema Validate', latencyMs: 18, dataVolume: '1.5 MB/s' },
      { id: 'e5', source: 'quality-eng', target: 'ai-transform', type: 'Normalized Feed', latencyMs: 20, dataVolume: '1.4 MB/s' },
      { id: 'e6', source: 'ai-transform', target: 'dynamics-target', type: 'BC Rest API', latencyMs: 35, dataVolume: '1.4 MB/s' },
      { id: 'e7', source: 'ai-transform', target: 'marketing-hub', type: 'AMQP PubSub', latencyMs: 24, dataVolume: '900 KB/s' }
    ]
  },
  Invoices: {
    nodes: [
      { id: 'oracle-ebs', label: 'Oracle EBS Invoices', type: 'Source', system: 'Oracle EBS Financials', records: 85200, status: 'Completed', details: 'SQL Direct Table extract on INVOICE_HEADERS.', latencyMs: 28 },
      { id: 'billing-app', label: 'Billing Server API', type: 'Source', system: 'Custom SaaS Billing', records: 19400, status: 'Completed', details: 'Daily CSV file exports uploaded automatically.', latencyMs: 12 },
      { id: 's3-inv-landing', label: 'S3 Raw Landing', type: 'Ingest', system: 'EDIMP Spark Ingestion', records: 104600, status: 'Completed', details: 'Incoming invoices landing zone.', latencyMs: 7 },
      { id: 'glue-catalog', label: 'AWS Glue Crawler', type: 'Validate', system: 'AWS Glue Catalog', records: 104600, status: 'Completed', details: 'Schema check, partition inference, data type auditing.', latencyMs: 15 },
      { id: 'spark-normalization', label: 'Spark Normalization', type: 'Transform', system: 'EDIMP Spark Core', records: 104592, status: 'Completed', details: 'Mapping diverse billing systems to canonical invoice format.', latencyMs: 29 },
      { id: 'snowflake-target', label: 'Snowflake Core DWH', type: 'Target', system: 'Snowflake FinData', records: 104592, status: 'Completed', details: 'Bulk Snowpipe COPY operations in raw staging schemas.', latencyMs: 38 }
    ],
    edges: [
      { id: 'inv-e1', source: 'oracle-ebs', target: 's3-inv-landing', type: 'DB Sync', latencyMs: 25, dataVolume: '14.5 MB/s' },
      { id: 'inv-e2', source: 'billing-app', target: 's3-inv-landing', type: 'S3 Multi-part Upload', latencyMs: 18, dataVolume: '4.2 MB/s' },
      { id: 'inv-e3', source: 's3-inv-landing', target: 'glue-catalog', type: 'Crawl Schema', latencyMs: 10, dataVolume: '18.7 MB/s' },
      { id: 'inv-e4', source: 'glue-catalog', target: 'spark-normalization', type: 'Parquet Scan', latencyMs: 22, dataVolume: '18.7 MB/s' },
      { id: 'inv-e5', source: 'spark-normalization', target: 'snowflake-target', type: 'Snowpipe Bulk Load', latencyMs: 31, dataVolume: '16.1 MB/s' }
    ]
  },
  Orders: {
    nodes: [
      { id: 'salesforce-crm', label: 'Salesforce Orders', type: 'Source', system: 'Salesforce Commerce API', records: 5410, status: 'Completed', details: 'Polling active cart transactions and order custom objects.', latencyMs: 35 },
      { id: 'shopify-web', label: 'Shopify Webhooks', type: 'Source', system: 'Shopify Checkout Hook', records: 8900, status: 'Completed', details: 'Real-time JSON payload capture on order creation.', latencyMs: 9 },
      { id: 'api-router', label: 'API Gateway Router', type: 'Ingest', system: 'Nginx API Proxy', records: 14310, status: 'Completed', details: 'Ingestion of multi-tenant API transactions securely.', latencyMs: 5 },
      { id: 'schema-auditor', label: 'Payload Schema Auditor', type: 'Validate', system: 'Schema Matcher', records: 14302, status: 'Completed', details: 'Strict JSON-schema structural audit and validation check.', latencyMs: 11 },
      { id: 'json-transform', label: 'JSON Transform Unit', type: 'Transform', system: 'NodeJS Engine', records: 14302, status: 'Completed', details: 'Converting dynamic structures to PostgreSQL schemas.', latencyMs: 18 },
      { id: 'postgres-target', label: 'Production PostgreSQL', type: 'Target', system: 'Aurora PG SQL DB', records: 14302, status: 'Completed', details: 'Bulk upsert operations utilizing unique client keys.', latencyMs: 24 }
    ],
    edges: [
      { id: 'ord-e1', source: 'salesforce-crm', target: 'api-router', type: 'API Poll', latencyMs: 30, dataVolume: '1.1 MB/s' },
      { id: 'ord-e2', source: 'shopify-web', target: 'api-router', type: 'Webhook', latencyMs: 12, dataVolume: '1.8 MB/s' },
      { id: 'ord-e3', source: 'api-router', target: 'schema-auditor', type: 'Buffer Stream', latencyMs: 6, dataVolume: '2.9 MB/s' },
      { id: 'ord-e4', source: 'schema-auditor', target: 'json-transform', type: 'Verified Stream', latencyMs: 10, dataVolume: '2.9 MB/s' },
      { id: 'ord-e5', source: 'json-transform', target: 'postgres-target', type: 'Batch Commit', latencyMs: 22, dataVolume: '2.8 MB/s' }
    ]
  },
  Products: {
    nodes: [
      { id: 'as400-db2', label: 'AS400 Inventory DB', type: 'Source', system: 'IBM AS400 DB2 Ledger', records: 34100, status: 'Completed', details: 'Direct IBM DB2 connector mapping raw items master.', latencyMs: 55 },
      { id: 'plm-lifecycle', label: 'PLM Engineering', type: 'Source', system: 'Product Lifecycle system', records: 15200, status: 'Completed', details: 'REST API lookup for design documents and bill of materials.', latencyMs: 40 },
      { id: 'ftp-poller', label: 'FTP Poller Service', type: 'Ingest', system: 'EDIMP FTP Agent', records: 49300, status: 'Completed', details: 'Buffering XML material updates from staging servers.', latencyMs: 15 },
      { id: 'xml-schema-val', label: 'XML Schema Validator', type: 'Validate', system: 'XSD Validator Core', records: 49280, status: 'Warning', details: 'Flagged 20 records with invalid material units of measure.', latencyMs: 25 },
      { id: 'rfc-mapping', label: 'RFC Mapping BAPI', type: 'Transform', system: 'ABAP Mapping Engine', records: 49280, status: 'Processing', details: 'Aligning product classes to target hierarchy mappings.', latencyMs: 44 },
      { id: 'sap-s4-cloud', label: 'SAP S/4HANA Cloud', type: 'Target', system: 'SAP REST Gateway', records: 49280, status: 'Completed', details: 'Transactional bulk imports of active materials.', latencyMs: 52 }
    ],
    edges: [
      { id: 'prod-e1', source: 'as400-db2', target: 'ftp-poller', type: 'Bulk DB Export', latencyMs: 45, dataVolume: '5.5 MB/s' },
      { id: 'prod-e2', source: 'plm-lifecycle', target: 'ftp-poller', type: 'REST API Fetch', latencyMs: 38, dataVolume: '1.2 MB/s' },
      { id: 'prod-e3', source: 'ftp-poller', target: 'xml-schema-val', type: 'XML Stream', latencyMs: 14, dataVolume: '6.7 MB/s' },
      { id: 'prod-e4', source: 'xml-schema-val', target: 'rfc-mapping', type: 'XSD Validated Feed', latencyMs: 22, dataVolume: '6.7 MB/s' },
      { id: 'prod-e5', source: 'rfc-mapping', target: 'sap-s4-cloud', type: 'RFC BAPI Post', latencyMs: 48, dataVolume: '6.2 MB/s' }
    ]
  },
  SupplyChain: {
    nodes: [
      { id: 'fedex-api', label: 'FedEx Tracking API', type: 'Source', system: 'Cloud Logistics API', records: 12400, status: 'Completed', details: 'Real-time shipment status ingestion.', latencyMs: 32 },
      { id: 'ups-api', label: 'UPS Shipping API', type: 'Source', system: 'Cloud Logistics API', records: 9800, status: 'Completed', details: 'Global logistics tracking data.', latencyMs: 28 },
      { id: 'log-ingest', label: 'Logistics Ingester', type: 'Ingest', system: 'EDIMP API Worker', records: 22200, status: 'Completed', details: 'Unifying multi-carrier tracking streams.', latencyMs: 12 },
      { id: 'addr-validate', label: 'Address Validator', type: 'Validate', system: 'Global Address Service', records: 22195, status: 'Passed', details: 'Geocoding and address normalization.', latencyMs: 45 },
      { id: 'inv-transform', label: 'Inventory Mapper', type: 'Transform', system: 'Mapping Engine', records: 22195, status: 'Completed', details: 'Mapping logistics IDs to internal SKUs.', latencyMs: 22 },
      { id: 'wms-target', label: 'Warehouse Mgmt', type: 'Target', system: 'Oracle WMS Cloud', records: 22195, status: 'Completed', details: 'Updating inventory stock levels.', latencyMs: 38 }
    ],
    edges: [
      { id: 'sc-e1', source: 'fedex-api', target: 'log-ingest', type: 'REST Pull', latencyMs: 20, dataVolume: '2.1 MB/s' },
      { id: 'sc-e2', source: 'ups-api', target: 'log-ingest', type: 'REST Pull', latencyMs: 25, dataVolume: '1.8 MB/s' },
      { id: 'sc-e3', source: 'log-ingest', target: 'addr-validate', type: 'JSON Stream', latencyMs: 8, dataVolume: '3.9 MB/s' },
      { id: 'sc-e4', source: 'addr-validate', target: 'inv-transform', type: 'Verified Feed', latencyMs: 15, dataVolume: '3.9 MB/s' },
      { id: 'sc-e5', source: 'inv-transform', target: 'wms-target', type: 'API Load', latencyMs: 30, dataVolume: '3.5 MB/s' }
    ]
  },
  Finance: {
    nodes: [
      { id: 'sub-db-1', label: 'UK Subsidiary DB', type: 'Source', system: 'PostgreSQL EU', records: 45000, status: 'Completed', details: 'Extracting monthly ledger entries.', latencyMs: 18 },
      { id: 'sub-db-2', label: 'APAC Subsidiary DB', type: 'Source', system: 'Oracle APAC', records: 62000, status: 'Completed', details: 'APAC regional financial data.', latencyMs: 22 },
      { id: 'fin-bridge', label: 'Finance Data Bridge', type: 'Ingest', system: 'EDIMP ETL Bridge', records: 107000, status: 'Completed', details: 'Consolidating regional extracts.', latencyMs: 10 },
      { id: 'audit-rules', label: 'Audit Compliance', type: 'Validate', system: 'FinAudit Validator', records: 106980, status: 'Warning', details: 'Flagged 20 unbalanced entries.', latencyMs: 28 },
      { id: 'curr-engine', label: 'Consolidation Engine', type: 'Transform', system: 'EDIMP Calc Engine', records: 106980, status: 'Processing', details: 'Multi-currency conversion and eliminations.', latencyMs: 42 },
      { id: 'fin-target', label: 'Consolidated Report', type: 'Target', system: 'Hyperion Financials', records: 106980, status: 'Completed', details: 'Final reporting ledger update.', latencyMs: 55 }
    ],
    edges: [
      { id: 'fin-e1', source: 'sub-db-1', target: 'fin-bridge', type: 'JDBC', latencyMs: 15, dataVolume: '12 MB/s' },
      { id: 'fin-e2', source: 'sub-db-2', target: 'fin-bridge', type: 'JDBC', latencyMs: 20, dataVolume: '18 MB/s' },
      { id: 'fin-e3', source: 'fin-bridge', target: 'audit-rules', type: 'Bulk Stream', latencyMs: 12, dataVolume: '30 MB/s' },
      { id: 'fin-e4', source: 'audit-rules', target: 'curr-engine', type: 'Audited Feed', latencyMs: 20, dataVolume: '30 MB/s' },
      { id: 'fin-e5', source: 'curr-engine', target: 'fin-target', type: 'XML Load', latencyMs: 40, dataVolume: '25 MB/s' }
    ]
  },
  Support: {
    nodes: [
      { id: 'zd-api', label: 'Zendesk Tickets', type: 'Source', system: 'Zendesk Support', records: 8500, status: 'Completed', details: 'Fetching new support interactions.', latencyMs: 25 },
      { id: 'slack-hooks', label: 'Slack Support Ch', type: 'Source', system: 'Slack Enterprise', records: 3200, status: 'Completed', details: 'Streaming support channel chats.', latencyMs: 10 },
      { id: 'supp-unified', label: 'Unified Support Stream', type: 'Ingest', system: 'EDIMP Streamer', records: 11700, status: 'Completed', details: 'Merging ticket and chat data.', latencyMs: 8 },
      { id: 'pii-mask', label: 'PII Data Masker', type: 'Validate', system: 'Security Guard', records: 11700, status: 'Passed', details: 'Masking sensitive user info.', latencyMs: 15 },
      { id: 'sentiment-ai', label: 'Sentiment Analysis', type: 'Transform', system: 'Gemini AI NLP', records: 11700, status: 'Processing', details: 'AI-driven sentiment categorization.', latencyMs: 95 },
      { id: 'crm-update', label: 'CRM Health Tracker', type: 'Target', system: 'Salesforce CRM', records: 11700, status: 'Completed', details: 'Updating customer health scores.', latencyMs: 30 }
    ],
    edges: [
      { id: 'sup-e1', source: 'zd-api', target: 'supp-unified', type: 'REST Poll', latencyMs: 20, dataVolume: '450 KB/s' },
      { id: 'sup-e2', source: 'slack-hooks', target: 'supp-unified', type: 'Webhook', latencyMs: 12, dataVolume: '120 KB/s' },
      { id: 'sup-e3', source: 'supp-unified', target: 'pii-mask', type: 'Text Stream', latencyMs: 10, dataVolume: '570 KB/s' },
      { id: 'sup-e4', source: 'pii-mask', target: 'sentiment-ai', type: 'Secure Feed', latencyMs: 18, dataVolume: '570 KB/s' },
      { id: 'sup-e5', source: 'sentiment-ai', target: 'crm-update', type: 'API Patch', latencyMs: 45, dataVolume: '200 KB/s' }
    ]
  },
  HR: {
    nodes: [
      { id: 'wd-hcm', label: 'Workday Employees', type: 'Source', system: 'Workday Global', records: 12500, status: 'Completed', details: 'Daily employee master extract.', latencyMs: 45 },
      { id: 'hr-ingest', label: 'HR Ingestion Hub', type: 'Ingest', system: 'EDIMP HR Sync', records: 12500, status: 'Completed', details: 'Buffering employee updates.', latencyMs: 12 },
      { id: 'hr-rules', label: 'Compliance Rules', type: 'Validate', system: 'HR Policy Engine', records: 12498, status: 'Passed', details: 'Validating role and dept codes.', latencyMs: 20 },
      { id: 'id-mapper', label: 'Identity Mapping', type: 'Transform', system: 'IAM Sync Unit', records: 12498, status: 'Completed', details: 'Generating Azure AD identifiers.', latencyMs: 25 },
      { id: 'ad-target', label: 'Azure AD Provision', type: 'Target', system: 'Azure AD Graph', records: 12498, status: 'Completed', details: 'Provisioning cloud accounts.', latencyMs: 35 },
      { id: 'payroll-target', label: 'Payroll Provider', type: 'Target', system: 'ADP API', records: 12498, status: 'Completed', details: 'Syncing payroll data.', latencyMs: 40 }
    ],
    edges: [
      { id: 'hr-e1', source: 'wd-hcm', target: 'hr-ingest', type: 'REST Export', latencyMs: 35, dataVolume: '4.5 MB/s' },
      { id: 'hr-e2', source: 'hr-ingest', target: 'hr-rules', type: 'Object Stream', latencyMs: 15, dataVolume: '4.5 MB/s' },
      { id: 'hr-e3', source: 'hr-rules', target: 'id-mapper', type: 'Valid HR Feed', latencyMs: 18, dataVolume: '4.5 MB/s' },
      { id: 'hr-e4', source: 'id-mapper', target: 'ad-target', type: 'Graph API', latencyMs: 28, dataVolume: '2.1 MB/s' },
      { id: 'hr-e5', source: 'id-mapper', target: 'payroll-target', type: 'SFTP Push', latencyMs: 32, dataVolume: '2.4 MB/s' }
    ]
  },
  Marketing: {
    nodes: [
      { id: 'google-ads', label: 'Google Ads Data', type: 'Source', system: 'Google Ads API', records: 145000, status: 'Completed', details: 'Campaign performance metrics.', latencyMs: 22 },
      { id: 'meta-ads', label: 'Meta Ads Data', type: 'Source', system: 'Meta Marketing API', records: 92000, status: 'Completed', details: 'Social media ad analytics.', latencyMs: 25 },
      { id: 'mkt-unified', label: 'Ad Performance Hub', type: 'Ingest', system: 'EDIMP Ad Collector', records: 237000, status: 'Completed', details: 'Consolidating multi-channel ads.', latencyMs: 12 },
      { id: 'mkt-auditor', label: 'Attribution Auditor', type: 'Validate', system: 'Mkt Rules Engine', records: 236980, status: 'Warning', details: 'Flagged 20 records with broken UTMs.', latencyMs: 18 },
      { id: 'roi-engine', label: 'ROI Calc Engine', type: 'Transform', system: 'Snowflake Task', records: 236980, status: 'Processing', details: 'Attributing spend to CRM conversions.', latencyMs: 35 },
      { id: 'mkt-dwh', label: 'Marketing Warehouse', type: 'Target', system: 'Snowflake Mkt', records: 236980, status: 'Completed', details: 'Final attribution database.', latencyMs: 40 }
    ],
    edges: [
      { id: 'mkt-e1', source: 'google-ads', target: 'mkt-unified', type: 'API Pull', latencyMs: 18, dataVolume: '85 MB/s' },
      { id: 'mkt-e2', source: 'meta-ads', target: 'mkt-unified', type: 'API Pull', latencyMs: 22, dataVolume: '62 MB/s' },
      { id: 'mkt-e3', source: 'mkt-unified', target: 'mkt-auditor', type: 'Data Stream', latencyMs: 14, dataVolume: '147 MB/s' },
      { id: 'mkt-e4', source: 'mkt-auditor', target: 'roi-engine', type: 'Audited Feed', latencyMs: 20, dataVolume: '147 MB/s' },
      { id: 'mkt-e5', source: 'roi-engine', target: 'mkt-dwh', type: 'Snowpipe Load', latencyMs: 30, dataVolume: '145 MB/s' }
    ]
  }
};

interface InteractiveD3GraphProps {
  selectedEntity: string;
  selectedNodeId: string;
  setSelectedNodeId: (id: string) => void;
  graphData: { nodes: D3LineageNode[]; edges: D3LineageEdge[] };
}

export const InteractiveD3Graph: React.FC<InteractiveD3GraphProps> = ({
  selectedEntity,
  selectedNodeId,
  setSelectedNodeId,
  graphData,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 420 });
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredNodeData, setHoveredNodeData] = useState<D3LineageNode | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    let resizeTimer: NodeJS.Timeout;
    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width } = entries[0].contentRect;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        setDimensions({
          width: Math.max(width, 600),
          height: 420,
        });
      }, 100);
    });
    observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
      clearTimeout(resizeTimer);
    };
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = dimensions.width;
    const height = dimensions.height;

    const nodes: D3LineageNode[] = JSON.parse(JSON.stringify(graphData.nodes));
    const edges: D3LineageEdge[] = JSON.parse(JSON.stringify(graphData.edges));

    const mainGroup = svg.append("g").attr("class", "main-graph-group");

    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3.0])
      .on("zoom", (event) => {
        mainGroup.attr("transform", event.transform);
      });

    svg.call(zoomBehavior);

    const zoomIn = () => {
      svg.transition().duration(300).call(zoomBehavior.scaleBy, 1.3);
    };

    const zoomOut = () => {
      svg.transition().duration(300).call(zoomBehavior.scaleBy, 1 / 1.3);
    };

    const resetZoom = () => {
      svg.transition()
        .duration(750)
        .call(zoomBehavior.transform, d3.zoomIdentity.translate(0, 0).scale(1));
    };

    (window as any).zoomInD3Lineage = zoomIn;
    (window as any).zoomOutD3Lineage = zoomOut;
    (window as any).resetD3LineageZoom = resetZoom;

    const triggerAutoLayout = () => {
      // High-energy burst to reset positioning
      simulation
        .force("charge", d3.forceManyBody<D3LineageNode>().strength(-1200))
        .force("collide", d3.forceCollide<D3LineageNode>().radius(120))
        .alpha(1)
        .restart();
      
      // Gradually settle into stable layout
      setTimeout(() => {
        simulation
          .force("charge", d3.forceManyBody<D3LineageNode>().strength(-250))
          .force("collide", d3.forceCollide<D3LineageNode>().radius(85))
          .alphaTarget(0);
      }, 1500);
    };

    (window as any).triggerAutoLayoutLineage = triggerAutoLayout;

    svg.append("defs").append("marker")
      .attr("id", "d3-arrow")
      .attr("viewBox", "0 0 10 10")
      .attr("refX", 92)
      .attr("refY", 5)
      .attr("markerWidth", 5)
      .attr("markerHeight", 5)
      .attr("orient", "auto-start-reverse")
      .append("path")
      .attr("d", "M 0 0 L 10 5 L 0 10 z")
      .attr("fill", "#6366f1");

    const lanes = ['Source', 'Ingest', 'Validate', 'Transform', 'Target'];
    lanes.forEach((lane, idx) => {
      const xPos = width * (0.12 + idx * 0.195);
      const laneGroup = mainGroup.append("g").attr("class", `lane-guide-${lane}`);
      
      if (idx > 0) {
        laneGroup.append("line")
          .attr("x1", xPos - width * 0.09)
          .attr("y1", 20)
          .attr("x2", xPos - width * 0.09)
          .attr("y2", height - 20)
          .attr("stroke", "#e2e8f0")
          .attr("stroke-width", "1")
          .attr("stroke-dasharray", "4,6");
      }

      laneGroup.append("text")
        .attr("x", xPos)
        .attr("y", 30)
        .attr("fill", "#64748b")
        .attr("font-size", "9px")
        .attr("font-family", "sans-serif")
        .attr("font-weight", "900")
        .attr("letter-spacing", "1.5")
        .attr("text-anchor", "middle")
        .text(lane.toUpperCase() + " STAGE");
    });

    const simulation = d3.forceSimulation<D3LineageNode>(nodes)
      .force("x", d3.forceX<D3LineageNode>()
        .x((d) => {
          switch (d.type) {
            case 'Source': return width * 0.12;
            case 'Ingest': return width * 0.315;
            case 'Validate': return width * 0.51;
            case 'Transform': return width * 0.705;
            case 'Target': return width * 0.90;
            default: return width * 0.5;
          }
        })
        .strength(2.0) // Increased strength for cleaner vertical alignment
      )
      .force("y", d3.forceY<D3LineageNode>().y(height / 2).strength(0.5))
      .force("charge", d3.forceManyBody<D3LineageNode>().strength(-250)) // Stronger repulsion by default
      .force("collide", d3.forceCollide<D3LineageNode>().radius(85)) // Larger collision radius for clarity
      .force("link", d3.forceLink<D3LineageNode, D3LineageEdge>(edges)
        .id((d) => d.id)
        .distance(180)
        .strength(1.0)
      );

    const linkGroup = mainGroup.append("g").attr("class", "edges-group");

    const linkPaths = linkGroup.selectAll(".edge-path")
      .data(edges)
      .enter()
      .append("path")
      .attr("class", "edge-path")
      .attr("fill", "none")
      .attr("stroke", "#334155")
      .attr("stroke-width", 2)
      .attr("marker-end", "url(#d3-arrow)");

    const flowPaths = linkGroup.selectAll(".flow-path")
      .data(edges)
      .enter()
      .append("path")
      .attr("class", "flow-path flow-line")
      .attr("fill", "none")
      .attr("stroke", "#6366f1")
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "6, 20")
      .style("opacity", 0.7);

    const nodeGroup = mainGroup.append("g").attr("class", "nodes-group")
      .selectAll(".node-element")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "node-element")
      .style("cursor", "grab")
      .call(drag(simulation) as any);

    const cardWidth = 165;
    const cardHeight = 85;

    const cards = nodeGroup.append("rect")
      .attr("width", cardWidth)
      .attr("height", cardHeight)
      .attr("rx", 12)
      .attr("ry", 12)
      .attr("x", -cardWidth / 2)
      .attr("y", -cardHeight / 2)
      .attr("fill", "#ffffff")
      .attr("stroke", d => d.id === selectedNodeId ? "#6366f1" : "#e2e8f0")
      .attr("stroke-width", d => d.id === selectedNodeId ? 2.5 : 1.5)
      .style("transition", "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)")
      .style("filter", d => d.id === selectedNodeId ? "drop-shadow(0 4px 6px rgba(99, 102, 241, 0.15))" : "none");

    // Accent Bar
    nodeGroup.append("path")
      .attr("d", `M ${-cardWidth / 2} ${-cardHeight / 2 + 12} L ${-cardWidth / 2} ${-cardHeight / 2 + 4} Q ${-cardWidth / 2} ${-cardHeight / 2} ${-cardWidth / 2 + 4} ${-cardHeight / 2} L ${cardWidth / 2 - 4} ${-cardHeight / 2} Q ${cardWidth / 2} ${-cardHeight / 2} ${cardWidth / 2} ${-cardHeight / 2 + 4} L ${cardWidth / 2} ${-cardHeight / 2 + 12} Z`)
      .attr("fill", d => {
        if (d.type === 'Source') return "#6366f1";
        if (d.type === 'Transform') return "#a855f7";
        if (d.type === 'Validate') return "#f59e0b";
        if (d.type === 'Ingest') return "#06b6d4";
        if (d.type === 'Target') return "#10b981";
        return "#64748b";
      });

    nodeGroup.append("rect")
      .attr("width", 60)
      .attr("height", 14)
      .attr("rx", 4)
      .attr("x", -cardWidth / 2 + 10)
      .attr("y", -cardHeight / 2 + 16)
      .attr("fill", d => {
        if (d.type === 'Source') return "#eef2ff";
        if (d.type === 'Transform') return "#f5f3ff";
        if (d.type === 'Validate') return "#fffbeb";
        if (d.type === 'Ingest') return "#ecfeff";
        if (d.type === 'Target') return "#ecfdf5";
        return "#f8fafc";
      });

    nodeGroup.append("text")
      .attr("x", -cardWidth / 2 + 40)
      .attr("y", -cardHeight / 2 + 26)
      .attr("fill", d => {
        if (d.type === 'Source') return "#4f46e5";
        if (d.type === 'Transform') return "#7c3aed";
        if (d.type === 'Validate') return "#b45309";
        if (d.type === 'Ingest') return "#0e7490";
        if (d.type === 'Target') return "#059669";
        return "#475569";
      })
      .attr("font-size", "7.5px")
      .attr("font-family", "monospace")
      .attr("font-weight", "900")
      .attr("text-anchor", "middle")
      .text(d => d.type.toUpperCase());

    nodeGroup.append("circle")
      .attr("cx", cardWidth / 2 - 14)
      .attr("cy", -cardHeight / 2 + 22)
      .attr("r", 4.5)
      .attr("fill", d => {
        if (d.status === 'Completed' || d.status === 'Passed') return '#10b981';
        if (d.status === 'Warning') return '#f59e0b';
        if (d.status === 'Processing') return '#6366f1';
        return '#ef4444';
      });

    nodeGroup.append("text")
      .attr("x", -cardWidth / 2 + 12)
      .attr("y", -cardHeight / 2 + 46)
      .attr("fill", "#0f172a")
      .attr("font-size", "10.5px")
      .attr("font-family", "sans-serif")
      .attr("font-weight", "bold")
      .text(d => {
        return d.label.length > 22 ? d.label.substring(0, 20) + "..." : d.label;
      });

    nodeGroup.append("text")
      .attr("x", -cardWidth / 2 + 12)
      .attr("y", -cardHeight / 2 + 60)
      .attr("fill", "#64748b")
      .attr("font-size", "8.5px")
      .attr("font-family", "monospace")
      .text(d => {
        return d.system.length > 28 ? d.system.substring(0, 26) + "..." : d.system;
      });

    nodeGroup.append("line")
      .attr("x1", -cardWidth / 2 + 10)
      .attr("y1", -cardHeight / 2 + 62)
      .attr("x2", cardWidth / 2 - 10)
      .attr("y2", -cardHeight / 2 + 62)
      .attr("stroke", "#f1f5f9")
      .attr("stroke-width", 0.8);

    nodeGroup.append("text")
      .attr("x", -cardWidth / 2 + 12)
      .attr("y", -cardHeight / 2 + 74)
      .attr("fill", "#475569")
      .attr("font-size", "8.5px")
      .attr("font-family", "monospace")
      .attr("font-weight", "bold")
      .text(d => `${d.records.toLocaleString()} recs`);

    nodeGroup.append("text")
      .attr("x", cardWidth / 2 - 12)
      .attr("y", -cardHeight / 2 + 74)
      .attr("fill", "#6366f1")
      .attr("font-size", "8.5px")
      .attr("font-family", "monospace")
      .attr("text-anchor", "end")
      .text(d => `${d.latencyMs}ms`);

    simulation.on("tick", () => {
      linkPaths.attr("d", getPath);
      flowPaths.attr("d", getPath);
      nodeGroup.attr("transform", d => `translate(${d.x}, ${d.y})`);
    });

    function getPath(d: any) {
      const sourceX = d.source.x;
      const sourceY = d.source.y;
      const targetX = d.target.x;
      const targetY = d.target.y;
      
      const dx = targetX - sourceX;
      const cx1 = sourceX + dx * 0.45;
      const cy1 = sourceY;
      const cx2 = sourceX + dx * 0.55;
      const cy2 = targetY;
      
      return `M ${sourceX} ${sourceY} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${targetX} ${targetY}`;
    }

    const getFullDependencyChain = (startId: string) => {
      const upstreamNodes = new Set<string>();
      const downstreamNodes = new Set<string>();
      const upstreamEdges = new Set<string>();
      const downstreamEdges = new Set<string>();

      const getId = (nodeOrStr: any) => {
        if (!nodeOrStr) return '';
        return typeof nodeOrStr === 'object' ? nodeOrStr.id : nodeOrStr;
      };

      // Traverse Upstream (Backwards)
      const upstreamQueue = [startId];
      const visitedUpstream = new Set<string>([startId]);
      while (upstreamQueue.length > 0) {
        const current = upstreamQueue.shift()!;
        edges.forEach(e => {
          const sId = getId(e.source);
          const tId = getId(e.target);
          if (tId === current && !visitedUpstream.has(sId)) {
            visitedUpstream.add(sId);
            upstreamNodes.add(sId);
            upstreamEdges.add(e.id);
            upstreamQueue.push(sId);
          }
        });
      }

      // Traverse Downstream (Forwards)
      const downstreamQueue = [startId];
      const visitedDownstream = new Set<string>([startId]);
      while (downstreamQueue.length > 0) {
        const current = downstreamQueue.shift()!;
        edges.forEach(e => {
          const sId = getId(e.source);
          const tId = getId(e.target);
          if (sId === current && !visitedDownstream.has(tId)) {
            visitedDownstream.add(tId);
            downstreamNodes.add(tId);
            downstreamEdges.add(e.id);
            downstreamQueue.push(tId);
          }
        });
      }

      return {
        focusId: startId,
        upstreamNodes,
        downstreamNodes,
        upstreamEdges,
        downstreamEdges,
        allNodes: new Set<string>([startId, ...upstreamNodes, ...downstreamNodes]),
        allEdges: new Set<string>([...upstreamEdges, ...downstreamEdges])
      };
    };

    const updateHighlights = (activeNodeId: string | null, hoveredId: string | null) => {
      const focusId = hoveredId || activeNodeId;

      if (focusId) {
        const chain = getFullDependencyChain(focusId);

        cards.attr("stroke", d => {
          if (d.id === focusId) return "#6366f1"; // Focus
          if (chain.upstreamNodes.has(d.id)) return "#3b82f6"; // Upstream
          if (chain.downstreamNodes.has(d.id)) return "#10b981"; // Downstream
          if (d.status === 'Warning') return "#f59e0b";
          return "#e2e8f0";
        })
        .attr("stroke-width", d => {
          if (d.id === focusId) return 3.0;
          if (chain.upstreamNodes.has(d.id) || chain.downstreamNodes.has(d.id)) return 2.0;
          return 1.2;
        })
        .attr("fill", d => {
          if (d.id === focusId) return "#f8f9ff"; // subtle focus
          if (chain.upstreamNodes.has(d.id)) return "#eff6ff"; // light blue upstream
          if (chain.downstreamNodes.has(d.id)) return "#ecfdf5"; // light green downstream
          return "#ffffff";
        });

        nodeGroup.style("opacity", d => chain.allNodes.has(d.id) ? 1.0 : 0.3);

        linkPaths.attr("stroke", e => {
          if (chain.upstreamEdges.has(e.id)) return "#3b82f6";
          if (chain.downstreamEdges.has(e.id)) return "#10b981";
          return "#f1f5f9";
        })
        .attr("stroke-width", e => {
          if (chain.allEdges.has(e.id)) return 2.8;
          return 0.8;
        });

        flowPaths.style("opacity", e => {
          if (chain.allEdges.has(e.id)) return 1.0;
          return 0.05;
        })
        .attr("stroke", e => {
          if (chain.upstreamEdges.has(e.id)) return "#60a5fa";
          if (chain.downstreamEdges.has(e.id)) return "#34d399";
          return "#6366f1";
        });
      } else {
        cards.attr("stroke", d => {
          if (d.status === 'Warning') return "#f59e0b";
          return "#e2e8f0";
        })
        .attr("stroke-width", 1.5)
        .attr("fill", "#ffffff");

        nodeGroup.style("opacity", 1.0);
        linkPaths.attr("stroke", "#f1f5f9").attr("stroke-width", 2);
        flowPaths.style("opacity", 0.7).attr("stroke", "#cbd5e1");
      }
    };

    nodeGroup.on("mousedown", function() {
      d3.select(this).style("cursor", "grabbing");
    })
    .on("mouseup", function() {
      d3.select(this).style("cursor", "grab");
    })
    .on("click", (event, d) => {
      setSelectedNodeId(d.id);
      updateHighlights(d.id, hoveredNodeId);
    })
    .on("mouseenter", (event, d) => {
      setHoveredNodeId(d.id);
      setHoveredNodeData(d);
      updateHighlights(selectedNodeId, d.id);
    })
    .on("mouseleave", () => {
      setHoveredNodeId(null);
      setHoveredNodeData(null);
      updateHighlights(selectedNodeId, null);
    });

    updateHighlights(selectedNodeId, null);

    return () => {
      simulation.stop();
    };
  }, [graphData, dimensions, selectedNodeId, setSelectedNodeId]);

  function drag(simulation: d3.Simulation<D3LineageNode, undefined>) {
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }
    
    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
    
    return d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  }

  return (
    <div className="relative w-full border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 p-2" ref={containerRef}>
      <style>{`
        @keyframes d3flow {
          to {
            stroke-dashoffset: -26;
          }
        }
        .flow-line {
          animation: d3flow 1.2s linear infinite;
        }
      `}</style>

      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => {
            if ((window as any).zoomInD3Lineage) {
              (window as any).zoomInD3Lineage();
            }
          }}
          title="Zoom In"
          className="p-1.5 bg-white/90 hover:bg-slate-100/90 text-slate-700 rounded-lg cursor-pointer transition-colors border border-slate-200 shadow-sm flex items-center justify-center"
        >
          <ZoomIn className="w-3.5 h-3.5 text-indigo-600" />
        </button>
        <button
          onClick={() => {
            if ((window as any).zoomOutD3Lineage) {
              (window as any).zoomOutD3Lineage();
            }
          }}
          title="Zoom Out"
          className="p-1.5 bg-white/90 hover:bg-slate-100/90 text-slate-700 rounded-lg cursor-pointer transition-colors border border-slate-200 shadow-sm flex items-center justify-center"
        >
          <ZoomOut className="w-3.5 h-3.5 text-indigo-600" />
        </button>
        <button
          onClick={() => {
            if ((window as any).resetD3LineageZoom) {
              (window as any).resetD3LineageZoom();
            }
          }}
          className="px-2.5 py-1.5 bg-white/90 hover:bg-slate-100/90 text-slate-700 rounded-lg text-[10px] font-bold cursor-pointer transition-colors border border-slate-200 shadow-sm flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3 text-indigo-600" />
          Reset Zoom & Pan
        </button>
        <button
          onClick={() => {
            if ((window as any).triggerAutoLayoutLineage) {
              (window as any).triggerAutoLayoutLineage();
            }
          }}
          className="px-2.5 py-1.5 bg-white/90 hover:bg-slate-100/90 text-slate-700 rounded-lg text-[10px] font-bold cursor-pointer transition-colors border border-slate-200 shadow-sm flex items-center gap-1"
          title="Auto-arrange graph nodes"
        >
          <Sparkles className="w-3 h-3 text-indigo-600" />
          Auto-layout
        </button>
      </div>

      {hoveredNodeId && hoveredNodeData && (
        <div className="absolute bottom-4 left-4 z-10 p-3 bg-white/95 border border-indigo-200 rounded-xl shadow-xl max-w-xs text-[11px] text-slate-600 animate-fade-in space-y-1.5 font-sans pointer-events-none">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-slate-900 text-xs">{hoveredNodeData.label}</span>
            <span className={`w-2 h-2 rounded-full ${
              hoveredNodeData.status === 'Completed' || hoveredNodeData.status === 'Passed'
                ? 'bg-emerald-500'
                : hoveredNodeData.status === 'Warning'
                ? 'bg-amber-500'
                : 'bg-indigo-500'
            }`} />
          </div>
          <p className="text-slate-500 text-[10px] leading-snug">{hoveredNodeData.details}</p>
          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[9px] font-mono text-slate-500">
            <span>Latency: <strong className="text-indigo-600">{hoveredNodeData.latencyMs}ms</strong></span>
            <span>Type: <strong className="text-slate-800">{hoveredNodeData.type}</strong></span>
          </div>
        </div>
      )}

      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full block bg-slate-50 rounded-xl select-none"
      />

      <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5 items-end font-sans">
        <div className="flex items-center gap-3 text-[9px] sm:text-[10px] text-slate-500 bg-white/90 px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Success</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Warning</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span>Processing</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-[9px] text-slate-500 bg-white/95 px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-sm bg-indigo-500" />
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-sm bg-blue-500" />
            <span>Upstream</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-sm bg-emerald-500" />
            <span>Downstream</span>
          </div>
        </div>

        <div className="text-[8.5px] text-indigo-600 bg-indigo-50/50 px-2 py-0.5 rounded border border-indigo-200 font-mono">
          💡 Click node to lock dependency path trace
        </div>
      </div>
    </div>
  );
};

const buildLineageSvg = (
  entityName: string,
  nodeList: LineageNode[],
  fieldList: FieldLineageMap[]
): string => {
  const width = 1200;
  const height = 580;

  const nodeSvgBlocks = nodeList
    .map((node, i) => {
      const x = 40 + i * 225;
      const y = 140;
      const w = 195;
      const h = 180;
      const statusColor =
        node.status === 'Completed'
          ? '#10b981'
          : node.status === 'Warning'
          ? '#f59e0b'
          : '#6366f1';

      const arrowSvg =
        i < nodeList.length - 1
          ? `<g transform="translate(${x + w + 5}, ${y + h / 2 - 12})">
              <line x1="0" y1="12" x2="20" y2="12" stroke="#cbd5e1" stroke-width="3" marker-end="url(#arrow)" />
             </g>`
          : '';

      return `
        <!-- Node ${i + 1} -->
        <g transform="translate(${x}, ${y})">
          <rect width="${w}" height="${h}" rx="14" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" />
          
          <!-- Header badge -->
          <rect x="12" y="14" width="70" height="20" rx="6" fill="#eef2ff" />
          <text x="47" y="28" fill="#4f46e5" font-size="10" font-family="sans-serif" font-weight="bold" text-anchor="middle">${node.type}</text>

          <!-- Status indicator -->
          <circle cx="${w - 22}" cy="24" r="5" fill="${statusColor}" />

          <!-- Title -->
          <text x="12" y="58" fill="#0f172a" font-size="11" font-family="sans-serif" font-weight="bold">${node.stageName}</text>
          <text x="12" y="74" fill="#64748b" font-size="9" font-family="sans-serif">${node.systemName}</text>

          <!-- Details -->
          <rect x="10" y="86" width="${w - 20}" height="48" rx="8" fill="#f8fafc" />
          <text x="16" y="104" fill="#475569" font-size="9" font-family="sans-serif">${node.details.substring(0, 30)}...</text>
          <text x="16" y="120" fill="#6366f1" font-size="9" font-family="monospace">Latency: ${node.latencyMs}ms</text>

          <!-- Footer -->
          <line x1="12" y1="148" x2="${w - 12}" y2="148" stroke="#f1f5f9" stroke-width="1" />
          <text x="12" y="166" fill="#0f172a" font-size="10" font-family="monospace" font-weight="bold">${node.recordsCount.toLocaleString()} recs</text>
        </g>
        ${arrowSvg}
      `;
    })
    .join('\n');

  const topFields = fieldList.slice(0, 4);
  const fieldSvgRows = topFields
    .map((f, idx) => {
      const fy = 410 + idx * 30;
      return `
        <g transform="translate(40, ${fy})">
          <rect width="1120" height="24" rx="6" fill="${
            idx % 2 === 0 ? '#f8fafc' : '#ffffff'
          }" stroke="#e2e8f0" stroke-width="1" />
          <text x="16" y="16" fill="#4f46e5" font-size="10" font-family="monospace" font-weight="bold">${f.sourceField} (${f.sourceType})</text>
          <text x="280" y="16" fill="#0ea5e9" font-size="10" font-family="monospace">${f.transformationLogic}</text>
          <text x="750" y="16" fill="#059669" font-size="10" font-family="monospace" font-weight="bold">${f.targetField} (${f.targetType})</text>
          <text x="1040" y="16" fill="${
            f.isValid ? '#059669' : '#d97706'
          }" font-size="10" font-family="sans-serif" font-weight="bold">${
        f.isValid ? 'VALID' : 'REVIEW'
      }</text>
        </g>
      `;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#cbd5e1" />
    </marker>
  </defs>

  <!-- Background -->
  <rect width="${width}" height="${height}" rx="16" fill="#f8fafc" stroke="#e2e8f0" stroke-width="2" />

  <!-- Diagram Title Header -->
  <g transform="translate(40, 40)">
    <rect x="0" y="0" width="1120" height="65" rx="12" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5" />
    <text x="20" y="26" fill="#6366f1" font-size="10" font-family="sans-serif" font-weight="bold" letter-spacing="1">ENTERPRISE ARCHITECTURE DATA LINEAGE DIAGRAM</text>
    <text x="20" y="48" fill="#0f172a" font-size="15" font-family="sans-serif" font-weight="bold">Pipeline: ${entityName} Transformation &amp; Provenance Graph</text>
    <text x="1080" y="38" fill="#64748b" font-size="10" font-family="monospace" text-anchor="end">Generated: ${new Date().toISOString().split('T')[0]}</text>
  </g>

  <!-- Pipeline Flow Nodes -->
  ${nodeSvgBlocks}

  <!-- Field Mapping Section Header -->
  <g transform="translate(40, 380)">
    <text x="0" y="0" fill="#475569" font-size="11" font-family="sans-serif" font-weight="bold">FIELD-LEVEL TRANSFORMATION PROVENANCE SUMMARY</text>
  </g>

  <!-- Field Mapping Rows -->
  ${fieldSvgRows}

  <!-- Footer Watermark Stamp -->
  <g transform="translate(40, 550)">
    <text x="0" y="0" fill="#94a3b8" font-size="10" font-family="sans-serif">EDIMP Enterprise Architecture Provenance Artifact | TOGAF &amp; DAMA DMBOK Compliant</text>
    <text x="1120" y="0" fill="#6366f1" font-size="10" font-family="monospace" text-anchor="end">Total Pipeline Latency: 119ms</text>
  </g>
</svg>`;
};

export const DataLineageView: React.FC = () => {
  const [selectedEntity, setSelectedEntity] = useState<string>('Customers');
  const [selectedNodeId, setSelectedNodeId] = useState<string>('ai-transform');
  const [lineageViewMode, setLineageViewMode] = useState<'graph' | 'grid'>('graph');
  const [selectedField, setSelectedField] = useState<string | null>('Customer_No');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [exportToastMsg, setExportToastMsg] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [showFieldTraceModal, setShowFieldTraceModal] = useState<boolean>(false);
  const [isExportingPng, setIsExportingPng] = useState<boolean>(false);
  const [copiedSvg, setCopiedSvg] = useState<boolean>(false);
  const [copiedSnippet, setCopiedSnippet] = useState<boolean>(false);
  const [activeCodeTab, setActiveCodeTab] = useState<'sql' | 'pyspark' | 'dbt'>('sql');
  const [modalViewTab, setModalViewTab] = useState<'graph' | 'linear'>('graph');

  // Real-time Simulation State
  const [realtimeGraphData, setRealtimeGraphData] = useState<Record<string, { nodes: D3LineageNode[]; edges: D3LineageEdge[] }>>(entityGraphs);
  const [realtimeFieldMaps, setRealtimeFieldMaps] = useState<Record<string, FieldLineageMap[]>>(entityFieldLineageMaps);

  useEffect(() => {
    // Simulate real-time record count updates and small status shifts
    const interval = setInterval(() => {
      // Update Graph Data
      setRealtimeGraphData(prev => {
        const newData = { ...prev };
        const entities = Object.keys(newData);
        const randomEntity = entities[Math.floor(Math.random() * entities.length)];
        
        newData[randomEntity] = {
          ...newData[randomEntity],
          nodes: newData[randomEntity].nodes.map(node => ({
            ...node,
            records: node.records + (Math.random() > 0.8 ? Math.floor(Math.random() * 8) : 0),
            status: node.status === 'Processing' && Math.random() > 0.95 ? 'Completed' : node.status
          }))
        };
        
        return newData;
      });

      // Update Field Maps (Samples)
      setRealtimeFieldMaps(prev => {
        const newData = { ...prev };
        const entities = Object.keys(newData);
        const randomEntity = entities[Math.floor(Math.random() * entities.length)];
        const fields = newData[randomEntity];
        const randomFieldIndex = Math.floor(Math.random() * fields.length);
        
        if (fields[randomFieldIndex].sourceField.toLowerCase().includes('id') || fields[randomFieldIndex].sourceField.toLowerCase().includes('no')) {
          const newId = Math.floor(Math.random() * 900000) + 100000;
          fields[randomFieldIndex] = {
            ...fields[randomFieldIndex],
            sampleBefore: newId.toString(),
            sampleAfter: fields[randomFieldIndex].targetType === 'UUID' ? crypto.randomUUID().split('-')[0] : newId.toString()
          };
        }
        
        return newData;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const activeGraph = useMemo(() => {
    return realtimeGraphData[selectedEntity] || realtimeGraphData.Customers;
  }, [selectedEntity, realtimeGraphData]);

  // Dynamic field mappings based on selected entity
  const fieldLineageList: FieldLineageMap[] = useMemo(() => {
    return realtimeFieldMaps[selectedEntity] || realtimeFieldMaps.Customers;
  }, [selectedEntity, realtimeFieldMaps]);

  // Active selected field
  const activeFieldDetail = useMemo(() => {
    const found = fieldLineageList.find((f) => f.targetField === selectedField);
    return found || fieldLineageList[0];
  }, [fieldLineageList, selectedField]);

  // Filtered field list
  const filteredFields = useMemo(() => {
    return fieldLineageList.filter((f) => {
      const matchesSearch =
        f.sourceField.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.targetField.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.transformationLogic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.sourceTable && f.sourceTable.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (f.targetTable && f.targetTable.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType = typeFilter === 'All' || f.transformationType === typeFilter;
      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Valid' && f.isValid) ||
        (statusFilter === 'Issues' && !f.isValid);

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [fieldLineageList, searchQuery, typeFilter, statusFilter]);

  const selectedNode = useMemo(() => {
    const graphNode = activeGraph.nodes.find((n) => n.id === selectedNodeId);
    if (graphNode) {
      return {
        id: graphNode.id,
        stageName: graphNode.label,
        type: graphNode.type,
        systemName: graphNode.system,
        recordsCount: graphNode.records,
        status: graphNode.status,
        details: graphNode.details,
        latencyMs: graphNode.latencyMs,
      };
    }
    const staticNode = activeGraph.nodes[0];
    return staticNode ? {
      id: staticNode.id,
      stageName: staticNode.label,
      type: staticNode.type,
      systemName: staticNode.system,
      recordsCount: staticNode.records,
      status: staticNode.status,
      details: staticNode.details,
      latencyMs: staticNode.latencyMs,
    } : null;
  }, [selectedNodeId, activeGraph]);

  // Live sandbox state
  const [sandboxInput, setSandboxInput] = useState<string>(activeFieldDetail.sampleBefore);
  const [sandboxResult, setSandboxResult] = useState<string>(activeFieldDetail.sampleAfter);

  // Sync sandbox input whenever active field changes
  useEffect(() => {
    if (activeFieldDetail) {
      setSandboxInput(activeFieldDetail.sampleBefore);
      setSandboxResult(activeFieldDetail.sampleAfter);
    }
  }, [activeFieldDetail]);

  // Dynamic sandbox execution test
  const handleRunSandbox = (val: string) => {
    setSandboxInput(val);
    if (!val || val.trim() === '') {
      setSandboxResult('');
      return;
    }
    const trimVal = val.trim();
    if (activeFieldDetail.targetField === 'Customer_No' || activeFieldDetail.sourceField === 'KUNNR') {
      const stripped = trimVal.replace(/^0+/, '');
      setSandboxResult(`CUST-${stripped}`);
    } else if (activeFieldDetail.targetField === 'Full_Name' || activeFieldDetail.sourceField === 'NAME1') {
      const proper = trimVal.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
      setSandboxResult(proper);
    } else if (activeFieldDetail.targetField === 'Tax_Registration_Number' || activeFieldDetail.sourceField === 'STCEG') {
      const cleaned = trimVal.replace(/[^A-Za-z0-9]/g, '');
      setSandboxResult(cleaned);
    } else if (activeFieldDetail.targetField === 'Country_Region_Code' || activeFieldDetail.sourceField === 'LAND1') {
      const map: Record<string, string> = { DEU: 'DE', USA: 'US', FRA: 'FR', GBR: 'GB', CAN: 'CA', JPN: 'JP' };
      setSandboxResult(map[trimVal.toUpperCase()] || trimVal.substring(0, 2).toUpperCase());
    } else if (activeFieldDetail.targetField === 'Contact_Email') {
      setSandboxResult(trimVal.toLowerCase());
    } else if (activeFieldDetail.targetField === 'total_cents') {
      const num = parseFloat(trimVal);
      setSandboxResult(isNaN(num) ? 'INVALID_NUMBER' : Math.round(num * 100).toString());
    } else if (activeFieldDetail.targetField === 'MATNR') {
      const stripped = trimVal.replace(/^0+/, '');
      setSandboxResult(stripped.padStart(18, '0'));
    } else if (activeFieldDetail.targetField === 'MAKTX') {
      setSandboxResult(trimVal.substring(0, 40));
    } else {
      setSandboxResult(trimVal.toUpperCase());
    }
  };

  // Auto-synchronize selection to the active graph's transformer node when selectedEntity changes
  useEffect(() => {
    const activeGraph = entityGraphs[selectedEntity];
    if (activeGraph && activeGraph.nodes.length > 0) {
      const transformNode = activeGraph.nodes.find((n) => n.type === 'Transform');
      setSelectedNodeId(transformNode ? transformNode.id : activeGraph.nodes[0].id);
    }
    // Select first field of new entity
    if (fieldLineageList.length > 0) {
      setSelectedField(fieldLineageList[0].targetField);
    }
  }, [selectedEntity]);

  // Derived nodes for static consumption (exports, grid)
  const nodes: LineageNode[] = useMemo(() => {
    return activeGraph.nodes.map((n, i) => ({
      id: n.id,
      stageName: `${i + 1}. ${n.label}`,
      type: n.type,
      systemName: n.system,
      recordsCount: n.records,
      status: n.status,
      details: n.details,
      latencyMs: n.latencyMs,
    }));
  }, [activeGraph]);

  const handleExportSvg = () => {
    const svgString = buildLineageSvg(selectedEntity, nodes, fieldLineageList);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `data_lineage_${selectedEntity.toLowerCase()}_graph.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportToastMsg(`Downloaded SVG: data_lineage_${selectedEntity.toLowerCase()}_graph.svg`);
    setTimeout(() => setExportToastMsg(null), 4500);
  };

  const handleExportPng = () => {
    setIsExportingPng(true);
    const svgString = buildLineageSvg(selectedEntity, nodes, fieldLineageList);
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 2400; // 2x high resolution
      canvas.height = 1160;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const pngDataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = pngDataUrl;
        link.download = `data_lineage_${selectedEntity.toLowerCase()}_graph.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(url);
      setIsExportingPng(false);
      setExportToastMsg(`Downloaded High-Res PNG: data_lineage_${selectedEntity.toLowerCase()}_graph.png`);
      setTimeout(() => setExportToastMsg(null), 4500);
    };

    img.onerror = () => {
      setIsExportingPng(false);
      setExportToastMsg('Downloaded graph image artifact.');
      setTimeout(() => setExportToastMsg(null), 3000);
    };

    img.src = url;
  };

  const handleCopySvgMarkup = () => {
    const svgString = buildLineageSvg(selectedEntity, nodes, fieldLineageList);
    navigator.clipboard.writeText(svgString);
    setCopiedSvg(true);
    setTimeout(() => setCopiedSvg(false), 2500);
  };

  const handleCopyCodeSnippet = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2500);
  };

  const handleExportLineage = () => {
    setShowPreviewModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full border border-indigo-100">
              Module 12 – End-to-End Data Lineage &amp; Field Traceability
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <GitCommit className="w-5 h-5 text-indigo-600" />
            Interactive Pipeline Data Lineage Studio
            <span className="ml-2 px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-black rounded-full border border-emerald-100 flex items-center gap-1 uppercase tracking-tighter">
              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
              Live Streaming
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Visualize origin-to-destination data provenance, drill down into field-level ETL transformations, cleansing logic, and schema mappings.
          </p>
        </div>

        {/* Entity Selector Filter */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-slate-600">Select Entity Pipeline:</label>
          <select
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="Customers">Customer Master (SAP ECC → Dynamics 365)</option>
            <option value="Invoices">General Ledger Invoices (Oracle → Snowflake)</option>
            <option value="Orders">Sales Orders (Salesforce → PostgreSQL)</option>
            <option value="Products">Material Master (AS400 → SAP S/4HANA)</option>
            <option value="SupplyChain">Supply Chain (Logistics → Oracle WMS)</option>
            <option value="Finance">Financial Consolidation (Global → Hyperion)</option>
            <option value="Support">Support Sentiment (Zendesk → CRM Update)</option>
            <option value="HR">Employee Onboarding (Workday → Azure AD)</option>
            <option value="Marketing">Marketing ROI (Ads → Snowflake DWH)</option>
          </select>
        </div>
      </div>

      {/* Visual End-to-End Pipeline Flow Diagram */}
      <div className="bg-white text-slate-900 rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold tracking-tight text-slate-900">
              End-to-End Transformation Pipeline Flow ({selectedEntity})
            </h2>
            <span className="text-xs text-slate-400 font-mono hidden md:inline ml-2">
              (119 ms total latency)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Dynamic View Mode Toggle */}
            <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-200 mr-2">
              <button
                type="button"
                onClick={() => setLineageViewMode('graph')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                  lineageViewMode === 'graph'
                    ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Interactive Graph</span>
              </button>
              <button
                type="button"
                onClick={() => setLineageViewMode('grid')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                  lineageViewMode === 'grid'
                    ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Pipeline Grid</span>
              </button>
            </div>

            <button
              onClick={handleExportLineage}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-600/20"
              title="Export enterprise lineage graph"
            >
              <Download className="w-4 h-4" />
              <span>Export Lineage</span>
            </button>
          </div>
        </div>

        {/* Dynamic Topology Flow Graph */}
        {lineageViewMode === 'graph' ? (
          <InteractiveD3Graph
            selectedEntity={selectedEntity}
            selectedNodeId={selectedNodeId}
            setSelectedNodeId={setSelectedNodeId}
            graphData={activeGraph}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative pt-2">
            {nodes.map((node, index) => {
              const isSelected = node.id === selectedNodeId;
              return (
                <div key={node.id} className="relative flex flex-col justify-between">
                  <button
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer space-y-2.5 relative ${
                      isSelected
                        ? 'bg-indigo-50/50 border-indigo-400 shadow-sm ring-2 ring-indigo-500/10'
                        : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50/50 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">
                        {node.type}
                      </span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          node.status === 'Completed'
                            ? 'bg-emerald-500'
                            : node.status === 'Warning'
                            ? 'bg-amber-500'
                            : 'bg-indigo-500 animate-pulse'
                        }`}
                      />
                    </div>

                    <div>
                      <h3 className="text-xs font-bold text-slate-900 leading-tight">{node.stageName}</h3>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">{node.systemName}</p>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-100">
                      <span className="font-bold">{node.recordsCount.toLocaleString()} recs</span>
                      <span className="text-indigo-600 font-bold">{node.latencyMs}ms</span>
                    </div>
                  </button>

                  {/* Connector Arrow between nodes */}
                  {index < nodes.length - 1 && (
                    <div className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 text-slate-300 pointer-events-none">
                      <ChevronRight className="w-5 h-5 text-indigo-400" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Node Inspector Drawer */}
        <div className="p-5 bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Info className="w-24 h-24 text-indigo-600" />
          </div>
          
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl border ${
                  selectedNode.status === 'Completed' || selectedNode.status === 'Passed' 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                    : selectedNode.status === 'Warning'
                    ? 'bg-amber-50 border-amber-200 text-amber-600'
                    : 'bg-indigo-50 border-indigo-200 text-indigo-600'
                }`}>
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 leading-none">{selectedNode.stageName}</h3>
                  <p className="text-[10px] text-slate-500 mt-1 font-mono uppercase tracking-wider">{selectedNode.systemName}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-bold">
                <div className="flex flex-col items-end">
                  <span className="text-slate-400 uppercase text-[8px]">Throughput</span>
                  <span className="text-slate-900">{selectedNode.recordsCount.toLocaleString()} recs/batch</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-slate-400 uppercase text-[8px]">Latency</span>
                  <span className="text-indigo-600">{selectedNode.latencyMs}ms</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Functional Description</span>
                <p className="text-slate-600 leading-relaxed font-medium text-[11px] bg-white/50 p-3 rounded-xl border border-slate-100 italic">
                  "{selectedNode.details}"
                </p>
              </div>
              <div className="space-y-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Infrastructure Health</span>
                <div className="flex items-center gap-3 p-3 bg-white/50 rounded-xl border border-slate-100">
                  <div className="flex-1 space-y-1.5">
                    <div className="flex justify-between text-[9px] font-bold">
                      <span className="text-slate-500">Node Uptime</span>
                      <span className="text-emerald-600">99.98%</span>
                    </div>
                    <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full w-[99.98%]" />
                    </div>
                  </div>
                  <div className="w-px h-8 bg-slate-200" />
                  <div className="flex-1 space-y-1.5">
                    <div className="flex justify-between text-[9px] font-bold">
                      <span className="text-slate-500">Error Rate</span>
                      <span className="text-amber-600">0.02%</span>
                    </div>
                    <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full w-[2%]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Field-Level Lineage Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Field Transformation List (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-indigo-600" />
                Field Mapping &amp; Transformation Provenance Matrix
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Select any field mapping to drill down into transformation rules, live test simulator, and ETL code.
              </p>
            </div>

            <button
              onClick={() => setShowFieldTraceModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Full Field Lineage Trace</span>
            </button>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[160px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search field, table or logic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-1">
              <Filter className="w-3 h-3 text-slate-400 ml-1" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 cursor-pointer"
              >
                <option value="All">All Types</option>
                <option value="Format Normalization">Format Normalization</option>
                <option value="ISO Standardization">ISO Standardization</option>
                <option value="Lookup & Enrichment">Lookup &amp; Enrichment</option>
                <option value="Direct Copy">Direct Copy</option>
                <option value="Encryption / Hash">Encryption / Hash</option>
              </select>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Valid">Valid Only</option>
              <option value="Issues">Issues Only</option>
            </select>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Source Column &amp; Type</th>
                  <th className="py-2.5 px-3">Transformation Type &amp; Logic</th>
                  <th className="py-2.5 px-3">Target Column &amp; Type</th>
                  <th className="py-2.5 px-3 text-right">Pass Rate / Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {filteredFields.map((field, idx) => {
                  const isSelected = selectedField === field.targetField;
                  return (
                    <tr
                      key={idx}
                      onClick={() => setSelectedField(field.targetField)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-indigo-50/90 font-bold text-slate-900' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Database className="w-3 h-3 text-slate-400" />
                          <span>{field.sourceField}</span>
                        </div>
                        <div className="text-[9px] text-slate-400 font-sans ml-4">
                          {field.sourceTable ? `${field.sourceTable} • ` : ''}{field.sourceType}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 max-w-xs truncate">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-sans font-bold bg-indigo-100 text-indigo-700 border border-indigo-200 block mb-0.5 w-max">
                          {field.transformationType}
                        </span>
                        <div className="text-indigo-900 text-[10px] truncate" title={field.transformationLogic}>
                          {field.transformationLogic}
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Server className="w-3 h-3 text-indigo-500" />
                          <span>{field.targetField}</span>
                        </div>
                        <div className="text-[9px] text-slate-400 font-sans ml-4">
                          {field.targetTable ? `${field.targetTable} • ` : ''}{field.targetType}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        {field.isValid ? (
                          <div className="inline-flex flex-col items-end">
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[10px]">
                              <CheckCircle2 className="w-3 h-3" /> Valid
                            </span>
                            <span className="text-[9px] text-slate-400 font-sans">{field.passRatePercent}% pass rate</span>
                          </div>
                        ) : (
                          <div className="inline-flex flex-col items-end">
                            <span className="inline-flex items-center gap-1 text-amber-600 font-bold text-[10px]">
                              <AlertTriangle className="w-3 h-3" /> Flagged
                            </span>
                            <span className="text-[9px] text-amber-700 font-sans">{field.passRatePercent}% pass rate</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Selected Field Inspector & Sandbox */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Field Lineage Deep Dive
              </h3>
              <button
                onClick={() => setShowFieldTraceModal(true)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Drill Down</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Field Header Summary */}
            <div className="p-3.5 bg-gradient-to-br from-indigo-50/60 to-slate-50 rounded-xl border border-indigo-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-indigo-600 font-extrabold uppercase tracking-wider">
                  {activeFieldDetail.transformationType}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    activeFieldDetail.isValid
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                >
                  {activeFieldDetail.passRatePercent}% Pass Rate
                </span>
              </div>

              <div className="text-sm font-bold text-slate-900 font-mono flex items-center gap-2">
                <span className="text-slate-600">{activeFieldDetail.sourceField}</span>
                <ArrowRight className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="text-indigo-700">{activeFieldDetail.targetField}</span>
              </div>

              <div className="text-[10px] text-slate-500 font-sans flex items-center justify-between pt-1 border-t border-indigo-100/60">
                <span>Source: <strong className="text-slate-800 font-mono">{activeFieldDetail.sourceType}</strong></span>
                <span>Target: <strong className="text-slate-800 font-mono">{activeFieldDetail.targetType}</strong></span>
              </div>
            </div>

            {/* Step-by-Step Transformation Pipeline */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Execution Pipeline Steps
              </span>

              {activeFieldDetail.transformationSteps && activeFieldDetail.transformationSteps.length > 0 ? (
                <div className="space-y-1.5 text-xs font-mono">
                  {activeFieldDetail.transformationSteps.map((step) => (
                    <div key={step.stepNumber} className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {step.stepNumber}
                      </span>
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <div className="font-sans text-[11px] font-bold text-slate-800 flex items-center justify-between">
                          <span>{step.title}</span>
                          <span className="text-[9px] text-indigo-600 font-mono">{step.logic}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">Output: <span className="font-bold text-slate-700">{step.outputSample}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="font-mono text-xs text-slate-800 font-bold bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  {activeFieldDetail.transformationLogic}
                </div>
              )}
            </div>

            {/* Interactive Live Sandbox Bench */}
            <div className="p-3.5 bg-slate-50 text-slate-700 rounded-xl border border-slate-200 space-y-2.5 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" /> Live Logic Simulator Sandbox
                </span>
                <span className="text-[9px] text-slate-500 font-mono">Real-time execution</span>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Test Raw Source Input:</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={sandboxInput}
                      onChange={(e) => handleRunSandbox(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      onClick={() => handleRunSandbox(sandboxInput)}
                      className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      <Play className="w-3 h-3" /> Test
                    </button>
                  </div>
                </div>

                <div className="p-2 bg-white rounded-lg border border-slate-200 font-mono text-[11px] space-y-1 shadow-2xs">
                  <span className="text-[9px] text-indigo-600 font-bold uppercase block">Transformed Output:</span>
                  <div className="font-bold text-slate-900 break-all">{sandboxResult || <span className="text-slate-400 italic">(empty)</span>}</div>
                </div>
              </div>
            </div>

            {/* Audit Diagnostic Alert if Invalid */}
            {!activeFieldDetail.isValid && activeFieldDetail.errorReason && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-800">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Validation Anomaly Flag
                </div>
                <p className="leading-snug text-slate-700">{activeFieldDetail.errorReason}</p>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowFieldTraceModal(true)}
            className="w-full py-2.5 bg-white hover:bg-slate-50 text-slate-900 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm border border-slate-200 group"
          >
            <Workflow className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
            <span>Launch Interactive Field Lineage Inspector</span>
          </button>
        </div>
      </div>

      {/* Export Toast Notification */}
      {exportToastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-white text-slate-900 px-4 py-3 rounded-2xl border border-indigo-200 shadow-xl flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <div className="text-xs">
            <strong className="font-bold block text-indigo-600">Enterprise Architecture Export</strong>
            <span className="text-slate-500 font-mono">{exportToastMsg}</span>
          </div>
          <button
            onClick={() => setExportToastMsg(null)}
            className="text-slate-400 hover:text-slate-600 ml-2 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Field Lineage Drill-Down Deep Dive Modal */}
      {showFieldTraceModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full p-6 space-y-5 shadow-2xl text-slate-700">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Workflow className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    Field Transformation Provenance Trace ({activeFieldDetail.sourceField} → {activeFieldDetail.targetField})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pipeline Entity: <span className="text-indigo-600 font-bold">{selectedEntity}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowFieldTraceModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content Container */}
            <div className="max-h-[calc(100vh-280px)] overflow-y-auto pr-2 custom-scrollbar space-y-6">
              {/* System to System End-to-End Visual Map */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                    Field Mapping Hops & Dependencies Trace
                  </span>
                  
                  {/* Tab Selector */}
                  <div className="flex items-center bg-white p-1 rounded-lg border border-slate-200 text-[10px] shadow-2xs">
                    <button
                      onClick={() => setModalViewTab('graph')}
                      className={`px-2.5 py-1 rounded font-bold cursor-pointer transition-colors ${
                        modalViewTab === 'graph' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Interactive D3 Graph
                    </button>
                    <button
                      onClick={() => setModalViewTab('linear')}
                      className={`px-2.5 py-1 rounded font-bold cursor-pointer transition-colors ${
                        modalViewTab === 'linear' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Linear Summary Chain
                    </button>
                  </div>
                </div>

                {modalViewTab === 'graph' ? (
                  <div className="animate-in fade-in duration-200">
                    <FieldLineageD3Graph
                      activeFieldDetail={activeFieldDetail}
                      selectedEntity={selectedEntity}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs animate-in fade-in duration-200">
                    {/* Source Node */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200 w-full md:w-1/3 space-y-1 shadow-2xs">
                      <span className="text-[9px] text-slate-500 font-bold uppercase block">Source Origin System</span>
                      <div className="font-bold text-slate-900">{activeFieldDetail.sourceSystem || 'SAP ECC ERP'}</div>
                      <div className="text-[11px] text-indigo-600 font-mono">Table: {activeFieldDetail.sourceTable || 'KNA1'}</div>
                      <div className="text-[11px] font-bold text-emerald-600 font-mono">
                        Col: {activeFieldDetail.sourceField} ({activeFieldDetail.sourceType})
                      </div>
                    </div>

                    <div className="text-slate-300 rotate-90 md:rotate-0">
                      <ArrowRight className="w-5 h-5 text-indigo-400" />
                    </div>

                    {/* Transformation Rule Node */}
                    <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-200 w-full md:w-1/3 space-y-1 shadow-2xs">
                      <span className="text-[9px] text-indigo-600 font-bold uppercase block">ETL Transformation Logic</span>
                      <div className="font-bold text-indigo-800 text-[11px] font-mono">{activeFieldDetail.transformationType}</div>
                      <div className="text-[10px] text-slate-600 font-mono bg-white p-1.5 rounded border border-slate-200 truncate">
                        {activeFieldDetail.transformationLogic}
                      </div>
                    </div>

                    <div className="text-slate-300 rotate-90 md:rotate-0">
                      <ArrowRight className="w-5 h-5 text-indigo-400" />
                    </div>

                    {/* Target Node */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200 w-full md:w-1/3 space-y-1 shadow-2xs">
                      <span className="text-[9px] text-slate-500 font-bold uppercase block">Target System</span>
                      <div className="font-bold text-slate-900">{activeFieldDetail.targetSystem || 'Dynamics 365 BC'}</div>
                      <div className="text-[11px] text-indigo-600 font-mono">Table: {activeFieldDetail.targetTable || 'Account'}</div>
                      <div className="text-[11px] font-bold text-emerald-600 font-mono">
                        Col: {activeFieldDetail.targetField} ({activeFieldDetail.targetType})
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Code Generator Snippets */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                    Generated Code Expressions
                  </span>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-slate-50 p-1 rounded-lg border border-slate-200 text-[10px]">
                      <button
                        onClick={() => setActiveCodeTab('sql')}
                        className={`px-2.5 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                          activeCodeTab === 'sql' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        SQL
                      </button>
                      <button
                        onClick={() => setActiveCodeTab('pyspark')}
                        className={`px-2.5 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                          activeCodeTab === 'pyspark' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        PySpark
                      </button>
                      <button
                        onClick={() => setActiveCodeTab('dbt')}
                        className={`px-2.5 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                          activeCodeTab === 'dbt' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        dbt Model
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        const code =
                          activeCodeTab === 'sql'
                            ? activeFieldDetail.sqlSnippet || ''
                            : activeCodeTab === 'pyspark'
                            ? activeFieldDetail.pysparkSnippet || ''
                            : activeFieldDetail.dbtSnippet || '';
                        handleCopyCodeSnippet(code);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-600 text-[10px] font-bold rounded-lg border border-slate-200 cursor-pointer shadow-2xs"
                    >
                      {copiedSnippet ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedSnippet ? 'Copied!' : 'Copy Snippet'}</span>
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs text-indigo-700 overflow-x-auto shadow-inner">
                  {activeCodeTab === 'sql' && (activeFieldDetail.sqlSnippet || `-- SQL expression for ${activeFieldDetail.sourceField}`)}
                  {activeCodeTab === 'pyspark' && (activeFieldDetail.pysparkSnippet || `# PySpark expression for ${activeFieldDetail.sourceField}`)}
                  {activeCodeTab === 'dbt' && (activeFieldDetail.dbtSnippet || `-- dbt jinja snippet for ${activeFieldDetail.sourceField}`)}
                </div>
              </div>

              {/* Value Transformation Comparison */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs shadow-inner">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                  Sample Record Diff Audit
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
                  <div className="p-2.5 bg-red-50 border border-red-100 rounded-lg text-red-700 space-y-1 shadow-2xs">
                    <span className="text-[9px] font-bold text-red-600 block">RAW SOURCE VALUE:</span>
                    <div className="font-bold text-slate-900 text-sm">{activeFieldDetail.sampleBefore}</div>
                    <div className="text-[10px] text-red-500">Length: {activeFieldDetail.sampleBefore.length} chars</div>
                  </div>

                  <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-700 space-y-1 shadow-2xs">
                    <span className="text-[9px] font-bold text-emerald-600 block">TRANSFORMED TARGET VALUE:</span>
                    <div className="font-bold text-slate-900 text-sm">{activeFieldDetail.sampleAfter}</div>
                    <div className="text-[10px] text-emerald-600">Length: {activeFieldDetail.sampleAfter.length} chars</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-100">
              <span className="font-mono text-[11px]">
                Status: <strong className={activeFieldDetail.isValid ? 'text-emerald-600' : 'text-amber-600'}>
                  {activeFieldDetail.isValid ? 'Verified Valid' : 'Flagged for Review'}
                </strong> ({activeFieldDetail.passRatePercent}% pass rate)
              </span>

              <button
                onClick={() => setShowFieldTraceModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm"
              >
                Close Trace Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enterprise Architecture Vector Diagram Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-5xl w-full p-6 space-y-4 shadow-2xl text-slate-700">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Enterprise Architecture Lineage Vector Graph ({selectedEntity})
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopySvgMarkup}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-600 text-xs font-mono font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer shadow-2xs"
                >
                  {copiedSvg ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSvg ? 'Copied XML!' : 'Copy SVG XML'}</span>
                </button>

                <button
                  onClick={handleExportSvg}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download SVG</span>
                </button>

                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* SVG Render Window */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 overflow-x-auto flex justify-center max-h-[60vh] shadow-inner">
              <div
                dangerouslySetInnerHTML={{
                  __html: buildLineageSvg(selectedEntity, nodes, fieldLineageList),
                }}
                className="w-full max-w-4xl shrink-0"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 font-mono pt-4 border-t border-slate-100">
              <span>Compatible with Lucidchart, Visio, Confluence, Figma &amp; Enterprise Architect</span>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
