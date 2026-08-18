import {
  Connector,
  ConnectorDataProfile,
  EntityProfileSummary,
  DataTypeDistribution,
  ColumnProfile,
  ProfilingHistoricalDataPoint,
  EntityCorrelationMatrix,
  FieldCorrelationCell,
  MultivariateDependency,
} from '../types';

export const DATA_TYPE_COLORS: Record<string, string> = {
  String: '#6366f1', // Indigo
  Integer: '#0ea5e9', // Sky
  Decimal: '#10b981', // Emerald
  DateTime: '#f59e0b', // Amber
  Date: '#d97706', // Warm Amber
  Boolean: '#8b5cf6', // Purple
  JSON: '#ec4899', // Pink
  Enum: '#14b8a6', // Teal
  Binary: '#64748b', // Slate
};

/**
 * Generates 30 days of historical data points for trend analysis of row count, null rate, and data types.
 */
export function generateHistoricalTrendPoints(
  currentTotalRows: number,
  currentNullPct: number,
  currentColumns: number,
  typeDistribution: DataTypeDistribution[],
  currentQualityScore: number,
  anomaliesCount: number
): ProfilingHistoricalDataPoint[] {
  const points: ProfilingHistoricalDataPoint[] = [];
  const baseDate = new Date('2026-08-14T00:00:00Z');

  // Count baseline column types
  const stringColsBase = typeDistribution.find((t) => t.type === 'String')?.count || Math.round(currentColumns * 0.5);
  const decimalColsBase = typeDistribution.find((t) => t.type === 'Decimal')?.count || Math.max(1, Math.round(currentColumns * 0.2));
  const intColsBase = typeDistribution.find((t) => t.type === 'Integer')?.count || Math.max(1, Math.round(currentColumns * 0.15));
  const dtColsBase = typeDistribution.find((t) => t.type === 'DateTime' || t.type === 'Date')?.count || Math.max(1, Math.round(currentColumns * 0.1));
  const boolColsBase = typeDistribution.find((t) => t.type === 'Boolean')?.count || 1;
  const otherColsBase = Math.max(0, currentColumns - (stringColsBase + decimalColsBase + intColsBase + dtColsBase + boolColsBase));

  // Starting 30 days ago at ~83% of current volume
  const startRows = Math.max(100, Math.round(currentTotalRows * 0.835));
  const totalGrowth = currentTotalRows - startRows;

  let runningRows = startRows;
  let previousRows = startRows;

  for (let i = 29; i >= 0; i--) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() - i);

    const monthStr = d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
    const dayStr = d.getUTCDate();
    const dateLabel = `${monthStr} ${dayStr}`;
    const fullDate = d.toISOString().split('T')[0];

    const progress = (29 - i) / 29; // 0 to 1

    // Row count curve with weekly business batch bumps
    const dayOfWeek = d.getUTCDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dailyMultiplier = isWeekend ? 0.2 : 1.35;
    
    // Add cumulative growth with slight stochastic noise
    const stepProgress = Math.pow(progress, 1.08);
    const expectedCurrent = Math.round(startRows + totalGrowth * stepProgress);
    const jitter = Math.round((Math.sin(i * 1.5) * (totalGrowth * 0.008)));
    
    if (i === 0) {
      runningRows = currentTotalRows;
    } else {
      runningRows = Math.min(currentTotalRows, Math.max(startRows, expectedCurrent + jitter));
    }

    const rowGrowthDelta = i === 29 ? Math.round(startRows * 0.005) : Math.max(0, runningRows - previousRows);
    previousRows = runningRows;

    // Historical Null Rate: started slightly higher and trended down as data hygiene improved
    // e.g. From (currentNullPct + 2.1)% down to currentNullPct%
    const baseNullVariance = Math.sin(i * 0.8) * 0.35;
    const initialNullBump = (1 - progress) * 2.2;
    const calculatedNullPct = i === 0 
      ? currentNullPct 
      : parseFloat(Math.max(0.1, currentNullPct + initialNullBump + baseNullVariance).toFixed(2));
    
    const calculatedCompleteness = parseFloat((100 - calculatedNullPct).toFixed(2));
    const totalCells = runningRows * currentColumns;
    const nullCount = Math.round((totalCells * calculatedNullPct) / 100);

    // Data Quality Score: started around 89-91 and climbed to currentQualityScore
    const calculatedQuality = i === 0
      ? currentQualityScore
      : parseFloat((currentQualityScore - (1 - progress) * 5.2 + (Math.cos(i) * 0.4)).toFixed(1));

    // Data types evolution: simulate a schema expansion (e.g. 1 new Decimal & 1 DateTime column added 12 days ago)
    const isAfterSchemaExpansion = i <= 12;
    const stringCols = isAfterSchemaExpansion ? stringColsBase : Math.max(1, stringColsBase);
    const decimalCols = isAfterSchemaExpansion ? decimalColsBase : Math.max(1, decimalColsBase - 1);
    const dtCols = isAfterSchemaExpansion ? dtColsBase : Math.max(1, dtColsBase - 1);
    const intCols = intColsBase;
    const boolCols = boolColsBase;
    const otherCols = otherColsBase;

    const totalHistoricalCols = stringCols + decimalCols + dtCols + intCols + boolCols + otherCols;

    const pointDataTypeDist: DataTypeDistribution[] = [
      { type: 'String', count: stringCols, percentage: Math.round((stringCols / totalHistoricalCols) * 100), color: DATA_TYPE_COLORS.String },
      { type: 'Decimal', count: decimalCols, percentage: Math.round((decimalCols / totalHistoricalCols) * 100), color: DATA_TYPE_COLORS.Decimal },
      { type: 'Integer', count: intCols, percentage: Math.round((intCols / totalHistoricalCols) * 100), color: DATA_TYPE_COLORS.Integer },
      { type: 'DateTime', count: dtCols, percentage: Math.round((dtCols / totalHistoricalCols) * 100), color: DATA_TYPE_COLORS.DateTime },
      { type: 'Boolean', count: boolCols, percentage: Math.round((boolCols / totalHistoricalCols) * 100), color: DATA_TYPE_COLORS.Boolean },
    ];

    const historicalAnomalies = i > 20 ? anomaliesCount + 2 : i > 8 ? anomaliesCount + 1 : anomaliesCount;

    points.push({
      date: dateLabel,
      fullDate,
      timestamp: d.toISOString(),
      rowCount: runningRows,
      rowGrowthDelta,
      nullCount,
      nullPercentage: calculatedNullPct,
      completenessPercentage: calculatedCompleteness,
      dataQualityScore: calculatedQuality,
      anomaliesCount: historicalAnomalies,
      stringColumns: stringCols,
      decimalColumns: decimalCols,
      integerColumns: intCols,
      dateTimeColumns: dtCols,
      booleanColumns: boolCols,
      otherColumns: otherCols,
      dataTypeDistribution: pointDataTypeDist,
    });
  }

  return points;
}

/**
 * Generates an automated data profile for any enterprise connector.
 */
export function generateAutomatedDataProfile(
  connector: Partial<Connector>,
  discoveredEntities?: Array<{ name: string; records: number; type?: string; odataEndpoint?: string }>
): ConnectorDataProfile {
  const connId = connector.id || `conn-${Date.now()}`;
  const connName = connector.name || 'Enterprise Connector';
  const category = connector.category || 'ERP';
  const provider = connector.provider || 'Custom System';

  // Determine entities to profile
  let entitiesToProfile = discoveredEntities && discoveredEntities.length > 0
    ? discoveredEntities
    : getDefaultEntitiesForConnector(connId, connName, category, provider);

  const entitySummaries: EntityProfileSummary[] = entitiesToProfile.map((ent) => {
    const columns = generateColumnsForEntity(ent.name, category, ent.records);
    
    // Calculate data type distribution for this entity
    const typeCounts: Record<string, number> = {};
    columns.forEach((col) => {
      typeCounts[col.dataType] = (typeCounts[col.dataType] || 0) + 1;
    });

    const totalCols = columns.length;
    const dataTypeDistribution: DataTypeDistribution[] = Object.entries(typeCounts).map(([type, count]) => ({
      type,
      count,
      percentage: Math.round((count / totalCols) * 100),
      color: DATA_TYPE_COLORS[type] || '#6366f1',
    }));

    const totalCells = ent.records * totalCols;
    const totalNulls = columns.reduce((acc, c) => acc + c.nullCount, 0);
    const nullPct = totalCells > 0 ? parseFloat(((totalNulls / totalCells) * 100).toFixed(2)) : 0;
    const completenessPct = parseFloat((100 - nullPct).toFixed(2));

    return {
      entityName: ent.name,
      entityType: ent.type || 'Table / Entity',
      rowCount: ent.records,
      columnCount: totalCols,
      totalNullValues: totalNulls,
      nullPercentage: nullPct,
      completenessPercentage: completenessPct,
      estimatedSizeBytes: ent.records * totalCols * 128,
      lastProfiledAt: new Date().toISOString(),
      dataTypeDistribution,
      columns,
    };
  });

  // Calculate overall aggregates
  const totalRowCount = entitySummaries.reduce((sum, e) => sum + e.rowCount, 0);
  const totalColumns = entitySummaries.reduce((sum, e) => sum + e.columnCount, 0);
  const totalCellsOverall = entitySummaries.reduce((sum, e) => sum + (e.rowCount * e.columnCount), 0);
  const totalNullValues = entitySummaries.reduce((sum, e) => sum + e.totalNullValues, 0);
  const totalPopulatedValues = Math.max(0, totalCellsOverall - totalNullValues);
  
  const overallNullPercentage = totalCellsOverall > 0 
    ? parseFloat(((totalNullValues / totalCellsOverall) * 100).toFixed(2))
    : 0;
  const overallCompletenessPercentage = parseFloat((100 - overallNullPercentage).toFixed(2));

  // Overall Data Type Distribution across all entities
  const aggregateTypeCounts: Record<string, number> = {};
  entitySummaries.forEach((e) => {
    e.columns.forEach((c) => {
      aggregateTypeCounts[c.dataType] = (aggregateTypeCounts[c.dataType] || 0) + 1;
    });
  });

  const totalColsAcrossAll = Object.values(aggregateTypeCounts).reduce((a, b) => a + b, 0);
  const overallDataTypeDistribution: DataTypeDistribution[] = Object.entries(aggregateTypeCounts)
    .map(([type, count]) => ({
      type,
      count,
      percentage: totalColsAcrossAll > 0 ? Math.round((count / totalColsAcrossAll) * 100) : 0,
      color: DATA_TYPE_COLORS[type] || '#6366f1',
    }))
    .sort((a, b) => b.count - a.count);

  const anomaliesDetectedCount = entitySummaries.reduce(
    (sum, e) => sum + e.columns.filter((c) => c.hasAnomalies).length,
    0
  );

  // Compute composite Data Quality Score (0 - 100)
  const penaltyForNulls = Math.min(30, overallNullPercentage * 2.5);
  const penaltyForAnomalies = Math.min(25, anomaliesDetectedCount * 3.5);
  const dataQualityScore = Math.max(50, parseFloat((100 - penaltyForNulls - penaltyForAnomalies).toFixed(1)));

  // Generate realistic sample records for preview
  const sampleRowsPreview = generateSampleRecords(entitySummaries[0]?.entityName || 'Entity_Master', category);

  // Generate 30-day historical trend data points for Trend Analysis
  const historicalTrends = generateHistoricalTrendPoints(
    totalRowCount,
    overallNullPercentage,
    totalColumns,
    overallDataTypeDistribution,
    dataQualityScore,
    anomaliesDetectedCount
  );

  // Generate Field Correlation Matrices for all profiled entities
  const correlationMatrices = generateCorrelationMatricesForProfile(entitySummaries, category);

  return {
    connectorId: connId,
    connectorName: connName,
    profiledAt: new Date().toISOString(),
    status: 'Completed',
    totalEntities: entitySummaries.length,
    totalRowCount,
    totalColumns,
    totalNullValues,
    totalPopulatedValues,
    overallNullPercentage,
    overallCompletenessPercentage,
    dataTypeDistribution: overallDataTypeDistribution,
    entityProfiles: entitySummaries,
    anomaliesDetectedCount,
    dataQualityScore,
    profilingDurationMs: Math.floor(Math.random() * 320) + 180,
    sampleRowsPreview,
    historicalTrends,
    correlationMatrices,
  };
}

function getDefaultEntitiesForConnector(
  connId: string,
  connName: string,
  category: string,
  provider: string
): Array<{ name: string; records: number; type: string }> {
  if (connId === 'conn-bc-prod' || provider.includes('Business Central')) {
    return [
      { name: 'Customer (API v2.0)', records: 8420, type: 'REST API v2.0' },
      { name: 'Vendor (API v2.0)', records: 6150, type: 'REST API v2.0' },
      { name: 'SalesHeader (Invoices)', records: 19800, type: 'REST API v2.0' },
      { name: 'GL_Entry (General Ledger)', records: 280000, type: 'REST API v2.0' },
    ];
  }
  if (connId === 'conn-sap-s4' || provider.includes('SAP')) {
    return [
      { name: 'KNA1_Customer_Master', records: 14250, type: 'OData v4 Entity' },
      { name: 'MARA_Material_Master', records: 45200, type: 'OData v4 Entity' },
      { name: 'BSEG_Accounting_Document', records: 120400, type: 'OData v4 Entity' },
      { name: 'GL_Transactions', records: 310500, type: 'OData v4 Entity' },
    ];
  }
  if (connId === 'conn-sql-legacy' || category === 'Database') {
    return [
      { name: 'dbo.tbl_CustomerMaster', records: 14250, type: 'SQL Table' },
      { name: 'dbo.tbl_GL_Ledger_Archive', records: 520000, type: 'SQL Table' },
      { name: 'dbo.tbl_SalesOrder_Header', records: 34100, type: 'SQL Table' },
    ];
  }
  if (category === 'CRM' || provider.includes('Salesforce')) {
    return [
      { name: 'Account', records: 22100, type: 'sObject Record' },
      { name: 'Contact', records: 48900, type: 'sObject Record' },
      { name: 'Opportunity', records: 15400, type: 'sObject Record' },
    ];
  }
  if (category === 'Files') {
    return [
      { name: 'Sheet1_Customer_Master', records: 14250, type: 'Worksheet' },
      { name: 'Sheet2_Addresses', records: 14250, type: 'Worksheet' },
    ];
  }

  // Generic fallback based on connector name
  return [
    { name: `${connName.replace(/[^a-zA-Z0-9]/g, '_')}_Master`, records: 12500, type: 'Data Stream' },
    { name: `${connName.replace(/[^a-zA-Z0-9]/g, '_')}_Ledger`, records: 45000, type: 'Data Stream' },
  ];
}

function generateColumnsForEntity(entityName: string, category: string, rowCount: number): ColumnProfile[] {
  const norm = entityName.toLowerCase();

  if (norm.includes('cust') || norm.includes('account') || norm.includes('sheet1')) {
    return [
      {
        columnName: 'Customer_ID',
        dataType: 'String',
        totalCount: rowCount,
        nullCount: 0,
        nullPercentage: 0,
        uniqueCount: rowCount,
        uniquenessPercentage: 100,
        sampleValues: ['CUS-10029', 'CUS-10030', 'CUS-10031'],
        hasAnomalies: false,
      },
      {
        columnName: 'Legal_Name',
        dataType: 'String',
        totalCount: rowCount,
        nullCount: 0,
        nullPercentage: 0,
        uniqueCount: Math.round(rowCount * 0.98),
        uniquenessPercentage: 98.0,
        sampleValues: ['Acme Corp', 'Apex Med Inc', 'Global Tech Ltd'],
        hasAnomalies: false,
      },
      {
        columnName: 'Tax_Registration_No',
        dataType: 'String',
        totalCount: rowCount,
        nullCount: Math.round(rowCount * 0.084),
        nullPercentage: 8.4,
        uniqueCount: Math.round(rowCount * 0.90),
        uniquenessPercentage: 90.0,
        sampleValues: ['US-883921049', 'DE123456789', 'INVALID_TAX'],
        hasAnomalies: true,
        anomalyDescription: 'Contains "INVALID_TAX" placeholder strings',
      },
      {
        columnName: 'Credit_Limit_LCY',
        dataType: 'Decimal',
        totalCount: rowCount,
        nullCount: Math.round(rowCount * 0.12),
        nullPercentage: 12.0,
        uniqueCount: 240,
        uniquenessPercentage: 2.4,
        sampleValues: ['250000.00', '500000.00', '75000.00'],
        hasAnomalies: false,
      },
      {
        columnName: 'Country_Region_Code',
        dataType: 'String',
        totalCount: rowCount,
        nullCount: 0,
        nullPercentage: 0,
        uniqueCount: 32,
        uniquenessPercentage: 0.3,
        sampleValues: ['US', 'CA', 'DE', 'GB', 'SG'],
        hasAnomalies: false,
      },
      {
        columnName: 'Contact_Email',
        dataType: 'String',
        totalCount: rowCount,
        nullCount: Math.round(rowCount * 0.015),
        nullPercentage: 1.5,
        uniqueCount: Math.round(rowCount * 0.96),
        uniquenessPercentage: 96.0,
        sampleValues: ['billing@acme.com', 'finance@global.ca'],
        hasAnomalies: true,
        anomalyDescription: 'Consecutive dot syntax in domain portion',
      },
      {
        columnName: 'Payment_Terms_Code',
        dataType: 'String',
        totalCount: rowCount,
        nullCount: Math.round(rowCount * 0.005),
        nullPercentage: 0.5,
        uniqueCount: 8,
        uniquenessPercentage: 0.1,
        sampleValues: ['NET30', 'NET60', 'NET15'],
        hasAnomalies: false,
      },
      {
        columnName: 'Created_Timestamp',
        dataType: 'DateTime',
        totalCount: rowCount,
        nullCount: 0,
        nullPercentage: 0,
        uniqueCount: Math.round(rowCount * 0.85),
        uniquenessPercentage: 85.0,
        sampleValues: ['2026-06-15T14:30:00Z', '2026-07-01T08:15:00Z'],
        hasAnomalies: false,
      },
      {
        columnName: 'Is_Active',
        dataType: 'Boolean',
        totalCount: rowCount,
        nullCount: 0,
        nullPercentage: 0,
        uniqueCount: 2,
        uniquenessPercentage: 0.02,
        sampleValues: ['true', 'false'],
        hasAnomalies: false,
      },
    ];
  }

  if (norm.includes('ledger') || norm.includes('journal') || norm.includes('bseg') || norm.includes('fact')) {
    return [
      {
        columnName: 'Entry_No',
        dataType: 'Integer',
        totalCount: rowCount,
        nullCount: 0,
        nullPercentage: 0,
        uniqueCount: rowCount,
        uniquenessPercentage: 100,
        sampleValues: ['10001', '10002', '10003'],
        hasAnomalies: false,
      },
      {
        columnName: 'GL_Account_No',
        dataType: 'String',
        totalCount: rowCount,
        nullCount: 0,
        nullPercentage: 0,
        uniqueCount: 150,
        uniquenessPercentage: 0.1,
        sampleValues: ['10100', '20200', '40100'],
        hasAnomalies: false,
      },
      {
        columnName: 'Posting_Date',
        dataType: 'Date',
        totalCount: rowCount,
        nullCount: 0,
        nullPercentage: 0,
        uniqueCount: 730,
        uniquenessPercentage: 0.5,
        sampleValues: ['2026-06-01', '2026-06-02', '2026-06-15'],
        hasAnomalies: false,
      },
      {
        columnName: 'Amount_Debit',
        dataType: 'Decimal',
        totalCount: rowCount,
        nullCount: Math.round(rowCount * 0.45),
        nullPercentage: 45.0,
        uniqueCount: Math.round(rowCount * 0.4),
        uniquenessPercentage: 40.0,
        sampleValues: ['14250.00', '3120.50', '890.00'],
        hasAnomalies: false,
      },
      {
        columnName: 'Amount_Credit',
        dataType: 'Decimal',
        totalCount: rowCount,
        nullCount: Math.round(rowCount * 0.55),
        nullPercentage: 55.0,
        uniqueCount: Math.round(rowCount * 0.38),
        uniquenessPercentage: 38.0,
        sampleValues: ['14250.00', '3120.50'],
        hasAnomalies: false,
      },
      {
        columnName: 'Currency_Code',
        dataType: 'String',
        totalCount: rowCount,
        nullCount: Math.round(rowCount * 0.05),
        nullPercentage: 5.0,
        uniqueCount: 12,
        uniquenessPercentage: 0.01,
        sampleValues: ['USD', 'EUR', 'GBP', 'CAD'],
        hasAnomalies: false,
      },
      {
        columnName: 'Cost_Center_Code',
        dataType: 'String',
        totalCount: rowCount,
        nullCount: Math.round(rowCount * 0.08),
        nullPercentage: 8.0,
        uniqueCount: 45,
        uniquenessPercentage: 0.03,
        sampleValues: ['CC-ENG', 'CC-OPS', 'CC-EXEC'],
        hasAnomalies: false,
      },
    ];
  }

  // Default standard schema
  return [
    {
      columnName: 'Record_ID',
      dataType: 'String',
      totalCount: rowCount,
      nullCount: 0,
      nullPercentage: 0,
      uniqueCount: rowCount,
      uniquenessPercentage: 100,
      sampleValues: ['REC-001', 'REC-002', 'REC-003'],
      hasAnomalies: false,
    },
    {
      columnName: 'Entity_Code',
      dataType: 'String',
      totalCount: rowCount,
      nullCount: 0,
      nullPercentage: 0,
      uniqueCount: Math.round(rowCount * 0.95),
      uniquenessPercentage: 95.0,
      sampleValues: ['ENT_GLOBAL_10', 'ENT_GLOBAL_11'],
      hasAnomalies: false,
    },
    {
      columnName: 'Numeric_Value',
      dataType: 'Decimal',
      totalCount: rowCount,
      nullCount: Math.round(rowCount * 0.06),
      nullPercentage: 6.0,
      uniqueCount: Math.round(rowCount * 0.5),
      uniquenessPercentage: 50.0,
      sampleValues: ['1250.00', '4800.75'],
      hasAnomalies: false,
    },
    {
      columnName: 'Quantity_Units',
      dataType: 'Integer',
      totalCount: rowCount,
      nullCount: Math.round(rowCount * 0.02),
      nullPercentage: 2.0,
      uniqueCount: 120,
      uniquenessPercentage: 1.2,
      sampleValues: ['10', '25', '100'],
      hasAnomalies: false,
    },
    {
      columnName: 'Status_Flag',
      dataType: 'Enum',
      totalCount: rowCount,
      nullCount: 0,
      nullPercentage: 0,
      uniqueCount: 4,
      uniquenessPercentage: 0.04,
      sampleValues: ['ACTIVE', 'PENDING', 'CLOSED', 'ARCHIVED'],
      hasAnomalies: false,
    },
    {
      columnName: 'Metadata_Payload',
      dataType: 'JSON',
      totalCount: rowCount,
      nullCount: Math.round(rowCount * 0.15),
      nullPercentage: 15.0,
      uniqueCount: Math.round(rowCount * 0.7),
      uniquenessPercentage: 70.0,
      sampleValues: ['{"tier": "gold"}', '{"tags": ["migrated"]}'],
      hasAnomalies: false,
    },
    {
      columnName: 'Sync_Timestamp',
      dataType: 'DateTime',
      totalCount: rowCount,
      nullCount: 0,
      nullPercentage: 0,
      uniqueCount: Math.round(rowCount * 0.9),
      uniquenessPercentage: 90.0,
      sampleValues: ['2026-08-14T02:00:00Z'],
      hasAnomalies: false,
    },
  ];
}

function generateSampleRecords(entityName: string, category: string): Record<string, any>[] {
  return [
    {
      Record_ID: 'CUS-10029',
      Legal_Name: 'Acme Logistics & Trade Corp',
      Country_Region_Code: 'US',
      Credit_Limit_LCY: 250000.00,
      Tax_Registration_No: 'US-883921049',
      Contact_Email: 'billing@acmelogistics.com',
      Payment_Terms_Code: 'NET30',
      Is_Active: true,
      Sync_Timestamp: '2026-08-14T02:15:00Z',
    },
    {
      Record_ID: 'CUS-10030',
      Legal_Name: 'Global Tech Innovations Ltd',
      Country_Region_Code: 'CA',
      Credit_Limit_LCY: 500000.00,
      Tax_Registration_No: 'CA-102938475',
      Contact_Email: 'finance@globaltech.ca',
      Payment_Terms_Code: 'NET60',
      Is_Active: true,
      Sync_Timestamp: '2026-08-14T02:16:30Z',
    },
    {
      Record_ID: 'CUS-10031',
      Legal_Name: 'Vandenberg Heavy Industries GMBH',
      Country_Region_Code: 'DE',
      Credit_Limit_LCY: 1000000.00,
      Tax_Registration_No: 'DE123456789',
      Contact_Email: 'accounts@vandenberg.de',
      Payment_Terms_Code: 'NET30',
      Is_Active: true,
      Sync_Timestamp: '2026-08-14T02:18:10Z',
    },
    {
      Record_ID: 'CUS-10032',
      Legal_Name: 'Pacific Rim Freight Services',
      Country_Region_Code: 'SG',
      Credit_Limit_LCY: 150000.00,
      Tax_Registration_No: null,
      Contact_Email: 'ap@pacificfreight.sg',
      Payment_Terms_Code: 'NET15',
      Is_Active: true,
      Sync_Timestamp: '2026-08-14T02:20:00Z',
    },
    {
      Record_ID: 'CUS-10033',
      Legal_Name: 'Apex Medical Supplies Inc',
      Country_Region_Code: 'US',
      Credit_Limit_LCY: 75000.00,
      Tax_Registration_No: 'INVALID_TAX',
      Contact_Email: 'orders@apexmed.com',
      Payment_Terms_Code: 'NET30',
      Is_Active: false,
      Sync_Timestamp: '2026-08-14T02:22:45Z',
    },
  ];
}

/**
 * Deterministic hash function for consistent field pair calculations.
 */
function hashPair(f1: string, f2: string): number {
  const sorted = [f1.toLowerCase(), f2.toLowerCase()].sort().join(':::');
  let hash = 0;
  for (let i = 0; i < sorted.length; i++) {
    const char = sorted.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Generates field correlation matrices for all entities in a profile.
 */
export function generateCorrelationMatricesForProfile(
  entitySummaries: EntityProfileSummary[],
  category: string
): EntityCorrelationMatrix[] {
  return entitySummaries.map((summary) => generateEntityCorrelationMatrix(summary, category));
}

/**
 * Computes pairwise field correlations, Cramér's V, functional dependencies, and multivariate formulas for an entity.
 */
export function generateEntityCorrelationMatrix(
  summary: EntityProfileSummary,
  category: string
): EntityCorrelationMatrix {
  const columns = summary.columns;
  const fields = columns.map((c) => c.columnName);
  const fieldTypes: Record<string, string> = {};
  columns.forEach((c) => {
    fieldTypes[c.columnName] = c.dataType;
  });

  const correlations: FieldCorrelationCell[] = [];

  // Pairwise correlation calculation
  for (let i = 0; i < fields.length; i++) {
    for (let j = 0; j < fields.length; j++) {
      const f1 = fields[i];
      const f2 = fields[j];
      const t1 = fieldTypes[f1] || 'String';
      const t2 = fieldTypes[f2] || 'String';

      if (i === j) {
        // Identity cell (diagonal)
        correlations.push({
          sourceField: f1,
          targetField: f2,
          sourceType: t1,
          targetType: t2,
          coefficient: 1.0,
          absCoefficient: 1.0,
          pVal: 0.0001,
          sampleSize: summary.rowCount,
          strength: 'Very Strong',
          metricMethod: t1 === 'Decimal' || t1 === 'Integer' ? 'Pearson (Numeric)' : 'Cramér’s V (Categorical)',
          relationshipCategory: 'Direct Positive',
          significance: 'High (p<0.001)',
          description: `Identity baseline: "${f1}" is 100% self-correlated with full determinism.`,
          coOccurrencePct: 100,
          scatterPreview: generateScatterPoints(1.0, t1, t2),
        });
        continue;
      }

      // Compute pairwise domain-specific correlation
      const pairData = computePairwiseCorrelation(f1, f2, t1, t2, summary.rowCount, category);
      correlations.push(pairData);
    }
  }

  // Identify top strongest correlations (excluding diagonal identity pairs)
  const uniqueNonSelfPairs: FieldCorrelationCell[] = [];
  const seenPairKeys = new Set<string>();

  correlations
    .filter((c) => c.sourceField !== c.targetField)
    .sort((a, b) => b.absCoefficient - a.absCoefficient)
    .forEach((cell) => {
      const key = [cell.sourceField, cell.targetField].sort().join('<->');
      if (!seenPairKeys.has(key)) {
        seenPairKeys.add(key);
        uniqueNonSelfPairs.push(cell);
      }
    });

  const strongestCorrelations = uniqueNonSelfPairs.slice(0, 6);

  // Multivariate Dependencies
  const multivariateDependencies = generateMultivariateDependencies(summary.entityName, fields, fieldTypes);

  return {
    entityName: summary.entityName,
    fields,
    fieldTypes,
    correlations,
    calculatedAt: new Date().toISOString(),
    strongestCorrelations,
    multivariateDependencies,
  };
}

/**
 * Domain-specific correlation rules and mathematical synthesis.
 */
function computePairwiseCorrelation(
  f1: string,
  f2: string,
  t1: string,
  t2: string,
  rowCount: number,
  category: string
): FieldCorrelationCell {
  const n1 = f1.toLowerCase();
  const n2 = f2.toLowerCase();
  const h = hashPair(f1, f2);

  let rawCoeff = 0.0;
  let method: FieldCorrelationCell['metricMethod'] = 'Pearson (Numeric)';
  let desc = '';
  let pVal = 0.0001;

  const isNumeric1 = t1 === 'Decimal' || t1 === 'Integer';
  const isNumeric2 = t2 === 'Decimal' || t2 === 'Integer';

  // Domain rule matches
  if ((n1.includes('credit_limit') && n2.includes('payment_terms')) || (n2.includes('credit_limit') && n1.includes('payment_terms'))) {
    rawCoeff = 0.74;
    method = 'Correlation Ratio (η)';
    desc = 'Strong positive linkage: enterprise accounts with higher credit ceilings are systematically assigned extended payment terms (NET60/NET90).';
  } else if ((n1.includes('customer_id') && n2.includes('legal_name')) || (n2.includes('customer_id') && n1.includes('legal_name'))) {
    rawCoeff = 0.98;
    method = 'Functional Dependency';
    desc = 'Near-perfect functional key dependency: Customer_ID uniquely identifies Legal_Name with 98.4% bijection.';
  } else if ((n1.includes('tax_reg') && n2.includes('country')) || (n2.includes('tax_reg') && n1.includes('country'))) {
    rawCoeff = 0.89;
    method = 'Cramér’s V (Categorical)';
    desc = 'Country prefix format in Tax Registration Code strongly associates with Country_Region_Code.';
  } else if ((n1.includes('entry_no') && n2.includes('posting_date')) || (n2.includes('entry_no') && n1.includes('posting_date'))) {
    rawCoeff = 0.99;
    method = 'Pearson (Numeric)';
    desc = 'Monotonic chronological ordering: Entry_No sequence advances strictly alongside Posting_Date.';
  } else if ((n1.includes('debit') && n2.includes('credit')) || (n2.includes('debit') && n1.includes('credit'))) {
    rawCoeff = -0.84;
    method = 'Pearson (Numeric)';
    desc = 'Strong inverse correlation: general ledger double-entry bookkeeping balances debits against credits.';
  } else if ((n1.includes('discount') && n2.includes('margin')) || (n2.includes('discount') && n1.includes('margin'))) {
    rawCoeff = -0.73;
    method = 'Pearson (Numeric)';
    desc = 'Negative linear regression: higher invoice discount rates directly compress realized gross profit margin.';
  } else if ((n1.includes('unit_price') && n2.includes('amount')) || (n2.includes('unit_price') && n1.includes('amount'))) {
    rawCoeff = 0.88;
    method = 'Pearson (Numeric)';
    desc = 'Direct volume-price multiplier relationship contributing to line total.';
  } else if ((n1.includes('quantity') && n2.includes('amount')) || (n2.includes('quantity') && n1.includes('amount'))) {
    rawCoeff = 0.81;
    method = 'Pearson (Numeric)';
    desc = 'Positive scaling: order item quantity positively dictates total line item financial volume.';
  } else if ((n1.includes('probability') && n2.includes('stage')) || (n2.includes('probability') && n1.includes('stage'))) {
    rawCoeff = 0.93;
    method = 'Correlation Ratio (η)';
    desc = 'Sales pipeline stage transitions enforce strict milestone-based deal win probability scoring.';
  } else if ((n1.includes('amount') && n2.includes('expected_revenue')) || (n2.includes('amount') && n1.includes('expected_revenue'))) {
    rawCoeff = 0.96;
    method = 'Pearson (Numeric)';
    desc = 'Mathematical multiplier: Expected Revenue is calculated directly from Deal Amount * Stage Probability.';
  } else if ((n1.includes('is_active') && n2.includes('credit_limit')) || (n2.includes('is_active') && n1.includes('credit_limit'))) {
    rawCoeff = 0.46;
    method = 'Correlation Ratio (η)';
    desc = 'Active commercial status correlates with open and approved credit facility allocations.';
  } else if ((n1.includes('email') && n2.includes('legal_name')) || (n2.includes('email') && n1.includes('legal_name'))) {
    rawCoeff = 0.76;
    method = 'Cramér’s V (Categorical)';
    desc = 'Corporate email domain names correlate strongly with corporate legal trade entity names.';
  } else if ((n1.includes('created') && n2.includes('sync')) || (n2.includes('created') && n1.includes('sync'))) {
    rawCoeff = 0.87;
    method = 'Pearson (Numeric)';
    desc = 'Pipeline latency tracking: synchronization timestamps follow ingestion creation timestamps within delta SLAs.';
  } else if (isNumeric1 && isNumeric2) {
    // Both numeric fallback: generate realistic coefficient between -0.45 and +0.68
    const normHash = (h % 1000) / 1000; // 0 to 1
    rawCoeff = parseFloat((normHash * 1.1 - 0.42).toFixed(2));
    method = 'Pearson (Numeric)';
    desc = `Linear numeric covariance between ${f1} and ${f2} across ${rowCount.toLocaleString()} sample records.`;
  } else if (isNumeric1 || isNumeric2) {
    // Mixed numeric/categorical: generate correlation ratio between 0.10 and 0.65
    const normHash = (h % 1000) / 1000;
    rawCoeff = parseFloat((0.12 + normHash * 0.52).toFixed(2));
    method = 'Correlation Ratio (η)';
    desc = `ANOVA categorical-to-continuous variance ratio evaluating how groups in categorical fields partition numeric spread.`;
  } else {
    // Both categorical: Cramér's V (0.05 to 0.72)
    const normHash = (h % 1000) / 1000;
    rawCoeff = parseFloat((0.08 + normHash * 0.64).toFixed(2));
    method = 'Cramér’s V (Categorical)';
    desc = `Contingency table association (Cramér's V) measuring mutual information between discrete fields.`;
  }

  const absCoeff = Math.abs(rawCoeff);
  let strength: FieldCorrelationCell['strength'] = 'Weak';
  if (absCoeff >= 0.8) strength = rawCoeff < 0 ? 'Inverse Strong' : 'Very Strong';
  else if (absCoeff >= 0.6) strength = rawCoeff < 0 ? 'Inverse Moderate' : 'Strong';
  else if (absCoeff >= 0.35) strength = 'Moderate';
  else if (absCoeff >= 0.15) strength = 'Weak';
  else strength = 'None';

  let relCat: FieldCorrelationCell['relationshipCategory'] = 'Orthogonal / Independent';
  if (rawCoeff <= -0.3) relCat = 'Inverse Negative';
  else if (rawCoeff >= 0.35) relCat = 'Direct Positive';
  else if (method.includes('Cramér')) relCat = 'Categorical Association';

  const significance: FieldCorrelationCell['significance'] = absCoeff > 0.4 ? 'High (p<0.001)' : absCoeff > 0.2 ? 'Moderate (p<0.05)' : 'Low / Insignificant';

  return {
    sourceField: f1,
    targetField: f2,
    sourceType: t1,
    targetType: t2,
    coefficient: rawCoeff,
    absCoefficient: absCoeff,
    pVal,
    sampleSize: rowCount,
    strength,
    metricMethod: method,
    relationshipCategory: relCat,
    significance,
    description: desc,
    coOccurrencePct: Math.round(92 + (h % 8)),
    scatterPreview: generateScatterPoints(rawCoeff, t1, t2),
  };
}

/**
 * Generates sample scatter coordinates for the deep-dive visualization drawer.
 */
function generateScatterPoints(
  coeff: number,
  t1: string,
  t2: string
): Array<{ x: number | string; y: number | string; label?: string }> {
  const points: Array<{ x: number | string; y: number | string; label?: string }> = [];
  const pointCount = 32;

  for (let k = 0; k < pointCount; k++) {
    const normX = (k / (pointCount - 1)) * 100;
    const noise = (Math.sin(k * 3.7) + Math.cos(k * 1.9)) * 14 * (1 - Math.abs(coeff) * 0.85);
    let normY = 50;

    if (coeff >= 0) {
      normY = normX * coeff + (50 * (1 - coeff)) + noise;
    } else {
      normY = (100 - normX) * Math.abs(coeff) + (50 * (1 - Math.abs(coeff))) + noise;
    }

    const clampedY = Math.max(5, Math.min(95, normY));

    points.push({
      x: parseFloat(normX.toFixed(1)),
      y: parseFloat(clampedY.toFixed(1)),
      label: `Obs #${k + 1}`,
    });
  }

  return points;
}

/**
 * Generates multivariate dependency and regression insights for the entity.
 */
function generateMultivariateDependencies(
  entityName: string,
  fields: string[],
  fieldTypes: Record<string, string>
): MultivariateDependency[] {
  const norm = entityName.toLowerCase();

  if (norm.includes('cust') || norm.includes('account')) {
    return [
      {
        targetField: 'Credit_Limit_LCY',
        dependentOn: ['Country_Region_Code', 'Payment_Terms_Code', 'Is_Active'],
        rSquared: 0.86,
        explanation: 'Credit facility amount is 86% predictable from corporate territory and commercial terms tier.',
        riskFactor: 'Medium',
      },
      {
        targetField: 'Tax_Registration_No',
        dependentOn: ['Country_Region_Code', 'Legal_Name'],
        rSquared: 0.94,
        explanation: 'Format and presence of tax identification code is governed directly by operating country code.',
        riskFactor: 'Low',
      },
    ];
  }

  if (norm.includes('ledger') || norm.includes('journal') || norm.includes('bseg')) {
    return [
      {
        targetField: 'Amount_LCY',
        dependentOn: ['Debit_Amount', 'Credit_Amount'],
        rSquared: 0.99,
        explanation: 'Amount in local currency is algebraically determined by net debit minus credit line values.',
        riskFactor: 'Low',
      },
      {
        targetField: 'Posting_Date',
        dependentOn: ['Entry_No', 'GL_Account_No'],
        rSquared: 0.95,
        explanation: 'Sequential ledger entry numbers correlate linearly with journal posting date batches.',
        riskFactor: 'Low',
      },
    ];
  }

  // Generic fallback
  const firstField = fields[0] || 'Field_1';
  const otherFields = fields.slice(1, 4);

  return [
    {
      targetField: fields[fields.length - 1] || 'Output_Metric',
      dependentOn: otherFields.length > 0 ? otherFields : [firstField],
      rSquared: 0.88,
      explanation: `Multivariate dependency indicates ${fields[fields.length - 1] || 'Target'} is reliably predicted from key operational covariates.`,
      riskFactor: 'Medium',
    },
  ];
}

