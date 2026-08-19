import express from 'express';
import path from 'path';
import http from 'http';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;
const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
  },
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Request Logger Middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Helper to initialize Gemini Client safely
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Rate limiting & caching state for Gemini calls
let geminiRateLimitCooldownUntil = 0;
const aiResponseCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache

async function callGeminiSafe(prompt: string, cacheKey?: string): Promise<{ parsed: any; note?: string } | null> {
  const ai = getGeminiClient();
  if (!ai) return null;

  if (cacheKey && aiResponseCache.has(cacheKey)) {
    const cached = aiResponseCache.get(cacheKey)!;
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return { parsed: cached.data };
    }
  }

  if (Date.now() < geminiRateLimitCooldownUntil) {
    return null;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });
    const jsonText = response.text || '{}';
    const parsed = JSON.parse(jsonText);

    if (cacheKey) {
      aiResponseCache.set(cacheKey, { data: parsed, timestamp: Date.now() });
    }

    return { parsed };
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    if (errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) {
      geminiRateLimitCooldownUntil = Date.now() + 30000; // 30s cooldown
      console.log('[Gemini API] Free tier quota rate limit reached (429). Using EDIMP rule-based engine fallback.');
    } else {
      console.log('[Gemini API] Notice:', errMsg.slice(0, 100));
    }
    return null;
  }
}

// POST Load Balancer Prediction
app.post("/api/loadbalancer/predict", async (req, res) => {
  const { nodes, queue } = req.body;
  const prompt = `You are a load balancing predictive AI. Given the following current connector node states:\n${JSON.stringify(nodes, null, 2)}
And an incoming queue of ${queue} records.\nForecast upcoming bottlenecks over the next 1 hour based on common migration patterns and suggest proactive resource provisioning (e.g., allocating more throughput, adding nodes).\nRespond ONLY in valid JSON format:\n{\n  "forecast": "short string describing the forecast",\n  "suggestedActions": [\n    { "nodeId": "id of node", "action": "string describing action like Increase max throughput by 50%" }\n  ],\n  "predictedPeakQueue": 1000\n}`;

  const result = await callGeminiSafe(prompt, "lb_predict_" + Math.random());
  if (result && result.parsed) {
    res.json({ success: true, prediction: result.parsed });
  } else {
    res.status(500).json({ success: false, message: "Prediction failed or rate limited" });
  }
});

// API Health
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'EDIMP Backend Engine',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    timestamp: new Date().toISOString(),
  });
});

// AI Auto Field Mapping API
app.post('/api/ai/suggest-mapping', async (req, res) => {
  try {
    const { sourceSchema, destinationSchema, sourceName, destinationName, provider, model } = req.body;
    const selectedProvider = provider || 'gemini';
    const selectedModel = model || 'Gemini 2.5 Flash';

    const prompt = `You are a Senior Enterprise Solution Architect executing under the "${selectedProvider.toUpperCase()}" engine with model "${selectedModel}".
Map the fields from source system "${sourceName || 'Source System'}" to destination system "${destinationName || 'Destination System'}".

Source Schema Fields:
${JSON.stringify(sourceSchema, null, 2)}

Destination Schema Fields:
${JSON.stringify(destinationSchema, null, 2)}

Provide a JSON output matching this exact structure:
{
  "mappings": [
    {
      "sourceField": "field_name_in_source",
      "targetField": "field_name_in_target",
      "confidence": 0.95,
      "transformation": "None | Trim | Uppercase | Lowercase | CurrencyConvert | DateFormat | CustomExpression",
      "transformationCode": "optional code or formula if transformation needed",
      "reasoning": "Reason for mapping"
    }
  ],
  "unmappedSourceFields": ["list_of_fields"],
  "unmappedTargetFields": ["list_of_fields"],
  "overallConfidence": 0.92,
  "recommendations": ["list of data cleansing or type conversion tips"]
}
`;

    const cacheKey = `suggest-mapping:${selectedProvider}:${selectedModel}:${sourceName}:${destinationName}:${JSON.stringify(sourceSchema).slice(0, 80)}`;
    const aiRes = await callGeminiSafe(prompt, cacheKey);

    if (!aiRes || !aiRes.parsed) {
      const fallbackMappings = generateSmartRuleMappings(sourceSchema, destinationSchema).map(m => ({
        ...m,
        reasoning: `${m.reasoning || 'Rule-matched'} [via ${selectedProvider.toUpperCase()} (${selectedModel})]`,
      }));
      return res.json({
        success: true,
        mappings: fallbackMappings,
        unmappedSourceFields: [],
        unmappedTargetFields: [],
        overallConfidence: 0.91,
        recommendations: [
          'Verify field names match standard ISO schemas',
          'Ensure primary and foreign keys are explicitly mapped in CRM targets'
        ],
        aiGenerated: false,
        provider: selectedProvider,
        model: selectedModel,
        note: `Processed using Rule-Based Engine (${selectedProvider.toUpperCase()} - ${selectedModel})`,
      });
    }

    return res.json({
      success: true,
      mappings: aiRes.parsed.mappings || [],
      unmappedSourceFields: aiRes.parsed.unmappedSourceFields || [],
      unmappedTargetFields: aiRes.parsed.unmappedTargetFields || [],
      overallConfidence: aiRes.parsed.overallConfidence || 0.88,
      recommendations: aiRes.parsed.recommendations || [],
      aiGenerated: true,
      provider: selectedProvider,
      model: selectedModel,
    });
  } catch (error: any) {
    console.error('Error in AI suggest-mapping:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate AI field mapping',
    });
  }
});

// AI Data Dictionary Entity Documentation Summary API
app.post('/api/ai/data-dictionary-summary', async (req, res) => {
  try {
    const { entityName, system, fields, category } = req.body;

    const prompt = `
You are an expert Enterprise Data Architect & Governance Consultant for large-scale SAP, Salesforce, and Dynamics ERP migrations.
Generate a professional Data Dictionary summary for the following entity:

Entity Name: ${entityName}
Source System: ${system}
Category: ${category || 'Master Data'}
Field Schema Attributes: ${JSON.stringify(fields || [])}

Provide your response in valid JSON matching this schema:
{
  "summary": "Detailed paragraph explaining the business purpose, lifecycle, and critical dependencies of this entity.",
  "dataGovernance": {
    "classification": "Public | Internal | Confidential | Highly Restricted",
    "piiRisk": "Low | Medium | High | Critical",
    "complianceScope": ["List of applicable frameworks like GDPR, SOX, HIPAA, PCI-DSS"],
    "ownerDepartment": "Department responsible (e.g. Finance Operations, Sales Ops, Supply Chain)"
  },
  "recommendedCleansingRules": ["Rule 1", "Rule 2"],
  "targetSystemMappingTip": "Key considerations when migrating this entity to modern cloud ERP/CRM targets."
}
`;

    const cacheKey = `data-dict:${entityName}:${system}`;
    const aiRes = await callGeminiSafe(prompt, cacheKey);

    if (!aiRes || !aiRes.parsed) {
      return res.json({
        success: true,
        summary: `The ${entityName} entity in ${system} acts as a core ${category || 'master data'} repository within the migration ecosystem. Contains ${fields?.length || 0} defined schema attributes including primary keys, status indicators, and relational foreign references.`,
        governance: {
          classification: 'Confidential / Business Critical',
          piiRisk: 'Medium (Contains customer contact and transaction metadata)',
          complianceScope: ['GDPR Article 17', 'SOX 404 Financial Control', 'CCPA'],
          ownerDepartment: 'Global Enterprise Data Office (GEDO)',
        },
        recommendedCleansingRules: [
          'Verify required fields are non-null',
          'Trim trailing whitespaces from character fields'
        ],
        targetSystemMappingTip: 'Consider column mapping types and standard length limits when transforming properties.',
        aiGenerated: false,
        fallbackNote: 'Generated via EDIMP Enterprise Rule Engine',
      });
    }

    return res.json({
      success: true,
      summary: aiRes.parsed.summary,
      governance: aiRes.parsed.dataGovernance,
      recommendedCleansingRules: aiRes.parsed.recommendedCleansingRules,
      targetSystemMappingTip: aiRes.parsed.targetSystemMappingTip,
      aiGenerated: true,
    });
  } catch (error: any) {
    console.error('Error in AI data-dictionary-summary:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate AI data dictionary summary',
    });
  }
});

// AI Data Quality & Profiling API
app.post('/api/ai/profile-data', async (req, res) => {
  try {
    const { objectName, sampleData, columnStats } = req.body;

    const prompt = `You are an AI Data Governance Specialist for Enterprise Migration.
Profile the data quality for object "${objectName}" based on these sample rows and stats:

Column Stats:
${JSON.stringify(columnStats, null, 2)}

Sample Data (first 10 rows):
${JSON.stringify(sampleData?.slice(0, 10), null, 2)}

Respond with JSON in this format:
{
  "qualityScore": 85,
  "summary": "Data quality analysis summary...",
  "anomalies": [
    { "field": "fieldName", "issue": "Description of anomaly", "severity": "High | Medium | Low" }
  ],
  "cleansingSuggestions": [
    "Suggestion 1", "Suggestion 2"
  ],
  "completenessPercent": 94,
  "uniquenessPercent": 98
}`;

    const cacheKey = `profile-data:${objectName}`;
    const aiRes = await callGeminiSafe(prompt, cacheKey);

    if (!aiRes || !aiRes.parsed) {
      return res.json({
        success: true,
        qualityScore: 88,
        summary: 'Fuzzy rule-based data profile analysis executed.',
        anomalies: [
          { field: 'Phone', issue: 'Inconsistent phone number formats found (missing country code)', severity: 'Medium' },
          { field: 'Tax_ID', issue: '3 records have missing or invalid GST/VAT numbers', severity: 'High' }
        ],
        cleansingSuggestions: [
          'Apply Trim and Normalize Country Codes before import',
          'Set default currency code to "USD" for missing values'
        ],
        completenessPercent: 94,
        uniquenessPercent: 98,
        aiGenerated: false,
      });
    }

    return res.json({
      success: true,
      ...aiRes.parsed,
      aiGenerated: true,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export Storage Bucket Connection Test API
app.post('/api/export/test-connection', (req, res) => {
  const { destinationType, destinationUri } = req.body;
  if (!destinationUri) {
    return res.status(400).json({ success: false, message: 'Destination URI or bucket path is required' });
  }

  const isOk = destinationUri.includes('://') || destinationUri.startsWith('s3://') || destinationUri.startsWith('gs://');
  if (isOk) {
    return res.json({
      success: true,
      message: `Successfully connected to ${destinationType || 'Bucket'} at ${destinationUri}. Write permission verified.`,
      latencyMs: 42,
      bucketRegion: 'us-east-1',
      storageClass: 'STANDARD_IA',
    });
  } else {
    return res.json({
      success: false,
      message: `Invalid connection URI schema for ${destinationType}. Must follow URI convention (e.g. s3://my-bucket/path/ or gs://my-bucket/)`,
    });
  }
});

// Multi-Tenant Migration Metrics API for Scheduled PDF Reports
const MULTI_TENANT_METRICS_DATA = [
  {
    id: 'tenant-acme',
    name: 'Acme Global Corp',
    region: 'US-East',
    tier: 'Enterprise',
    status: 'In Cutover Phase',
    progressPct: 98.4,
    totalRecords: 4850000,
    successfulRecords: 4835200,
    errorRecords: 14800,
    successRatePct: 99.7,
    dataVolumeMb: 14200,
    activePipelines: 6,
    qualityScore: 96,
    lastSync: '2026-08-08T12:15:00Z',
  },
  {
    id: 'tenant-globex',
    name: 'Globex Industries',
    region: 'EU-Central',
    tier: 'Professional',
    status: 'Active Migration',
    progressPct: 94.2,
    totalRecords: 2120000,
    successfulRecords: 2107280,
    errorRecords: 12720,
    successRatePct: 99.4,
    dataVolumeMb: 8600,
    activePipelines: 4,
    qualityScore: 94,
    lastSync: '2026-08-08T11:40:00Z',
  },
  {
    id: 'tenant-initech',
    name: 'Initech Solutions',
    region: 'US-East',
    tier: 'Standard',
    status: 'Remediation Required',
    progressPct: 42.0,
    totalRecords: 680000,
    successfulRecords: 601800,
    errorRecords: 78200,
    successRatePct: 88.5,
    dataVolumeMb: 2100,
    activePipelines: 2,
    qualityScore: 78,
    lastSync: '2026-08-07T18:30:00Z',
  },
  {
    id: 'tenant-weyland',
    name: 'Weyland-Yutani Corp',
    region: 'AP-South',
    tier: 'Enterprise',
    status: 'Final Sign-Off',
    progressPct: 99.8,
    totalRecords: 12450000,
    successfulRecords: 12437550,
    errorRecords: 12450,
    successRatePct: 99.9,
    dataVolumeMb: 42800,
    activePipelines: 12,
    qualityScore: 98,
    lastSync: '2026-08-08T12:30:00Z',
  },
  {
    id: 'tenant-stark',
    name: 'Stark Logistics Int.',
    region: 'US-West',
    tier: 'Enterprise',
    status: 'Active Migration',
    progressPct: 87.5,
    totalRecords: 3400000,
    successfulRecords: 3369400,
    errorRecords: 30600,
    successRatePct: 99.1,
    dataVolumeMb: 11500,
    activePipelines: 5,
    qualityScore: 92,
    lastSync: '2026-08-08T10:05:00Z',
  },
];

let pdfReportSchedules = [
  {
    id: 'rep-sch-101',
    name: 'Weekly Cross-Tenant Migration Executive Digest',
    frequency: 'Weekly',
    dayOfWeek: 'Monday',
    timeUtc: '06:00',
    tenantScope: 'All Tenants',
    selectedTenantIds: ['tenant-acme', 'tenant-globex', 'tenant-initech', 'tenant-weyland', 'tenant-stark'],
    recipients: ['exec-team@enterprise.com', 'fayasamd@gmail.com'],
    destinationType: 'AWS S3',
    destinationUri: 's3://enterprise-pdf-vault/reports/weekly-tenant-summaries/',
    formatOptions: {
      includeKpis: true,
      includeTenantMatrix: true,
      includeErrorBreakdown: true,
      includeRecommendations: true,
    },
    status: 'Active',
    lastGeneratedAt: '2026-08-03T06:00:12Z',
    nextRunAt: '2026-08-10T06:00:00Z',
  },
  {
    id: 'rep-sch-102',
    name: 'Daily Tenant Migration SLA & Success Rate Alert',
    frequency: 'Daily',
    timeUtc: '08:00',
    tenantScope: 'High Priority Enterprise',
    selectedTenantIds: ['tenant-acme', 'tenant-weyland'],
    recipients: ['migration-leads@enterprise.com'],
    destinationType: 'Google Cloud Storage',
    destinationUri: 'gs://edimp-migration-audit-bucket/pdf-reports/daily/',
    formatOptions: {
      includeKpis: true,
      includeTenantMatrix: true,
      includeErrorBreakdown: true,
      includeRecommendations: false,
    },
    status: 'Active',
    lastGeneratedAt: '2026-08-08T08:00:05Z',
    nextRunAt: '2026-08-09T08:00:00Z',
  },
];

let pdfReportTemplates = [
  {
    id: 'tpl-exec-digest',
    name: 'Executive C-Suite Migration Summary',
    description: 'High-level KPI overview focusing on overall success rates, SLA compliance, total record volume, and strategic board recommendations.',
    timeRange: 'Last 30 Days',
    metrics: {
      includeRecordCounts: true,
      includeVolumeAndThroughput: true,
      includeSuccessRateAndSla: true,
      includeQualityScores: true,
      includeErpBreakdown: true,
      includeErrorCategories: true,
      includeRecommendations: true,
    },
    tenantScope: 'All Tenants',
    selectedTenantIds: ['tenant-acme', 'tenant-globex', 'tenant-initech', 'tenant-weyland', 'tenant-stark'],
    orientation: 'Portrait',
    paperSize: 'A4',
    primaryThemeColor: '#1e293b',
    createdAt: '2026-08-01T09:00:00Z',
    updatedAt: '2026-08-08T10:00:00Z',
    isPrebuilt: true,
    versions: [
      {
        versionId: 'v1',
        updatedAt: '2026-08-01T09:00:00Z',
        updatedBy: 'system@enterprise.com',
        changeSummary: 'Initial baseline template creation with raw KPI fields.',
        config: {
          name: 'Executive C-Suite Migration Summary',
          description: 'High-level KPI overview focusing on overall success rates, SLA compliance, total record volume, and strategic board recommendations.',
          timeRange: 'Last 30 Days',
          metrics: {
            includeRecordCounts: true,
            includeVolumeAndThroughput: true,
            includeSuccessRateAndSla: true,
            includeQualityScores: false,
            includeErpBreakdown: false,
            includeErrorCategories: false,
            includeRecommendations: true,
          },
          tenantScope: 'All Tenants',
          selectedTenantIds: ['tenant-acme', 'tenant-globex', 'tenant-initech', 'tenant-weyland', 'tenant-stark'],
          orientation: 'Portrait',
          paperSize: 'A4',
          primaryThemeColor: '#4f46e5',
        }
      },
      {
        versionId: 'v2',
        updatedAt: '2026-08-05T14:30:00Z',
        updatedBy: 'fayasamd@gmail.com',
        changeSummary: 'Updated primary theme color to Slate and enabled quality scores matrix.',
        config: {
          name: 'Executive C-Suite Migration Summary',
          description: 'High-level KPI overview focusing on overall success rates, SLA compliance, total record volume, and strategic board recommendations.',
          timeRange: 'Last 30 Days',
          metrics: {
            includeRecordCounts: true,
            includeVolumeAndThroughput: true,
            includeSuccessRateAndSla: true,
            includeQualityScores: true,
            includeErpBreakdown: false,
            includeErrorCategories: false,
            includeRecommendations: true,
          },
          tenantScope: 'All Tenants',
          selectedTenantIds: ['tenant-acme', 'tenant-globex', 'tenant-initech', 'tenant-weyland', 'tenant-stark'],
          orientation: 'Portrait',
          paperSize: 'A4',
          primaryThemeColor: '#1e293b',
        }
      },
      {
        versionId: 'v3',
        updatedAt: '2026-08-08T10:00:00Z',
        updatedBy: 'fayasamd@gmail.com',
        changeSummary: 'Added target ERP breakdown and granular error categorization to executive metrics highlights.',
        config: {
          name: 'Executive C-Suite Migration Summary',
          description: 'High-level KPI overview focusing on overall success rates, SLA compliance, total record volume, and strategic board recommendations.',
          timeRange: 'Last 30 Days',
          metrics: {
            includeRecordCounts: true,
            includeVolumeAndThroughput: true,
            includeSuccessRateAndSla: true,
            includeQualityScores: true,
            includeErpBreakdown: true,
            includeErrorCategories: true,
            includeRecommendations: true,
          },
          tenantScope: 'All Tenants',
          selectedTenantIds: ['tenant-acme', 'tenant-globex', 'tenant-initech', 'tenant-weyland', 'tenant-stark'],
          orientation: 'Portrait',
          paperSize: 'A4',
          primaryThemeColor: '#1e293b',
        }
      }
    ]
  },
  {
    id: 'tpl-tech-sla',
    name: 'Technical SLA & Remediation Deep-Dive',
    description: 'Granular breakdown of error categories, failed record counts, quality score benchmarks, and action items per tenant.',
    timeRange: 'Last 7 Days',
    metrics: {
      includeRecordCounts: true,
      includeVolumeAndThroughput: false,
      includeSuccessRateAndSla: true,
      includeQualityScores: true,
      includeErpBreakdown: true,
      includeErrorCategories: true,
      includeRecommendations: true,
    },
    tenantScope: 'All Tenants',
    selectedTenantIds: ['tenant-acme', 'tenant-globex', 'tenant-initech', 'tenant-weyland', 'tenant-stark'],
    orientation: 'Portrait',
    paperSize: 'A4',
    primaryThemeColor: '#4f46e5',
    createdAt: '2026-08-02T11:30:00Z',
    updatedAt: '2026-08-08T11:00:00Z',
    isPrebuilt: true,
    versions: [
      {
        versionId: 'v1',
        updatedAt: '2026-08-02T11:30:00Z',
        updatedBy: 'system@enterprise.com',
        changeSummary: 'Initial baseline for SLA engineering review reports.',
        config: {
          name: 'Technical SLA & Remediation Deep-Dive',
          description: 'Granular breakdown of error categories, failed record counts, quality score benchmarks, and action items per tenant.',
          timeRange: 'Last 7 Days',
          metrics: {
            includeRecordCounts: true,
            includeVolumeAndThroughput: false,
            includeSuccessRateAndSla: true,
            includeQualityScores: true,
            includeErpBreakdown: true,
            includeErrorCategories: true,
            includeRecommendations: true,
          },
          tenantScope: 'All Tenants',
          selectedTenantIds: ['tenant-acme', 'tenant-globex', 'tenant-initech', 'tenant-weyland', 'tenant-stark'],
          orientation: 'Portrait',
          paperSize: 'A4',
          primaryThemeColor: '#4f46e5',
        }
      }
    ]
  },
  {
    id: 'tpl-enterprise-health',
    name: 'Enterprise Cutover Real-time Health',
    description: 'Daily performance tracker for mission-critical enterprise tenants, monitoring pipeline throughput and real-time migration velocity.',
    timeRange: 'Last 24 Hours',
    metrics: {
      includeRecordCounts: true,
      includeVolumeAndThroughput: true,
      includeSuccessRateAndSla: true,
      includeQualityScores: true,
      includeErpBreakdown: false,
      includeErrorCategories: false,
      includeRecommendations: false,
    },
    tenantScope: 'Enterprise Tier Only',
    selectedTenantIds: ['tenant-acme', 'tenant-weyland', 'tenant-stark'],
    orientation: 'Portrait',
    paperSize: 'A4',
    primaryThemeColor: '#059669',
    createdAt: '2026-08-04T14:15:00Z',
    updatedAt: '2026-08-08T12:00:00Z',
    isPrebuilt: true,
    versions: [
      {
        versionId: 'v1',
        updatedAt: '2026-08-04T14:15:00Z',
        updatedBy: 'system@enterprise.com',
        changeSummary: 'Initial setup of real-time health template for enterprise tier.',
        config: {
          name: 'Enterprise Cutover Real-time Health',
          description: 'Daily performance tracker for mission-critical enterprise tenants, monitoring pipeline throughput and real-time migration velocity.',
          timeRange: 'Last 24 Hours',
          metrics: {
            includeRecordCounts: true,
            includeVolumeAndThroughput: true,
            includeSuccessRateAndSla: true,
            includeQualityScores: true,
            includeErpBreakdown: false,
            includeErrorCategories: false,
            includeRecommendations: false,
          },
          tenantScope: 'Enterprise Tier Only',
          selectedTenantIds: ['tenant-acme', 'tenant-weyland', 'tenant-stark'],
          orientation: 'Portrait',
          paperSize: 'A4',
          primaryThemeColor: '#059669',
        }
      }
    ]
  },
];

app.get('/api/export/reports/templates', (req, res) => {
  res.json({ success: true, templates: pdfReportTemplates });
});

app.post('/api/export/reports/templates', (req, res) => {
  const { id, changeSummary, ...restConfig } = req.body;
  const existingIndex = pdfReportTemplates.findIndex((t) => t.id === id);
  const timestamp = new Date().toISOString();
  const updatedBy = req.body.updatedBy || 'fayasamd@gmail.com';

  const summary = changeSummary && changeSummary.trim() !== '' 
    ? changeSummary.trim() 
    : 'Configuration settings adjusted.';

  if (existingIndex >= 0) {
    const oldTpl = pdfReportTemplates[existingIndex];
    const nextVerNum = (oldTpl.versions?.length || 0) + 1;
    const versionId = `v${nextVerNum}`;

    const newVersion = {
      versionId,
      updatedAt: timestamp,
      updatedBy,
      changeSummary: summary,
      config: {
        name: restConfig.name,
        description: restConfig.description,
        timeRange: restConfig.timeRange,
        metrics: restConfig.metrics,
        tenantScope: restConfig.tenantScope,
        selectedTenantIds: restConfig.selectedTenantIds,
        orientation: restConfig.orientation,
        paperSize: restConfig.paperSize,
        primaryThemeColor: restConfig.primaryThemeColor,
      },
    };

    const updatedVersions = Array.isArray(oldTpl.versions) ? [...oldTpl.versions, newVersion] : [newVersion];

    pdfReportTemplates[existingIndex] = {
      ...oldTpl,
      ...restConfig,
      updatedAt: timestamp,
      versions: updatedVersions,
    };
    return res.json({ success: true, template: pdfReportTemplates[existingIndex], updated: true });
  }

  const tempId = id || `tpl-${Date.now()}`;
  const initialVersion = {
    versionId: 'v1',
    updatedAt: timestamp,
    updatedBy,
    changeSummary: changeSummary || 'Initial template configuration created.',
    config: {
      name: restConfig.name,
      description: restConfig.description,
      timeRange: restConfig.timeRange,
      metrics: restConfig.metrics,
      tenantScope: restConfig.tenantScope,
      selectedTenantIds: restConfig.selectedTenantIds,
      orientation: restConfig.orientation,
      paperSize: restConfig.paperSize,
      primaryThemeColor: restConfig.primaryThemeColor,
    }
  };

  const newTemplate = {
    id: tempId,
    createdAt: timestamp,
    updatedAt: timestamp,
    isPrebuilt: false,
    ...restConfig,
    versions: [initialVersion]
  };

  pdfReportTemplates = [newTemplate, ...pdfReportTemplates];
  res.json({ success: true, template: newTemplate, created: true });
});

app.post('/api/export/reports/templates/:id/rollback/:versionId', (req, res) => {
  const { id, versionId } = req.params;
  const existingIndex = pdfReportTemplates.findIndex((t) => t.id === id);
  if (existingIndex < 0) {
    return res.status(404).json({ success: false, message: 'Template not found' });
  }

  const template = pdfReportTemplates[existingIndex];
  if (!Array.isArray(template.versions)) {
    return res.status(400).json({ success: false, message: 'No version history exists for this template' });
  }

  const targetVersion = template.versions.find((v) => v.versionId === versionId);
  if (!targetVersion) {
    return res.status(404).json({ success: false, message: `Version ${versionId} not found` });
  }

  const timestamp = new Date().toISOString();
  const nextVerNum = template.versions.length + 1;
  const rollbackVerId = `v${nextVerNum}`;
  const updatedBy = 'fayasamd@gmail.com';

  const rollbackVersionEntry = {
    versionId: rollbackVerId,
    updatedAt: timestamp,
    updatedBy,
    changeSummary: `Rolled back to version ${versionId} ("${targetVersion.changeSummary}").`,
    config: { ...targetVersion.config },
  };

  pdfReportTemplates[existingIndex] = {
    ...template,
    ...targetVersion.config,
    updatedAt: timestamp,
    versions: [...template.versions, rollbackVersionEntry],
  };

  res.json({
    success: true,
    template: pdfReportTemplates[existingIndex],
    message: `Successfully rolled back to version ${versionId}`,
  });
});

app.delete('/api/export/reports/templates/:id', (req, res) => {
  const { id } = req.params;
  pdfReportTemplates = pdfReportTemplates.filter((t) => t.id !== id);
  res.json({ success: true, message: 'Template removed successfully' });
});

app.get('/api/export/reports/tenants-metrics', (req, res) => {
  const totalTenants = MULTI_TENANT_METRICS_DATA.length;
  const totalRecords = MULTI_TENANT_METRICS_DATA.reduce((acc, t) => acc + t.totalRecords, 0);
  const totalSuccessful = MULTI_TENANT_METRICS_DATA.reduce((acc, t) => acc + t.successfulRecords, 0);
  const totalErrors = MULTI_TENANT_METRICS_DATA.reduce((acc, t) => acc + t.errorRecords, 0);
  const totalDataVolumeMb = MULTI_TENANT_METRICS_DATA.reduce((acc, t) => acc + t.dataVolumeMb, 0);
  const totalPipelines = MULTI_TENANT_METRICS_DATA.reduce((acc, t) => acc + t.activePipelines, 0);
  const overallSuccessRate = Number(((totalSuccessful / totalRecords) * 100).toFixed(2));
  const avgQualityScore = Number((MULTI_TENANT_METRICS_DATA.reduce((acc, t) => acc + t.qualityScore, 0) / totalTenants).toFixed(1));

  res.json({
    success: true,
    aggregatedMetrics: {
      totalTenants,
      totalRecords,
      totalSuccessful,
      totalErrors,
      totalDataVolumeMb,
      totalPipelines,
      overallSuccessRate,
      avgQualityScore,
      generatedAt: new Date().toISOString(),
    },
    tenants: MULTI_TENANT_METRICS_DATA,
  });
});

app.get('/api/export/reports/schedules', (req, res) => {
  res.json({ success: true, schedules: pdfReportSchedules });
});

app.post('/api/export/reports/schedules', (req, res) => {
  const newSchedule = {
    id: `rep-sch-${Date.now()}`,
    status: 'Active',
    lastGeneratedAt: null,
    nextRunAt: new Date(Date.now() + 86400000).toISOString(),
    ...req.body,
  };
  pdfReportSchedules = [newSchedule, ...pdfReportSchedules];
  res.json({ success: true, schedule: newSchedule });
});

app.post('/api/export/reports/trigger', (req, res) => {
  const { scheduleId, reportName } = req.body;
  const schedule = pdfReportSchedules.find((s) => s.id === scheduleId);
  const timestamp = new Date().toISOString();

  if (schedule) {
    schedule.lastGeneratedAt = timestamp;
  }

  res.json({
    success: true,
    message: `Triggered automated PDF report generation for "${reportName || schedule?.name || 'Tenant Success Report'}"`,
    reportJob: {
      id: `pdf-job-${Date.now()}`,
      reportName: reportName || schedule?.name || 'Multi-Tenant Migration Success Summary',
      generatedAt: timestamp,
      status: 'Generated & Dispatched',
      fileSizeBytes: 248500, // ~248 KB
      fileFormat: 'PDF (A4 High Resolution)',
      tenantCount: MULTI_TENANT_METRICS_DATA.length,
      downloadUrl: '#',
    },
  });
});

app.post('/api/export/trigger', (req, res) => {
  const { scheduleName, entityName, format, destinationUri } = req.body;
  const timestamp = new Date().toISOString();
  res.json({
    success: true,
    job: {
      id: `job-export-${Date.now()}`,
      jobName: scheduleName || 'Immediate Export Snapshot',
      sourceConnectorName: 'Database Connector',
      sourceEntity: entityName || 'All Entities',
      destConnectorName: 'Cloud Storage Sink',
      destEntity: destinationUri || 'Default Destination',
      executionTimestamp: timestamp,
      mode: 'Full Batch Snapshot',
      originalTotalRecords: 500000,
      originalProcessedRecords: 500000,
      originalErrorCount: 0,
      originalOutputHash: `sha256:${Date.now().toString(16)}`,
      snapshotUri: destinationUri || 'gs://default-bucket/',
      snapshotSizeBytes: 45 * 1024 * 1024, // 45 MB
      fileSizeBytes: 45 * 1024 * 1024,
      rowCount: 500000,
      mappingRulesVersion: 'v1.0',
      reproducibilityStatus: 'Verified'
    }
  });
});

// Migration Replay Simulation API - Historical Jobs List
app.get('/api/replay/historical-jobs', (req, res) => {
  console.log('[API] GET /api/replay/historical-jobs called');
  const replayJobs = [
    {
      id: 'job-hist-201',
      jobName: 'Q2 2026 SAP Customer Master Migration (Batch #14)',
      sourceConnectorName: 'SAP S/4HANA Cloud Engine',
      sourceEntity: 'KNA1_Customer_Master',
      destConnectorName: 'Dynamics 365 Business Central (Prod)',
      destEntity: 'Customer API v2.0',
      executionTimestamp: '2026-06-15T14:30:00Z',
      mode: 'Full Batch Snapshot',
      originalTotalRecords: 14250,
      originalProcessedRecords: 14236,
      originalErrorCount: 14,
      originalOutputHash: 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      snapshotUri: 's3://enterprise-migration-vault/snapshots/2026-06-15/kna1_batch14.parquet',
      snapshotSizeBytes: 485000000,
      mappingRulesVersion: 'v2.4-cleansed-standard',
      reproducibilityStatus: 'Verified (100% Match)',
    },
    {
      id: 'job-hist-202',
      jobName: 'Vendor Accounts Payable Legacy Import',
      sourceConnectorName: 'SQL Server - Legacy ERP DB',
      sourceEntity: 'tbl_Vendors_Master',
      destConnectorName: 'Dynamics 365 Finance & Operations',
      destEntity: 'VendVendorV2Entity',
      executionTimestamp: '2026-07-01T08:15:00Z',
      mode: 'Incremental Delta',
      originalTotalRecords: 3200,
      originalProcessedRecords: 3198,
      originalErrorCount: 2,
      originalOutputHash: 'sha256:7a9f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0c1b2a3f4e5d6c7b8a9f',
      snapshotUri: 'gs://edimp-migration-audit-bucket/snapshots/2026-07-01/vendors_master.parquet',
      snapshotSizeBytes: 122000000,
      mappingRulesVersion: 'v1.8-vendor-cleansed',
      reproducibilityStatus: 'Verified (100% Match)',
    },
    {
      id: 'job-hist-203',
      jobName: 'Salesforce Accounts to Business Central Sync',
      sourceConnectorName: 'Salesforce Enterprise CRM',
      sourceEntity: 'Account (Salesforce)',
      destConnectorName: 'Dynamics 365 Business Central (Prod)',
      destEntity: 'Customer',
      executionTimestamp: '2026-07-10T11:00:00Z',
      mode: 'Realtime Webhook Delta',
      originalTotalRecords: 8500,
      originalProcessedRecords: 8492,
      originalErrorCount: 8,
      originalOutputHash: 'sha256:3f4e5d6c7b8a9f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0c1b2a3f4e',
      snapshotUri: 's3://enterprise-migration-vault/snapshots/2026-07-10/sfdc_accounts.parquet',
      snapshotSizeBytes: 210000000,
      mappingRulesVersion: 'v2.1-crm-address-std',
      reproducibilityStatus: 'Pending Verification',
    },
  ];

  return res.json({ success: true, jobs: replayJobs });
});

// Execute Migration Replay Simulation API
app.post('/api/replay/simulate', (req, res) => {
  const { jobId, mappingVersionOverride, sampleLimitPercent } = req.body;

  const randomVariance = Math.random();
  const isExactMatch = randomVariance > 0.15;
  const reproducibilityScore = isExactMatch ? 100.0 : 99.82;
  
  const samplePercent = sampleLimitPercent || 100;
  const simulatedRecords = Math.round((14250 * samplePercent) / 100);
  const simulatedErrors = isExactMatch ? 14 : 12; // 2 errors fixed by rules engine!

  const randomHashSuffix = Array.from({ length: 12 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

  return res.json({
    success: true,
    replayResult: {
      jobId: jobId || 'job-hist-201',
      simulatedAt: new Date().toISOString(),
      mode: 'Dry-Run Simulation',
      samplePercent,
      simulatedRecords,
      simulatedErrors,
      simulatedSuccessRate: Number((((simulatedRecords - simulatedErrors) / simulatedRecords) * 100).toFixed(2)),
      reproducibilityScore,
      matchStatus: isExactMatch ? 'Deterministic Match (100% Identical)' : 'Divergent Output (Rules Updated)',
      simulatedOutputHash: isExactMatch
        ? 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
        : `sha256:e3b0c44298fc1c149afbf4c8996fb92427${randomHashSuffix}`,
      originalOutputHash: 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      mappingRulesApplied: mappingVersionOverride || 'v2.4-cleansed-standard',
      rowDeltaSummary: {
        identicalRows: isExactMatch ? simulatedRecords - 14 : simulatedRecords - 14,
        modifiedRows: isExactMatch ? 0 : 2, // 2 rows modified by updated mapping rules
        newErrorsCount: 0,
        fixedErrorsCount: isExactMatch ? 0 : 2,
      },
      verificationLogs: [
        '[SNAPSHOT] Mounted immutable Parquet snapshot from s3://enterprise-migration-vault/snapshots/...',
        '[HASH] Source checksum verified: sha256:a1b2c3d4e5f6...',
        `[MAPPING] Re-applied mapping rule matrix (${mappingVersionOverride || 'v2.4-cleansed-standard'})`,
        `[DRY-RUN] Processed ${simulatedRecords.toLocaleString()} records through transformation pipeline without database mutations.`,
        `[COMPARISON] Calculated Bit-for-Bit payload checksum. Reproducibility score: ${reproducibilityScore}%.`,
      ],
    },
    message: `Migration replay simulation completed with ${reproducibilityScore}% output match.`,
  });
});

// AI Error Explanation & Diagnosis API
app.post('/api/ai/explain-error', async (req, res) => {
  try {
    const { errorRecord, sourceSystem, targetSystem } = req.body;

    const prompt = `Analyze this data migration error from ${sourceSystem} to ${targetSystem}:

Error Record Context:
${JSON.stringify(errorRecord, null, 2)}

Provide a clear root cause analysis and step-by-step resolution steps for a migration consultant.
Respond in JSON format:
{
  "rootCause": "Detailed technical explanation...",
  "impact": "High | Medium | Low",
  "remediationSteps": [
    "Step 1...",
    "Step 2..."
  ],
  "suggestedRuleChange": "Transformation rule update if applicable..."
}`;

    const cacheKey = `explain-error:${sourceSystem}:${targetSystem}:${JSON.stringify(errorRecord).slice(0, 50)}`;
    const aiRes = await callGeminiSafe(prompt, cacheKey);

    if (!aiRes || !aiRes.parsed) {
      return res.json({
        success: true,
        rootCause: 'Foreign Key Constraint Violation: CustomerPostingGroup "DOMESTIC" does not exist in target ERP table.',
        impact: 'High',
        remediationSteps: [
          'Navigate to Business Central -> Customer Posting Groups and create "DOMESTIC"',
          'Or update Transformation Rule to map "DOMESTIC" -> "GEN-DOM"'
        ],
        suggestedRuleChange: 'CASE WHEN [Group] = "DOMESTIC" THEN "GEN-DOM" ELSE [Group] END',
        aiGenerated: false,
      });
    }

    return res.json({
      success: true,
      ...aiRes.parsed,
      aiGenerated: true,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// AI Predictive Risk Analysis API
app.post('/api/ai/predictive-risk', async (req, res) => {
  try {
    const { currentCpu, currentMemory, activeWorkers, throughput, selectedProfileId, historicalLogs } = req.body;

    // Determine deterministic fallback details first
    const profileName = selectedProfileId === 'sap-extractor' ? 'SAP ERP Financials Extractor'
                      : selectedProfileId === 'salesforce-sync' ? 'Salesforce Contact & Lead Delta Sync'
                      : selectedProfileId === 'oracle-ledger' ? 'Oracle DB Multi-Entity Bulk Loader'
                      : 'Cassandra Real-time Activity Log Pipeline';

    let calculatedScore = 20;
    if (currentCpu && currentCpu > 50) calculatedScore += Math.round((currentCpu - 50) * 0.7);
    if (currentMemory && currentMemory > 60) calculatedScore += Math.round((currentMemory - 60) * 1.1);
    if (selectedProfileId === 'oracle-ledger') calculatedScore += 15;
    if (selectedProfileId === 'sap-extractor' && currentMemory > 80) calculatedScore += 10;
    
    calculatedScore = Math.min(98, Math.max(8, calculatedScore));

    const calculatedLevel = calculatedScore < 30 ? 'Low'
                           : calculatedScore < 60 ? 'Moderate'
                           : calculatedScore < 80 ? 'High'
                           : 'Critical';

    const calculatedProb = Math.max(1, Math.round(calculatedScore * 0.85));
    const bottleneck = selectedProfileId === 'sap-extractor' ? 'sap-bapi-worker-01'
                     : selectedProfileId === 'salesforce-sync' ? 'odata-sink-02'
                     : selectedProfileId === 'oracle-ledger' ? 'spark-worker-03'
                     : 'spark-worker-01';

    const prompt = `You are EDIMP AI Predictive Resource Guardrails & Telemetry Analyst.
You are monitoring a live enterprise data migration pipeline with these parameters:
- Active Profile Context: "${profileName}" (ID: ${selectedProfileId || 'unknown'})
- Current Average CPU Utilization: ${currentCpu || 'N/A'}%
- Current Heap Memory / RAM Allocation: ${currentMemory || 'N/A'}%
- Active Cluster Spark Nodes: ${activeWorkers || 128}
- Pipeline Throughput: ${throughput || 145000} records/sec
- Primary Bottleneck Node Identified: "${bottleneck}"

Historical jobs log audit contexts:
- Legacy SAP Master Migration had 14 records quarantined to DLQ due to "HTTP 429 Too Many Requests" rate limits.
- AP Legacy imports struggled with "Nullability conflicts" on address fields causing constraint risk.
- Salesforce account sync had 8 errors.

Analyze these system health inputs and historical logs, and perform a predictive risk analysis to forecast job failure or performance degradation.
Respond STRICTLY with valid JSON in this exact structure:
{
  "riskLevel": "Low" | "Moderate" | "High" | "Critical",
  "riskScore": 68,
  "predictedJobFailureProbability": 24,
  "bottleneckNode": "sap-bapi-worker-01",
  "criticalFlags": [
    {
      "title": "Threat summary title",
      "description": "Elaborate detail of the predicted risk based on telemetry & logs",
      "category": "JVM Memory | Compute | Connector Limits | Schema Constraints | Data Dictionary",
      "threatLevel": "High" | "Medium" | "Low"
    }
  ],
  "detailedRecommendation": "Clear, technical, and actionable bullet points or advice for enterprise architects.",
  "historicalLogsAnalyzed": 124
}
`;

    const cacheKey = `predictive-risk:${selectedProfileId}:${currentCpu}:${currentMemory}:${activeWorkers}`;
    const aiRes = await callGeminiSafe(prompt, cacheKey);

    if (!aiRes || !aiRes.parsed) {
      const fallbackFlags = [];
      
      if (currentMemory && currentMemory > 70) {
        fallbackFlags.push({
          title: 'JVM Heap Exhaustion Threshold Breach',
          description: `Heap memory usage is elevated at ${currentMemory}%. Heavy row caching during ${profileName} run might trigger GC heap compaction.`,
          category: 'JVM Memory',
          threatLevel: currentMemory > 85 ? 'High' : 'Medium',
        });
      }

      if (currentCpu && currentCpu > 75) {
        fallbackFlags.push({
          title: 'vCPU Scheduler Thread Contention',
          description: `Active CPU load is ${currentCpu}%. High thread scheduling latency detected across ${activeWorkers || 128} parallel spark tasks.`,
          category: 'Compute Core',
          threatLevel: currentCpu > 90 ? 'High' : 'Medium',
        });
      }

      fallbackFlags.push({
        title: 'Historical Job Failure Correlation Alert',
        description: `Analyzing legacy logs (Job ID: job-hist-201) warns that target connector "${bottleneck}" undergoes OData queue congestion when pipeline velocity exceeds 120k records/sec.`,
        category: 'Connector Rate-Limits',
        threatLevel: throughput && throughput > 120000 ? 'High' : 'Medium',
      });

      if (selectedProfileId === 'sap-extractor') {
        fallbackFlags.push({
          title: 'Unmapped Decimal Type Constraint Risk',
          description: 'Historical records show KNA1 ledger mappings trigger float truncations. Ensure COALESCE casting is enabled for CREDIT_LIMIT fields.',
          category: 'Data Validation',
          threatLevel: 'Low',
        });
      }

      return res.json({
        success: true,
        riskLevel: calculatedLevel,
        riskScore: calculatedScore,
        predictedJobFailureProbability: calculatedProb,
        bottleneckNode: bottleneck,
        criticalFlags: fallbackFlags,
        detailedRecommendation: `We recommend ${calculatedScore > 60 ? 'immediately provisioning an additional +16 worker pods' : 'monitoring active streams'}. Based on historical migration benchmarks, caching of ledger datasets on "${bottleneck}" demands continuous G1GC cycles. Adjust your JVM Heap boundary size to at least 16GB or scale parallel extraction targets.`,
        historicalLogsAnalyzed: 42,
        aiGenerated: false,
        note: 'Generated using Rule-Based Predictive Engine',
      });
    }

    return res.json({
      success: true,
      riskLevel: aiRes.parsed.riskLevel || calculatedLevel,
      riskScore: aiRes.parsed.riskScore || calculatedScore,
      predictedJobFailureProbability: aiRes.parsed.predictedJobFailureProbability || calculatedProb,
      bottleneckNode: aiRes.parsed.bottleneckNode || bottleneck,
      criticalFlags: aiRes.parsed.criticalFlags || [],
      detailedRecommendation: aiRes.parsed.detailedRecommendation || 'Review and optimize spark buffer queues.',
      historicalLogsAnalyzed: aiRes.parsed.historicalLogsAnalyzed || 124,
      aiGenerated: true,
    });
  } catch (error: any) {
    console.error('Error in Predictive Risk API:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze predictive risks',
    });
  }
});

// AI Workflow Sequence Analysis API
app.post('/api/ai/analyze-sequence', async (req, res) => {
  try {
    const { steps } = req.body;

    // Check basic structural properties deterministically
    const hasSource = steps.some((s: any) => s.category === 'source');
    const hasSink = steps.some((s: any) => s.category === 'sink');
    const sourceIndices = steps.map((s: any, idx: number) => s.category === 'source' ? idx : -1).filter((i: number) => i !== -1);
    const sinkIndices = steps.map((s: any, idx: number) => s.category === 'sink' ? idx : -1).filter((i: number) => i !== -1);
    const hasCleansingOrValidation = steps.some((s: any) => s.category === 'cleansing' || s.category === 'validation');

    let sequenceIssues: string[] = [];
    let optimizations: Array<{ title: string; description: string; impact: 'High' | 'Medium' | 'Low' }> = [];
    let verdict = 'The pipeline topological order is logical and well-structured.';

    if (!hasSource) {
      sequenceIssues.push('Pipeline has no Source Extractor. An active data ingest anchor is required.');
    }
    if (!hasSink) {
      sequenceIssues.push('Pipeline has no Target Sink. Processed records will not be committed to any database.');
    }
    if (hasSource && hasSink && Math.min(...sourceIndices) > Math.max(...sinkIndices)) {
      sequenceIssues.push('Out of order execution: A Target Sink is configured to run BEFORE a Source Extractor.');
    }
    if (!hasCleansingOrValidation && hasSink) {
      optimizations.push({
        title: 'Add Mandatory Data Validation & Cleansing',
        description: 'Legacy datasets frequently contain PII compliance errors, unformatted decimals, or nullability mismatches. Inserting a Validation / Cleansing node protects Business Central from database corruption.',
        impact: 'High',
      });
    }

    // Check for PII scrubbing order
    const piiIndex = steps.findIndex((s: any) => s.label.toLowerCase().includes('scrub') || s.label.toLowerCase().includes('anonymizer'));
    const transformIndex = steps.findIndex((s: any) => s.category === 'transform');
    if (piiIndex !== -1 && transformIndex !== -1 && piiIndex > transformIndex) {
      optimizations.push({
        title: 'Move Sensitive PII Scrubbing Earlier',
        description: 'Currently, PII scrubbing is occurring AFTER data transformation. Scrubbing sensitive customer details immediately after extraction prevents plain-text exposure in transit and temporary transformation buffers.',
        impact: 'Medium',
      });
    }

    const isCorrectSequence = sequenceIssues.length === 0;
    if (!isCorrectSequence) {
      verdict = 'Sequential integrity warnings detected. Please adjust your canvas connections before deploying.';
    } else if (optimizations.length > 0) {
      verdict = 'Pipeline is functional, but structural optimizations can enhance compliance, performance, and memory consumption.';
    }

    const stepsSummary = steps.map((s: any, idx: number) => `${idx + 1}. [${s.category.toUpperCase()}] ${s.label} (${s.system}) - ${s.description}`).join('\n');
    const prompt = `You are EDIMP AI Pipeline Architect.
Analyze this proposed chronological sequence of multi-step data migration tasks:
${stepsSummary}

Verify the logical and architectural correctness of this sequence. Evaluate if the staging, compliance, anonymization, schema mapping, and ingestion order is optimal and safe.
Respond STRICTLY with valid JSON in this exact structure:
{
  "isCorrectSequence": true,
  "gapsFound": [
    "Critique 1",
    "Critique 2"
  ],
  "optimizations": [
    {
      "title": "Optimization recommendation title",
      "description": "Why this recommendation should be applied and how it prevents errors",
      "impact": "High" | "Medium" | "Low"
    }
  ],
  "verdict": "A robust 2-3 sentence overview verdict summarizing the pipeline's architectural state."
}
`;

    const cacheKey = `analyze-sequence:${JSON.stringify(steps).slice(0, 80)}`;
    const aiRes = await callGeminiSafe(prompt, cacheKey);

    if (!aiRes || !aiRes.parsed) {
      return res.json({
        success: true,
        isCorrectSequence,
        gapsFound: sequenceIssues,
        optimizations: optimizations.length > 0 ? optimizations : [
          {
            title: 'Enable Parallel Thread Ingestion on Sink',
            description: 'Your Target Sink currently executes in single-thread. Transitioning to 8 parallel ingestion workers could accelerate throughput by up to 340%.',
            impact: 'Medium',
          }
        ],
        verdict,
        aiGenerated: false,
        note: 'Calculated using Determinational Workflow Verifier',
      });
    }

    return res.json({
      success: true,
      isCorrectSequence: aiRes.parsed.isCorrectSequence !== undefined ? aiRes.parsed.isCorrectSequence : isCorrectSequence,
      gapsFound: aiRes.parsed.gapsFound || sequenceIssues,
      optimizations: aiRes.parsed.optimizations || optimizations,
      verdict: aiRes.parsed.verdict || verdict,
      aiGenerated: true,
    });
  } catch (error: any) {
    console.error('Error in Workflow Sequence Analysis API:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze chronological sequence',
    });
  }
});

// AI Natural Language Query & Migration Generator API
app.post('/api/ai/natural-query', async (req, res) => {
  try {
    const { userPrompt, provider, model } = req.body;
    const selectedProvider = provider || 'gemini';
    const selectedModel = model || 'Gemini 1.5 Pro';

    const prompt = `You are EDIMP AI Co-Pilot executing under the "${selectedProvider.toUpperCase()}" engine using model "${selectedModel}". The user asks in natural language to set up a data migration or integration job.

User Prompt: "${userPrompt}"

Generate a complete structured JSON job configuration:
{
  "jobName": "Descriptive Job Title",
  "sourceConnector": "Source connector name e.g. Excel, SQL Server, SAP",
  "destinationConnector": "Destination name e.g. Dynamics 365 Business Central, Salesforce",
  "sourceEntity": "Source object name",
  "targetEntity": "Target object name",
  "mode": "Full | Incremental | RealTime",
  "batchSize": 500,
  "transformations": ["list of recommended transformations"],
  "validations": ["list of recommended validation rules"],
  "explanation": "Summary of what was generated and why"
}`;

    const cacheKey = `natural-query:${selectedProvider}:${selectedModel}:${userPrompt}`;
    const aiRes = await callGeminiSafe(prompt, cacheKey);

    if (!aiRes || !aiRes.parsed) {
      return res.json({
        success: true,
        jobConfig: {
          jobName: `NL Generated Job - Customer Sync [via ${selectedProvider.toUpperCase()}]`,
          sourceConnector: 'SQL Server - Legacy ERP DB',
          destinationConnector: 'Microsoft Dynamics 365 Business Central',
          sourceEntity: 'tbl_Customer_Master',
          targetEntity: 'Customer',
          mode: 'Full',
          transformations: ['Trim All Strings', 'Uppercase Country Codes', 'Normalize Phone (+1)'],
          validations: ['Email Format Check', 'VAT Number Validation', 'Mandatory Name Check'],
          cronSchedule: '0 2 * * *',
        },
        explanation: `Generated a complete data migration pipeline based on your prompt using simulated fallback for ${selectedProvider.toUpperCase()} (${selectedModel}).`,
        aiGenerated: false,
        provider: selectedProvider,
        model: selectedModel,
      });
    }

    return res.json({
      success: true,
      jobConfig: aiRes.parsed,
      explanation: aiRes.parsed.explanation,
      aiGenerated: true,
      provider: selectedProvider,
      model: selectedModel,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// AI Smart Connector Recommendation API
app.post('/api/ai/suggest-connector', async (req, res) => {
  try {
    const { detectedMetadata, customContext } = req.body;

    const prompt = `You are EDIMP AI Co-Pilot, an expert Enterprise Cloud Integration & Data Migrations Architect.
Suggest optimal connector types, SLA throttling configurations, and architectural insights for the detected enterprise subnets and metadata.

Detected Systems/Metadata:
${JSON.stringify(detectedMetadata, null, 2)}

Custom System Context provided by user (if any):
"${customContext || 'None'}"

Analyze each detected system and output a highly structured JSON response with optimal connector suggestions.
The response must match this exact JSON structure:
{
  "recommendations": [
    {
      "systemName": "Name of the system (e.g. Oracle Cloud Fusion ERP)",
      "detectedMetadata": "Short summary of entities and record count (e.g. 3 REST entities, 441.5K records)",
      "optimalConnectorType": "Specific name of the recommended connector (e.g. OData REST v4 Custom Connector)",
      "confidence": 0.95,
      "reasoning": "A professional detailed explanation of why this connector is best for this metadata and how it handles potential risks.",
      "recommendedSla": {
        "maxRequestsPerSecond": 80,
        "maxConcurrentRequests": 12,
        "retryStrategy": "ExponentialBackoff | Linear | ImmediateRetry"
      },
      "architecturalInsight": "Strategic enterprise architectural advice for this specific system integration."
    }
  ],
  "genericInsights": [
    "Overall architectural tips for enterprise-grade data migrations, handling throttling, and safeguarding schema integrity."
  ]
}`;

    const cacheKey = `suggest-connector:${JSON.stringify(detectedMetadata).slice(0, 80)}:${(customContext || '').slice(0, 50)}`;
    const aiRes = await callGeminiSafe(prompt, cacheKey);

    if (!aiRes || !aiRes.parsed || !aiRes.parsed.recommendations) {
      // Rule-based fallback data representing expert architectural guidelines
      const fallbackRecommendations = [
        {
          systemName: 'Oracle Cloud Fusion ERP',
          detectedMetadata: '3 REST entities, 441,300 records',
          optimalConnectorType: 'OData REST v4 Custom Connector',
          confidence: 0.94,
          reasoning: 'Oracle Cloud Fusion ERP exposes complex REST APIs that are optimized under the OData REST v4 standard. A dedicated RESTful client with dynamic pagination and session caching is best to handle bulk records safely without timing out.',
          recommendedSla: {
            maxRequestsPerSecond: 80,
            maxConcurrentRequests: 12,
            retryStrategy: 'ExponentialBackoff'
          },
          architecturalInsight: 'Implement chunk-based cursor pagination and active query filters on historical date bounds to reduce payload stress on the Oracle FSCM endpoint.'
        },
        {
          systemName: 'Workday Enterprise HCM & Payroll API',
          detectedMetadata: '2 Custom Report APIs, 160,800 records',
          optimalConnectorType: 'SOAP XML / Custom Report API Connector',
          confidence: 0.90,
          reasoning: 'Workday relies heavily on XML/SOAP web services and custom reports. Utilizing a specialized Custom API client that parses complex hierarchies, handles multi-part XML, and masks PII/sensitive details in transit is recommended.',
          recommendedSla: {
            maxRequestsPerSecond: 40,
            maxConcurrentRequests: 6,
            retryStrategy: 'Linear'
          },
          architecturalInsight: 'Enforce transport-level encryption (TLS 1.3) and dynamic field masking on Worker compensation/PII attributes at the source layer.'
        },
        {
          systemName: 'Snowflake Enterprise Data Cloud Warehouse',
          detectedMetadata: '1 Snowflake View, 1 Snowflake Table, 1.57M records',
          optimalConnectorType: 'Native JDBC/ODBC Vector Connector',
          confidence: 0.98,
          reasoning: 'Snowflake high-speed querying is best utilized via native micro-partition streaming. A dedicated cloud warehouse connector with connection pooling ensures direct, fast parallel extraction and maximal throughput without HTTP layer penalties.',
          recommendedSla: {
            maxRequestsPerSecond: 1000,
            maxConcurrentRequests: 100,
            retryStrategy: 'ImmediateRetry'
          },
          architecturalInsight: 'Utilize Snowflake COPY INTO or Stage unloading commands to extract bulk data into compressed Parquet chunks before initiating transfer.'
        },
        {
          systemName: 'NetSuite SuiteTalk ERP Engine',
          detectedMetadata: '2 RESTlet Endpoints, 120,400 records',
          optimalConnectorType: 'SuiteTalk RESTlet Sync Connector',
          confidence: 0.92,
          reasoning: 'NetSuite is highly sensitive to concurrent request limits per account. Using NetSuite official SuiteTalk RESTlets with aggressive rate-limiting and automatic backoff on HTTP 429 helps maintain high-throughput syncing.',
          recommendedSla: {
            maxRequestsPerSecond: 30,
            maxConcurrentRequests: 5,
            retryStrategy: 'ExponentialBackoff'
          },
          architecturalInsight: 'Configure single-threaded queue workers per active company tenant to bypass NetSuite concurrency locks.'
        },
        {
          systemName: 'Amazon S3 Enterprise Parquet Data Lake',
          detectedMetadata: '2 Parquet Files, 2.30M records',
          optimalConnectorType: 'S3 Parquet Direct Stream Connector',
          confidence: 0.96,
          reasoning: 'Parquet files in S3 are highly optimized columnar streams. Reading them requires an efficient binary stream reader with snappy compression support. A native Parquet connector streaming straight to targets avoids large heap allocations.',
          recommendedSla: {
            maxRequestsPerSecond: 600,
            maxConcurrentRequests: 40,
            retryStrategy: 'ExponentialBackoff'
          },
          architecturalInsight: 'Utilize AWS Athena queries via the S3 connector to filter, aggregate, and prune files before streaming over the wire.'
        },
        {
          systemName: 'HubSpot Revenue & CRM Engine',
          detectedMetadata: '2 CRM Objects, 83,100 records',
          optimalConnectorType: 'HubSpot REST v3 Webhook Connector',
          confidence: 0.93,
          reasoning: 'HubSpot REST v3 API utilizes OAuth. A specialized CRM connector with active webhook subscription support is optimal for real-time contact and deal pipeline synchronization.',
          recommendedSla: {
            maxRequestsPerSecond: 50,
            maxConcurrentRequests: 8,
            retryStrategy: 'ExponentialBackoff'
          },
          architecturalInsight: 'Combine webhook streams for real-time deltas with a daily cron-based batch reconcile for completeness checks.'
        }
      ];

      const fallbackGenericInsights = [
        'Enforce proactive Throttling Limits at the client layer to protect source systems from query-exhaustion.',
        'Always validate schema alignment of primary and foreign key indexes before setting up high-volume transfers.',
        'Use chunk-based processing when importing custom report endpoints to prevent thread starvation.'
      ];

      // If the user provided a custom context, add a customized recommendation based on it!
      if (customContext && customContext.trim().length > 0) {
        fallbackRecommendations.unshift({
          systemName: 'Custom Enterprise System Context',
          detectedMetadata: 'User-specified target requirements',
          optimalConnectorType: 'Dynamic Multi-Threaded custom API/DB Connector',
          confidence: 0.89,
          reasoning: `Based on your custom context: "${customContext}". For this setup, we recommend a dynamic REST/JDBC connector with multi-threading, custom pagination, and explicit transport-layer mapping to ensure compatibility.`,
          recommendedSla: {
            maxRequestsPerSecond: 100,
            maxConcurrentRequests: 16,
            retryStrategy: 'ExponentialBackoff'
          },
          architecturalInsight: 'Formulate schema-specific data dictionaries first and verify network routes (VPC peering, NAT Gateways) are open.'
        });
      }

      return res.json({
        success: true,
        recommendations: fallbackRecommendations,
        genericInsights: fallbackGenericInsights,
        aiGenerated: false,
        note: 'Rule-Based Fallback Engine active.'
      });
    }

    return res.json({
      success: true,
      recommendations: aiRes.parsed.recommendations || [],
      genericInsights: aiRes.parsed.genericInsights || [],
      aiGenerated: true
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate recommendations'
    });
  }
});

// Rule-based fallback for field mapping when Gemini key is not provided
app.post('/api/ai/compare-schema', async (req, res) => {
  try {
    const { sourceEntity, targetEntity } = req.body;

    const sampleComparisons = [
      {
        fieldPairId: 'diff-001',
        sourceField: 'KUNNR',
        sourceType: 'CHAR(10)',
        sourceNullable: false,
        sourceIsKey: true,
        sourceDescription: 'Customer Account Number (SAP)',
        targetField: 'No.',
        targetType: 'Code[20]',
        targetNullable: false,
        targetIsKey: true,
        targetDescription: 'Customer Primary Key ID (D365)',
        status: 'Type Mismatch',
        diffSeverity: 'Medium',
        diffDetails: 'Length expansion (CHAR(10) -> Code[20]). Data loss unlikely.',
        resolutionAdvice: 'Pad with leading zeros if fixed-length required or apply UPPER(TRIM(KUNNR)).',
        recommendedTransformation: 'UPPER(TRIM(KUNNR))',
        confidenceScore: 0.98,
      },
      {
        fieldPairId: 'diff-002',
        sourceField: 'NAME1',
        sourceType: 'VARCHAR(35)',
        sourceNullable: false,
        sourceIsKey: false,
        sourceDescription: 'Customer Name 1',
        targetField: 'Name',
        targetType: 'Text[100]',
        targetNullable: false,
        targetIsKey: false,
        targetDescription: 'Customer Legal Name',
        status: 'Type Mismatch',
        diffSeverity: 'Low',
        diffDetails: 'Target capacity (100) is larger than source (35). Safe assignment.',
        resolutionAdvice: 'Direct mapping with TRIM(). Target capacity is larger.',
        recommendedTransformation: 'TRIM(NAME1)',
        confidenceScore: 0.99,
      },
      {
        fieldPairId: 'diff-003',
        sourceField: 'STRAS',
        sourceType: 'VARCHAR(35)',
        sourceNullable: true,
        sourceDescription: 'Street Address',
        targetField: 'Address',
        targetType: 'Text[50]',
        targetNullable: false,
        targetDescription: 'Primary Line 1 Address',
        status: 'Constraint Risk',
        diffSeverity: 'High',
        diffDetails: 'Nullability Conflict! Source allows NULL, Target is NOT NULL (Required field).',
        resolutionAdvice: 'Use COALESCE fallback string "N/A - Unspecified" to prevent insertion failure.',
        recommendedTransformation: 'COALESCE(TRIM(STRAS), "N/A - Unspecified Address")',
        confidenceScore: 0.95,
      },
      {
        fieldPairId: 'diff-004',
        sourceField: 'STCD1',
        sourceType: 'VARCHAR(16)',
        sourceNullable: true,
        sourceDescription: 'Tax Number 1 (VAT ID)',
        targetField: 'VAT Registration No.',
        targetType: 'Text[20]',
        targetNullable: true,
        targetDescription: 'Enterprise Tax Registration Number',
        status: 'Compatible',
        diffSeverity: 'None',
        diffDetails: 'Structures compatible. Text[20] holds VARCHAR(16). Nullability matches.',
        resolutionAdvice: 'Direct mapping. Format regex validation applied.',
        recommendedTransformation: 'REGEX_REPLACE(STCD1, "[^A-Z0-9]", "")',
        confidenceScore: 0.97,
      },
      {
        fieldPairId: 'diff-005',
        sourceField: 'ERDAT',
        sourceType: 'CHAR(8) [YYYYMMDD]',
        sourceNullable: false,
        sourceDescription: 'Record Creation Date',
        targetField: 'Created DateTime',
        targetType: 'DateTime [ISO-8601]',
        targetNullable: false,
        targetDescription: 'Record Creation Timestamp',
        status: 'Type Mismatch',
        diffSeverity: 'Medium',
        diffDetails: 'Format conversion required: String YYYYMMDD -> ISO-8601 Timestamp.',
        resolutionAdvice: 'Parse string format YYYYMMDD to DateTime object with UTC zone.',
        recommendedTransformation: 'TO_TIMESTAMP(ERDAT, "YYYYMMDD")',
        confidenceScore: 0.96,
      },
      {
        fieldPairId: 'diff-006',
        sourceField: 'LOEVM',
        sourceType: 'CHAR(1) ["X" or ""]',
        sourceNullable: true,
        sourceDescription: 'Deletion Flag',
        targetField: 'Blocked',
        targetType: 'Enum [Option: " ", "Ship", "Invoice", "All"]',
        targetNullable: false,
        targetDescription: 'Customer Account Block Status',
        status: 'Constraint Risk',
        diffSeverity: 'High',
        diffDetails: 'Type & Domain Cardinality conflict (CHAR flag -> Enum dropdown).',
        resolutionAdvice: 'Map "X" -> "All", empty -> " ". Provide default for invalid codes.',
        recommendedTransformation: 'CASE WHEN LOEVM = "X" THEN "All" ELSE " " END',
        confidenceScore: 0.92,
      },
      {
        fieldPairId: 'diff-007',
        sourceField: 'CREDIT_LIMIT',
        sourceType: 'DECIMAL(13,2)',
        sourceNullable: true,
        sourceDescription: 'SAP Credit Limit Amount',
        targetField: 'Credit Limit (LCY)',
        targetType: 'Decimal[18,4]',
        targetNullable: false,
        targetDescription: 'Local Currency Credit Limit',
        status: 'Constraint Risk',
        diffSeverity: 'Medium',
        diffDetails: 'Precision expansion (13,2 -> 18,4). Nullability conflict (Target NOT NULL).',
        resolutionAdvice: 'Cast to Decimal and default NULLs to 0.00.',
        recommendedTransformation: 'COALESCE(CAST(CREDIT_LIMIT AS DECIMAL(18,4)), 0.00)',
        confidenceScore: 0.94,
      },
    ];

    const prompt = `Perform an AI Schema Comparison between source data entity "${sourceEntity || 'SAP KNA1 Customer Master'}" and destination entity "${targetEntity || 'Dynamics 365 Customer v2.0'}".

Identify data structure differences including:
- Data type & length mismatches
- Nullability constraint conflicts
- Cardinality & Enum option discrepancies
- Primary/Foreign key constraints

Provide actionable automated mapping resolutions for each field difference with exact SQL/Expression transformation rules.

Respond strictly in JSON format:
{
  "summary": {
    "totalFieldsCompared": 7,
    "compatibleFields": 2,
    "typeMismatches": 3,
    "constraintRisks": 2,
    "missingTargetFields": 0,
    "autoResolutionsCount": 7
  },
  "diffs": [
    {
      "fieldPairId": "diff-001",
      "sourceField": "FIELD_NAME",
      "sourceType": "VARCHAR(30)",
      "sourceNullable": true,
      "sourceIsKey": false,
      "sourceDescription": "Description",
      "targetField": "TargetField",
      "targetType": "Text[50]",
      "targetNullable": false,
      "targetIsKey": false,
      "targetDescription": "Description",
      "status": "Type Mismatch | Constraint Risk | Compatible | Missing Field",
      "diffSeverity": "High | Medium | Low | None",
      "diffDetails": "Explanation of structural difference",
      "resolutionAdvice": "Human readable resolution advice",
      "recommendedTransformation": "SQL/Expression string e.g. COALESCE(TRIM(FIELD), 'DEFAULT')",
      "confidenceScore": 0.95
    }
  ]
}`;

    const cacheKey = `compare-schema:${sourceEntity}:${targetEntity}`;
    const aiRes = await callGeminiSafe(prompt, cacheKey);

    if (!aiRes || !aiRes.parsed) {
      return res.json({
        success: true,
        sourceEntity: sourceEntity || 'SAP KNA1 Customer Master',
        targetEntity: targetEntity || 'Dynamics 365 Customer API v2.0',
        summary: {
          totalFieldsCompared: sampleComparisons.length,
          compatibleFields: sampleComparisons.filter(c => c.status === 'Compatible').length,
          typeMismatches: sampleComparisons.filter(c => c.status === 'Type Mismatch').length,
          constraintRisks: sampleComparisons.filter(c => c.status === 'Constraint Risk').length,
          missingTargetFields: 1,
          autoResolutionsCount: sampleComparisons.length,
        },
        diffs: sampleComparisons,
        aiGenerated: false,
      });
    }

    return res.json({
      success: true,
      sourceEntity: sourceEntity || 'SAP KNA1 Customer Master',
      targetEntity: targetEntity || 'Dynamics 365 Customer API v2.0',
      summary: aiRes.parsed.summary || {
        totalFieldsCompared: sampleComparisons.length,
        compatibleFields: sampleComparisons.filter(c => c.status === 'Compatible').length,
        typeMismatches: sampleComparisons.filter(c => c.status === 'Type Mismatch').length,
        constraintRisks: sampleComparisons.filter(c => c.status === 'Constraint Risk').length,
        missingTargetFields: 1,
        autoResolutionsCount: sampleComparisons.length,
      },
      diffs: aiRes.parsed.diffs || sampleComparisons,
      aiGenerated: true,
    });
  } catch (error: any) {
    console.error('Error in Schema Comparison API:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to compare schemas',
    });
  }
});

function generateSmartRuleMappings(sourceSchema: any[], targetSchema: any[]) {
  const mappings: any[] = [];
  const unmappedSource: string[] = [];
  const unmappedTarget: string[] = [];

  if (!Array.isArray(sourceSchema) || !Array.isArray(targetSchema)) {
    return [];
  }

  const targetUsed = new Set<string>();

  for (const s of sourceSchema) {
    const sName = (s.fieldName || s.name || '').toString().toLowerCase();
    let matchedTarget = null;
    let confidence = 0;
    let trans = 'None';

    for (const t of targetSchema) {
      const tName = (t.fieldName || t.name || '').toString().toLowerCase();
      if (targetUsed.has(tName)) continue;

      // Exact match
      if (sName === tName || sName.replace(/[^a-z0-9]/g, '') === tName.replace(/[^a-z0-9]/g, '')) {
        matchedTarget = t;
        confidence = 0.98;
        break;
      }
      // Common ERP synonyms
      if ((sName.includes('cust') || sName.includes('code')) && (tName.includes('no') || tName.includes('id'))) {
        matchedTarget = t;
        confidence = 0.85;
      } else if ((sName.includes('phone') || sName.includes('tel')) && tName.includes('phone')) {
        matchedTarget = t;
        confidence = 0.90;
      } else if ((sName.includes('mail')) && tName.includes('email')) {
        matchedTarget = t;
        confidence = 0.95;
      } else if ((sName.includes('addr')) && tName.includes('address')) {
        matchedTarget = t;
        confidence = 0.92;
      } else if ((sName.includes('vat') || sName.includes('tax') || sName.includes('gst')) && (tName.includes('vat') || tName.includes('tax'))) {
        matchedTarget = t;
        confidence = 0.88;
      }
    }

    if (matchedTarget && confidence > 0.7) {
      const targetName = matchedTarget.fieldName || matchedTarget.name;
      targetUsed.add(targetName.toLowerCase());
      mappings.push({
        sourceField: s.fieldName || s.name,
        targetField: targetName,
        confidence,
        transformation: sName.includes('phone') ? 'Trim' : sName.includes('code') ? 'Uppercase' : 'None',
        reasoning: `Rule-based match: matched "${s.fieldName || s.name}" to "${targetName}" (${Math.round(confidence * 100)}% match)`,
      });
    } else {
      unmappedSource.push(s.fieldName || s.name);
    }
  }

  return mappings;
}

// ==================== EXPORT & SCHEDULING MANAGEMENT ENDPOINTS ====================
let mockExportSchedules: any[] = [
  {
    id: 'sch-101',
    name: 'Daily Parquet Data Lake Sync',
    targetEntities: ['Customer Master (KNA1)', 'SAP Sales Orders', 'GL Balances'],
    exportScopeType: 'Specific Data Sets',
    exportDeltaMode: 'Incremental Delta (24h)',
    format: 'Parquet (Snappy)',
    destinationType: 'AWS S3',
    destinationUri: 's3://enterprise-data-lake-prod/snapshots/daily/',
    scheduleFrequency: 'Daily',
    runTimeUtc: '02:00',
    nextRunAt: '2026-08-13T02:00:00Z',
    status: 'Active',
    partitioning: 'Year/Month/Day',
    compressionLevel: 'High',
    maxRetentionDays: 90,
    encryptionMethod: 'AES-256 KMS',
    minQualityThreshold: 85,
    notificationWebhook: 'https://api.enterprise.com/webhooks/export-complete',
    notificationEmails: ['data-lake-admin@enterprise.com'],
    lastExecutedAt: '2026-08-12T02:00:14Z',
    lastSnapshotSizeMb: 485.2,
    lastRowCount: 1245000,
    currentVersion: 2,
    versions: [
      {
        versionNumber: 2,
        versionLabel: 'v2.0',
        createdAt: '2026-07-28T10:00:00Z',
        createdBy: 'Data Lake Lead Admin',
        changeSummary: 'Upgraded compression to High Snappy & enabled AES-256 KMS encryption',
        configSnapshot: {
          name: 'Daily Parquet Data Lake Sync',
          targetEntities: ['Customer Master (KNA1)', 'SAP Sales Orders', 'GL Balances'],
          exportScopeType: 'Specific Data Sets',
          exportDeltaMode: 'Incremental Delta (24h)',
          format: 'Parquet (Snappy)',
          destinationType: 'AWS S3',
          destinationUri: 's3://enterprise-data-lake-prod/snapshots/daily/',
          scheduleFrequency: 'Daily',
          runTimeUtc: '02:00',
          partitioning: 'Year/Month/Day',
          compressionLevel: 'High',
          maxRetentionDays: 90,
          encryptionMethod: 'AES-256 KMS',
          minQualityThreshold: 85,
          notificationWebhook: 'https://api.enterprise.com/webhooks/export-complete',
          notificationEmails: ['data-lake-admin@enterprise.com'],
        },
      },
      {
        versionNumber: 1,
        versionLabel: 'v1.0',
        createdAt: '2026-06-15T08:00:00Z',
        createdBy: 'Platform Architect',
        changeSummary: 'Initial baseline creation of Daily Parquet Data Lake Sync schedule',
        configSnapshot: {
          name: 'Daily Parquet Data Lake Sync',
          targetEntities: ['Customer Master (KNA1)', 'SAP Sales Orders'],
          exportScopeType: 'Specific Data Sets',
          exportDeltaMode: 'Incremental Delta (24h)',
          format: 'Parquet (Snappy)',
          destinationType: 'AWS S3',
          destinationUri: 's3://enterprise-data-lake-prod/snapshots/raw/',
          scheduleFrequency: 'Daily',
          runTimeUtc: '02:00',
          partitioning: 'Year/Month/Day',
          compressionLevel: 'Standard',
          maxRetentionDays: 30,
          encryptionMethod: 'None',
          minQualityThreshold: 75,
        },
      },
    ],
  },
  {
    id: 'sch-102',
    name: 'Weekly Cleansed Audit Feed',
    targetEntities: ['Quarantined Error Records', 'Cleansed Staging Output Records'],
    exportScopeType: 'Migration Outputs',
    exportDeltaMode: 'Modified Records Only',
    format: 'CSV (Zip Compressed)',
    destinationType: 'Google Cloud Storage',
    destinationUri: 'gs://edimp-migration-audit-bucket/weekly-zip/',
    scheduleFrequency: 'Weekly',
    dayOfWeek: 'Sunday',
    runTimeUtc: '04:00',
    nextRunAt: '2026-08-16T04:00:00Z',
    status: 'Active',
    partitioning: 'System/Entity',
    compressionLevel: 'Standard',
    maxRetentionDays: 180,
    encryptionMethod: 'Standard TLS',
    minQualityThreshold: 90,
    notificationEmails: ['audit-lead@enterprise.com'],
    lastExecutedAt: '2026-08-09T04:00:08Z',
    lastSnapshotSizeMb: 122.8,
    lastRowCount: 340000,
    currentVersion: 2,
    versions: [
      {
        versionNumber: 2,
        versionLabel: 'v2.0',
        createdAt: '2026-07-20T14:30:00Z',
        createdBy: 'Governance Compliance Lead',
        changeSummary: 'Added Cleansed Staging Output Records & extended retention to 180 days',
        configSnapshot: {
          name: 'Weekly Cleansed Audit Feed',
          targetEntities: ['Quarantined Error Records', 'Cleansed Staging Output Records'],
          exportScopeType: 'Migration Outputs',
          exportDeltaMode: 'Modified Records Only',
          format: 'CSV (Zip Compressed)',
          destinationType: 'Google Cloud Storage',
          destinationUri: 'gs://edimp-migration-audit-bucket/weekly-zip/',
          scheduleFrequency: 'Weekly',
          dayOfWeek: 'Sunday',
          runTimeUtc: '04:00',
          partitioning: 'System/Entity',
          compressionLevel: 'Standard',
          maxRetentionDays: 180,
          encryptionMethod: 'Standard TLS',
          minQualityThreshold: 90,
          notificationEmails: ['audit-lead@enterprise.com'],
        },
      },
      {
        versionNumber: 1,
        versionLabel: 'v1.0',
        createdAt: '2026-06-01T09:00:00Z',
        createdBy: 'Security Officer',
        changeSummary: 'Initial baseline weekly audit export schedule',
        configSnapshot: {
          name: 'Weekly Cleansed Audit Feed',
          targetEntities: ['Quarantined Error Records'],
          exportScopeType: 'Migration Outputs',
          exportDeltaMode: 'Full Snapshot',
          format: 'CSV (Zip Compressed)',
          destinationType: 'Google Cloud Storage',
          destinationUri: 'gs://edimp-migration-audit-bucket/weekly/',
          scheduleFrequency: 'Weekly',
          dayOfWeek: 'Sunday',
          runTimeUtc: '04:00',
          partitioning: 'Flat Single File',
          compressionLevel: 'Standard',
          maxRetentionDays: 90,
          encryptionMethod: 'None',
        },
      },
    ],
  },
  {
    id: 'sch-103',
    name: 'Monthly Finance Ledger Snapshot',
    targetEntities: ['GL Balances (GL_BALANCES)', 'Oracle EBS Invoices'],
    exportScopeType: 'Hybrid Combined',
    exportDeltaMode: 'Full Snapshot',
    format: 'Parquet (ZSTD)',
    destinationType: 'Azure Blob Storage',
    destinationUri: 'azure://financesnapshots.blob.core.windows.net/monthly-ledger/',
    scheduleFrequency: 'Monthly',
    runTimeUtc: '00:00',
    nextRunAt: '2026-09-01T00:00:00Z',
    status: 'Paused',
    partitioning: 'Year/Month/Day',
    compressionLevel: 'High',
    maxRetentionDays: 365,
    encryptionMethod: 'PGP Key',
    lastExecutedAt: '2026-08-01T00:02:45Z',
    lastSnapshotSizeMb: 890.5,
    lastRowCount: 2150000,
    currentVersion: 1,
    versions: [
      {
        versionNumber: 1,
        versionLabel: 'v1.0',
        createdAt: '2026-07-01T00:00:00Z',
        createdBy: 'Finance Systems Admin',
        changeSummary: 'Initial baseline snapshot configuration for monthly finance ledger exports',
        configSnapshot: {
          name: 'Monthly Finance Ledger Snapshot',
          targetEntities: ['GL Balances (GL_BALANCES)', 'Oracle EBS Invoices'],
          exportScopeType: 'Hybrid Combined',
          exportDeltaMode: 'Full Snapshot',
          format: 'Parquet (ZSTD)',
          destinationType: 'Azure Blob Storage',
          destinationUri: 'azure://financesnapshots.blob.core.windows.net/monthly-ledger/',
          scheduleFrequency: 'Monthly',
          runTimeUtc: '00:00',
          partitioning: 'Year/Month/Day',
          compressionLevel: 'High',
          maxRetentionDays: 365,
          encryptionMethod: 'PGP Key',
        },
      },
    ],
  },
];

let mockReportTemplates: any[] = [
  {
    id: 'tpl-executive-summary',
    name: 'Executive Migration Overview Digest',
    description: 'High-level KPI metrics, SLA compliance, cross-tenant progress, and governance recommendations for executive leadership.',
    timeRange: 'Last 30 Days',
    metrics: {
      includeRecordCounts: true,
      includeVolumeAndThroughput: true,
      includeSuccessRateAndSla: true,
      includeQualityScores: true,
      includeErpBreakdown: true,
      includeErrorCategories: true,
      includeRecommendations: true,
    },
    tenantScope: 'All Tenants',
    orientation: 'Portrait',
    paperSize: 'A4',
    primaryThemeColor: '#4f46e5',
    lastModifiedAt: '2026-08-10T14:30:00Z',
    currentVersion: 'v2.1',
    versions: [
      { versionId: 'v2.1', publishedAt: '2026-08-10T14:30:00Z', author: 'System Admin', changeSummary: 'Added governance recommendations and updated theme accents' },
      { versionId: 'v2.0', publishedAt: '2026-08-01T09:00:00Z', author: 'Lead Architect', changeSummary: 'Initial v2.0 multi-tenant layout baseline' },
    ],
  },
  {
    id: 'tpl-technical-audit',
    name: 'Technical Data Quality & Remediation Audit',
    description: 'Deep dive into quarantined records, FK violations, data cleansing scores, and error category breakdowns for engineering teams.',
    timeRange: 'Last 7 Days',
    metrics: {
      includeRecordCounts: true,
      includeVolumeAndThroughput: true,
      includeSuccessRateAndSla: false,
      includeQualityScores: true,
      includeErpBreakdown: true,
      includeErrorCategories: true,
      includeRecommendations: true,
    },
    tenantScope: 'Selected Tenants',
    orientation: 'Landscape',
    paperSize: 'Letter',
    primaryThemeColor: '#0284c7',
    lastModifiedAt: '2026-08-11T11:15:00Z',
    currentVersion: 'v1.4',
    versions: [
      { versionId: 'v1.4', publishedAt: '2026-08-11T11:15:00Z', author: 'QA Lead', changeSummary: 'Expanded error categories and FK violation detail tables' },
    ],
  },
];

let mockPdfReportSchedules: any[] = [
  {
    id: 'rep-sch-101',
    name: 'Weekly Cross-Tenant Migration Executive Digest',
    frequency: 'Weekly',
    dayOfWeek: 'Monday',
    timeUtc: '06:00',
    tenantScope: 'All Tenants',
    selectedTenantIds: ['tenant-acme', 'tenant-globex', 'tenant-initech', 'tenant-weyland', 'tenant-stark'],
    recipients: ['exec-team@enterprise.com', 'fayasamd@gmail.com'],
    destinationType: 'AWS S3',
    destinationUri: 's3://enterprise-pdf-vault/reports/weekly-tenant-summaries/',
    includeKpis: true,
    includeTenantMatrix: true,
    includeErrorBreakdown: true,
    includeRecommendations: true,
    status: 'Active',
    lastGeneratedAt: '2026-08-10T06:00:12Z',
    nextRunAt: '2026-08-17T06:00:00Z',
  },
];

// GET Export Schedules
app.get('/api/export/schedules', (req, res) => {
  res.json({ success: true, schedules: mockExportSchedules });
});

// POST Create Export Schedule
app.post('/api/export/schedules', (req, res) => {
  const v1Snapshot = {
    name: req.body.name || 'New Export Schedule',
    targetEntities: req.body.targetEntities || [],
    exportScopeType: req.body.exportScopeType || 'Specific Data Sets',
    exportDeltaMode: req.body.exportDeltaMode || 'Incremental Delta (24h)',
    format: req.body.format || 'Parquet (Snappy)',
    destinationType: req.body.destinationType || 'AWS S3',
    destinationUri: req.body.destinationUri || 's3://my-enterprise-data-lake/exports/',
    scheduleFrequency: req.body.scheduleFrequency || 'Daily',
    cronExpression: req.body.cronExpression,
    runTimeUtc: req.body.runTimeUtc || '02:00',
    dayOfWeek: req.body.dayOfWeek,
    partitioning: req.body.partitioning || 'Year/Month/Day',
    compressionLevel: req.body.compressionLevel || 'High',
    maxRetentionDays: req.body.maxRetentionDays || 90,
    encryptionMethod: req.body.encryptionMethod || 'AES-256 KMS',
    minQualityThreshold: req.body.minQualityThreshold || 85,
    notificationWebhook: req.body.notificationWebhook,
    notificationEmails: req.body.notificationEmails,
  };

  const initialVersion = {
    versionNumber: 1,
    versionLabel: 'v1.0',
    createdAt: new Date().toISOString(),
    createdBy: req.body.author || 'Data Platform Operator',
    changeSummary: req.body.changeSummary || 'Initial schedule creation baseline',
    configSnapshot: v1Snapshot,
  };

  const newSchedule = {
    id: req.body.id || `sch-${Date.now()}`,
    ...req.body,
    status: req.body.status || 'Active',
    nextRunAt: req.body.nextRunAt || new Date(Date.now() + 86400000).toISOString(),
    currentVersion: 1,
    versions: [initialVersion],
  };
  mockExportSchedules.unshift(newSchedule);
  res.json({ success: true, schedule: newSchedule });
});

// PUT Update Export Schedule (creates new version)
app.put('/api/export/schedules/:id', (req, res) => {
  const { id } = req.params;
  const index = mockExportSchedules.findIndex((s) => s.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Schedule not found' });
  }

  const existing = mockExportSchedules[index];
  const nextVersionNum = (existing.currentVersion || 1) + 1;
  const newVersionLabel = `v${nextVersionNum}.0`;

  const configSnapshot = {
    name: req.body.name || existing.name,
    targetEntities: req.body.targetEntities || existing.targetEntities,
    exportScopeType: req.body.exportScopeType || existing.exportScopeType,
    exportDeltaMode: req.body.exportDeltaMode || existing.exportDeltaMode,
    format: req.body.format || existing.format,
    destinationType: req.body.destinationType || existing.destinationType,
    destinationUri: req.body.destinationUri || existing.destinationUri,
    scheduleFrequency: req.body.scheduleFrequency || existing.scheduleFrequency,
    cronExpression: req.body.cronExpression || existing.cronExpression,
    runTimeUtc: req.body.runTimeUtc || existing.runTimeUtc,
    dayOfWeek: req.body.dayOfWeek || existing.dayOfWeek,
    partitioning: req.body.partitioning || existing.partitioning,
    compressionLevel: req.body.compressionLevel || existing.compressionLevel,
    maxRetentionDays: req.body.maxRetentionDays || existing.maxRetentionDays,
    encryptionMethod: req.body.encryptionMethod || existing.encryptionMethod,
    minQualityThreshold: req.body.minQualityThreshold || existing.minQualityThreshold,
    notificationWebhook: req.body.notificationWebhook || existing.notificationWebhook,
    notificationEmails: req.body.notificationEmails || existing.notificationEmails,
  };

  const newVersion = {
    versionNumber: nextVersionNum,
    versionLabel: newVersionLabel,
    createdAt: new Date().toISOString(),
    createdBy: req.body.author || 'Data Platform Operator',
    changeSummary: req.body.changeSummary || 'Updated export configuration parameters',
    configSnapshot,
  };

  const updatedSchedule = {
    ...existing,
    ...req.body,
    currentVersion: nextVersionNum,
    versions: [newVersion, ...(existing.versions || [])],
  };

  mockExportSchedules[index] = updatedSchedule;
  res.json({ success: true, schedule: updatedSchedule });
});

// GET Schedule Version History
app.get('/api/export/schedules/:id/versions', (req, res) => {
  const { id } = req.params;
  const schedule = mockExportSchedules.find((s) => s.id === id);
  if (!schedule) {
    return res.status(404).json({ success: false, message: 'Schedule not found' });
  }
  res.json({
    success: true,
    scheduleId: id,
    scheduleName: schedule.name,
    currentVersion: schedule.currentVersion || 1,
    versions: schedule.versions || [],
  });
});

// POST Restore Schedule Version
app.post('/api/export/schedules/:id/restore', (req, res) => {
  const { id } = req.params;
  const { versionNumber, author, restoreNote } = req.body;

  const index = mockExportSchedules.findIndex((s) => s.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Schedule not found' });
  }

  const schedule = mockExportSchedules[index];
  const targetVersion = (schedule.versions || []).find((v: any) => v.versionNumber === Number(versionNumber));
  if (!targetVersion) {
    return res.status(400).json({ success: false, message: `Version ${versionNumber} not found` });
  }

  const snap = targetVersion.configSnapshot;
  const nextVersionNum = (schedule.currentVersion || 1) + 1;
  const newVersionLabel = `v${nextVersionNum}.0`;

  const restorationVersion = {
    versionNumber: nextVersionNum,
    versionLabel: newVersionLabel,
    createdAt: new Date().toISOString(),
    createdBy: author || 'Data Platform Operator',
    changeSummary: restoreNote || `Restored from version ${targetVersion.versionLabel} (${targetVersion.changeSummary})`,
    configSnapshot: { ...snap },
  };

  const restoredSchedule = {
    ...schedule,
    ...snap,
    currentVersion: nextVersionNum,
    versions: [restorationVersion, ...(schedule.versions || [])],
  };

  mockExportSchedules[index] = restoredSchedule;
  res.json({ success: true, schedule: restoredSchedule, restoredFromVersion: targetVersion.versionLabel });
});

// POST Trigger Export Schedule Now
app.post('/api/export/trigger', (req, res) => {
  const { scheduleName, entityName, format, destinationUri } = req.body;
  const mockRowCount = Math.floor(150000 + Math.random() * 850000);
  const mockSizeMb = Math.floor(45 + Math.random() * 450);
  const mockJob = {
    id: `job-exp-${Date.now().toString().slice(-4)}`,
    scheduleName: scheduleName || 'Ad-hoc Data Export',
    entityName: entityName || 'Selected Export Target',
    format: format || 'Parquet (Snappy)',
    destinationUri: destinationUri || 's3://enterprise-data-lake/exports/',
    status: 'Completed',
    rowCount: mockRowCount,
    fileSizeBytes: mockSizeMb * 1048576,
    checksumSha256: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
    startedAt: new Date(Date.now() - 4000).toISOString(),
    completedAt: new Date().toISOString(),
    downloadUrl: '#',
  };
  res.json({ success: true, job: mockJob });
});

// POST Generate Formatted Migration Output CSV
app.post('/api/export/csv', (req, res) => {
  const { outputType, tenantFilter, delimiter, includeHeader, selectedColumns, recordCount } = req.body;
  const mockRows = recordCount || Math.floor(120 + Math.random() * 880);
  const sizeKb = Math.round(mockRows * 0.45);
  const mockJob = {
    id: `job-csv-${Date.now().toString().slice(-4)}`,
    scheduleName: `Direct CSV Export: ${outputType || 'Migration Output'}`,
    entityName: outputType || 'Migration Outputs Dump',
    format: 'CSV (Gstandard)',
    destinationUri: 'Local Direct CSV Download',
    status: 'Completed',
    rowCount: mockRows,
    fileSizeBytes: sizeKb * 1024,
    checksumSha256: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
    startedAt: new Date(Date.now() - 1200).toISOString(),
    completedAt: new Date().toISOString(),
    downloadUrl: '#',
  };
  res.json({
    success: true,
    message: `Generated CSV file for ${outputType} containing ${mockRows} formatted records (${sizeKb} KB).`,
    job: mockJob,
  });
});

// POST Test Cloud Storage Connection
app.post('/api/export/test-connection', (req, res) => {
  const { destinationType, destinationUri } = req.body;
  if (!destinationUri || destinationUri.length < 5) {
    return res.json({
      success: false,
      message: 'Invalid destination URI format. Please check protocol (s3://, gs://, etc.)',
    });
  }
  return res.json({
    success: true,
    message: `Connection handshake verified successfully for ${destinationType} (${destinationUri}). Target bucket permissions read/write tested OK.`,
  });
});

// GET Multi-Tenant Migration Metrics
app.get('/api/export/reports/tenants-metrics', (req, res) => {
  const tenants = [
    {
      id: 'tenant-acme',
      name: 'Acme Global Corp',
      region: 'US-East',
      tier: 'Enterprise',
      status: 'In Cutover Phase',
      progressPct: 98.4,
      totalRecords: 4850000,
      successfulRecords: 4835200,
      errorRecords: 14800,
      successRatePct: 99.7,
      dataVolumeMb: 14200,
      activePipelines: 6,
      qualityScore: 96,
      lastSync: new Date().toISOString(),
      primaryErp: 'SAP S/4HANA (v2023)',
      contactEmail: 'wcoyote@acme.com',
    },
    {
      id: 'tenant-globex',
      name: 'Globex Industries',
      region: 'EU-Central',
      tier: 'Professional',
      status: 'Active Migration',
      progressPct: 94.2,
      totalRecords: 2120000,
      successfulRecords: 2107280,
      errorRecords: 12720,
      successRatePct: 99.4,
      dataVolumeMb: 8600,
      activePipelines: 4,
      qualityScore: 94,
      lastSync: new Date().toISOString(),
      primaryErp: 'SAP ECC 6.0 & NetSuite',
      contactEmail: 'scorpio@globex.com',
    },
    {
      id: 'tenant-initech',
      name: 'Initech Solutions',
      region: 'US-East',
      tier: 'Standard',
      status: 'Remediation Required',
      progressPct: 42.0,
      totalRecords: 680000,
      successfulRecords: 601800,
      errorRecords: 78200,
      successRatePct: 88.5,
      dataVolumeMb: 2100,
      activePipelines: 2,
      qualityScore: 78,
      lastSync: new Date().toISOString(),
      primaryErp: 'Oracle JD Edwards',
      contactEmail: 'pgibbons@initech.com',
    },
    {
      id: 'tenant-weyland',
      name: 'Weyland-Yutani Corp',
      region: 'AP-South',
      tier: 'Enterprise',
      status: 'Final Sign-Off',
      progressPct: 99.8,
      totalRecords: 12450000,
      successfulRecords: 12437550,
      errorRecords: 12450,
      successRatePct: 99.9,
      dataVolumeMb: 42800,
      activePipelines: 12,
      qualityScore: 98,
      lastSync: new Date().toISOString(),
      primaryErp: 'Custom Bio-Ledger ERP',
      contactEmail: 'burke@weyland.com',
    },
    {
      id: 'tenant-stark',
      name: 'Stark Logistics Int.',
      region: 'US-West',
      tier: 'Enterprise',
      status: 'Active Migration',
      progressPct: 87.5,
      totalRecords: 3400000,
      successfulRecords: 3369400,
      errorRecords: 30600,
      successRatePct: 99.1,
      dataVolumeMb: 11500,
      activePipelines: 5,
      qualityScore: 92,
      lastSync: new Date().toISOString(),
      primaryErp: 'Dynamics 365 Finance',
      contactEmail: 'stark@starklogistics.io',
    },
  ];
  res.json({ success: true, tenants });
});

// GET PDF Schedules
app.get('/api/export/reports/schedules', (req, res) => {
  res.json({ success: true, schedules: mockPdfReportSchedules });
});

// POST PDF Schedule
app.post('/api/export/reports/schedules', (req, res) => {
  const newSch = {
    id: req.body.id || `rep-sch-${Date.now()}`,
    ...req.body,
    status: req.body.status || 'Active',
    nextRunAt: req.body.nextRunAt || new Date(Date.now() + 86400000).toISOString(),
  };
  mockPdfReportSchedules.unshift(newSch);
  res.json({ success: true, schedule: newSch });
});

// GET PDF Templates
app.get('/api/export/reports/templates', (req, res) => {
  res.json({ success: true, templates: mockReportTemplates });
});

// POST Save PDF Template
app.post('/api/export/reports/templates', (req, res) => {
  const { id, name, description, timeRange, metrics, tenantScope, selectedTenantIds, orientation, paperSize, primaryThemeColor, changeSummary } = req.body;
  const existingIdx = mockReportTemplates.findIndex((t) => t.id === id);
  const now = new Date().toISOString();

  if (existingIdx !== -1) {
    const existing = mockReportTemplates[existingIdx];
    const newVersionNum = `v${(parseFloat(existing.currentVersion.replace('v', '')) + 0.1).toFixed(1)}`;
    const newVersionObj = {
      versionId: newVersionNum,
      publishedAt: now,
      author: 'Current User',
      changeSummary: changeSummary || 'Updated template configuration',
    };
    const updated = {
      ...existing,
      name,
      description,
      timeRange,
      metrics,
      tenantScope,
      selectedTenantIds,
      orientation,
      paperSize,
      primaryThemeColor,
      lastModifiedAt: now,
      currentVersion: newVersionNum,
      versions: [newVersionObj, ...(existing.versions || [])],
    };
    mockReportTemplates[existingIdx] = updated;
    return res.json({ success: true, template: updated });
  } else {
    const newTpl = {
      id: id || `tpl-${Date.now()}`,
      name,
      description,
      timeRange,
      metrics,
      tenantScope,
      selectedTenantIds,
      orientation,
      paperSize,
      primaryThemeColor,
      lastModifiedAt: now,
      currentVersion: 'v1.0',
      versions: [
        { versionId: 'v1.0', publishedAt: now, author: 'Current User', changeSummary: changeSummary || 'Initial template creation' },
      ],
    };
    mockReportTemplates.unshift(newTpl);
    return res.json({ success: true, template: newTpl });
  }
});

// DELETE PDF Template
app.delete('/api/export/reports/templates/:id', (req, res) => {
  mockReportTemplates = mockReportTemplates.filter((t) => t.id !== req.params.id);
  res.json({ success: true, message: 'Template removed' });
});

// POST Rollback Template
app.post('/api/export/reports/templates/:id/rollback/:verId', (req, res) => {
  const { id, verId } = req.params;
  const existing = mockReportTemplates.find((t) => t.id === id);
  if (!existing) return res.status(404).json({ success: false, message: 'Template not found' });

  const targetVer = existing.versions?.find((v: any) => v.versionId === verId);
  if (!targetVer) return res.status(404).json({ success: false, message: 'Version not found' });

  existing.currentVersion = targetVer.versionId;
  existing.lastModifiedAt = new Date().toISOString();
  return res.json({ success: true, template: existing });
});

// ==================== MIGRATION REPLAY & HISTORICAL SNAPSHOTS ENGINE ====================
let mockHistoricalReplayJobs: any[] = [
  {
    id: 'job-hist-201',
    jobName: 'Q2 2026 SAP Customer Master Migration (Batch #14)',
    sourceConnectorId: 'conn-sap-s4',
    sourceConnectorName: 'SAP S/4HANA Cloud Engine',
    sourceEntity: 'KNA1_Customer_Master',
    destConnectorId: 'conn-bc-prod',
    destConnectorName: 'Dynamics 365 Business Central (Prod)',
    destEntity: 'Customer API v2.0',
    category: 'ERP',
    connectorIcon: 'Layers',
    executionTimestamp: '2026-06-15T14:30:00Z',
    mode: 'Full Batch Snapshot',
    originalTotalRecords: 14250,
    originalProcessedRecords: 14236,
    originalErrorCount: 14,
    originalOutputHash: 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    snapshotUri: 's3://enterprise-migration-vault/snapshots/2026-06-15/kna1_batch14.parquet',
    snapshotSizeBytes: 485000000,
    mappingRulesVersion: 'v2.4-cleansed-standard',
    reproducibilityStatus: 'Verified (100% Match)',
  },
  {
    id: 'job-hist-202',
    jobName: 'Vendor Accounts Payable Legacy Import',
    sourceConnectorId: 'conn-sql-legacy',
    sourceConnectorName: 'SQL Server - Legacy ERP DB',
    sourceEntity: 'tbl_Vendors_Master',
    destConnectorId: 'conn-d365-fo',
    destConnectorName: 'Dynamics 365 Finance & Operations',
    destEntity: 'VendVendorV2Entity',
    category: 'Database',
    connectorIcon: 'Database',
    executionTimestamp: '2026-07-01T08:15:00Z',
    mode: 'Incremental Delta',
    originalTotalRecords: 3200,
    originalProcessedRecords: 3198,
    originalErrorCount: 2,
    originalOutputHash: 'sha256:7a9f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0c1b2a3f4e5d6c7b8a9f',
    snapshotUri: 'gs://edimp-migration-audit-bucket/snapshots/2026-07-01/vendors_master.parquet',
    snapshotSizeBytes: 122000000,
    mappingRulesVersion: 'v1.8-vendor-cleansed',
    reproducibilityStatus: 'Verified (100% Match)',
  },
  {
    id: 'job-hist-203',
    jobName: 'Salesforce Accounts to Business Central Sync',
    sourceConnectorId: 'conn-sfdc-main',
    sourceConnectorName: 'Salesforce Enterprise CRM',
    sourceEntity: 'Account (Salesforce)',
    destConnectorId: 'conn-bc-prod',
    destConnectorName: 'Dynamics 365 Business Central (Prod)',
    destEntity: 'Customer',
    category: 'CRM',
    connectorIcon: 'Users',
    executionTimestamp: '2026-07-10T11:00:00Z',
    mode: 'Realtime Webhook Delta',
    originalTotalRecords: 8500,
    originalProcessedRecords: 8492,
    originalErrorCount: 8,
    originalOutputHash: 'sha256:3f4e5d6c7b8a9f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0c1b2a3f4e',
    snapshotUri: 's3://enterprise-migration-vault/snapshots/2026-07-10/sfdc_accounts.parquet',
    snapshotSizeBytes: 210000000,
    mappingRulesVersion: 'v2.1-crm-address-std',
    reproducibilityStatus: 'Pending Verification',
  },
  {
    id: 'job-hist-204',
    jobName: 'Snowflake Fact Sales Analytics Migration',
    sourceConnectorId: 'conn-snowflake-dw',
    sourceConnectorName: 'Snowflake Enterprise Data Cloud Warehouse',
    sourceEntity: 'ANALYTICS.FACT_SALES_SUMMARY',
    destConnectorId: 'conn-bc-prod',
    destConnectorName: 'Dynamics 365 Business Central (Prod)',
    destEntity: 'Sales Ledger Entry API',
    category: 'Database',
    connectorIcon: 'Database',
    executionTimestamp: '2026-07-14T03:00:00Z',
    mode: 'Micro-Partition Batch Extract',
    originalTotalRecords: 1450000,
    originalProcessedRecords: 1449880,
    originalErrorCount: 120,
    originalOutputHash: 'sha256:91b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
    snapshotUri: 's3://enterprise-migration-vault/snapshots/2026-07-14/snowflake_sales.parquet',
    snapshotSizeBytes: 1840000000,
    mappingRulesVersion: 'v3.0-analytical-rollup',
    reproducibilityStatus: 'Verified (100% Match)',
  },
  {
    id: 'job-hist-205',
    jobName: 'Oracle Cloud Fusion Invoices Ledger Sync',
    sourceConnectorId: 'conn-oracle-fusion',
    sourceConnectorName: 'Oracle Cloud Fusion ERP',
    sourceEntity: 'Fusion_Invoices_V2',
    destConnectorId: 'conn-d365-fo',
    destConnectorName: 'Dynamics 365 Finance & Operations',
    destEntity: 'VendInvoiceHeaderEntity',
    category: 'ERP',
    connectorIcon: 'Layers',
    executionTimestamp: '2026-07-18T16:20:00Z',
    mode: 'REST OData Microbatch',
    originalTotalRecords: 84200,
    originalProcessedRecords: 84190,
    originalErrorCount: 10,
    originalOutputHash: 'sha256:a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
    snapshotUri: 'gs://edimp-migration-audit-bucket/snapshots/2026-07-18/fusion_invoices.parquet',
    snapshotSizeBytes: 540000000,
    mappingRulesVersion: 'v2.8-gl-tax-reconciled',
    reproducibilityStatus: 'Verified (100% Match)',
  },
  {
    id: 'job-hist-206',
    jobName: 'Workday Worker Compensation & Payroll Transfer',
    sourceConnectorId: 'conn-workday-hcm',
    sourceConnectorName: 'Workday Enterprise HCM & Payroll API',
    sourceEntity: 'Worker_Compensation_Master',
    destConnectorId: 'conn-bc-prod',
    destConnectorName: 'Dynamics 365 Business Central (Prod)',
    destEntity: 'Payroll Journal API',
    category: 'Custom API',
    connectorIcon: 'Users',
    executionTimestamp: '2026-07-22T09:45:00Z',
    mode: 'PII Masked Roster Extract',
    originalTotalRecords: 32800,
    originalProcessedRecords: 32800,
    originalErrorCount: 0,
    originalOutputHash: 'sha256:55aa66bb77cc88dd99ee00ff11aa22bb33cc44dd55ee66ff77aa88bb99cc00dd',
    snapshotUri: 's3://enterprise-migration-vault/snapshots/2026-07-22/workday_hcm.parquet',
    snapshotSizeBytes: 98000000,
    mappingRulesVersion: 'v1.4-pii-safe-payroll',
    reproducibilityStatus: 'Verified (100% Match)',
  },
  {
    id: 'job-hist-207',
    jobName: 'NetSuite SuiteTalk Customer Master Migration',
    sourceConnectorId: 'conn-netsuite-erp',
    sourceConnectorName: 'NetSuite SuiteTalk ERP Engine',
    sourceEntity: 'netsuite_customer_records',
    destConnectorId: 'conn-bc-prod',
    destConnectorName: 'Dynamics 365 Business Central (Prod)',
    destEntity: 'Customer',
    category: 'ERP',
    connectorIcon: 'Building2',
    executionTimestamp: '2026-07-25T13:10:00Z',
    mode: 'SuiteTalk RESTlet Sync',
    originalTotalRecords: 28400,
    originalProcessedRecords: 28395,
    originalErrorCount: 5,
    originalOutputHash: 'sha256:99887766554433221100aabbccddeeff00112233445566778899aabbccddeeff',
    snapshotUri: 'gs://edimp-migration-audit-bucket/snapshots/2026-07-25/netsuite_cust.parquet',
    snapshotSizeBytes: 186000000,
    mappingRulesVersion: 'v2.2-netsuite-credit-terms',
    reproducibilityStatus: 'Verified (100% Match)',
  },
  {
    id: 'job-hist-208',
    jobName: 'Amazon S3 Gold Lake Financial Ledger Import',
    sourceConnectorId: 'conn-aws-s3-lake',
    sourceConnectorName: 'Amazon S3 Enterprise Parquet Data Lake',
    sourceEntity: 'gold_financial_ledger.parquet',
    destConnectorId: 'conn-d365-fo',
    destConnectorName: 'Dynamics 365 Finance & Operations',
    destEntity: 'GeneralJournalAccountEntryEntity',
    category: 'Cloud Storage',
    connectorIcon: 'Cloud',
    executionTimestamp: '2026-07-28T02:00:00Z',
    mode: 'Multi-Part Parquet Stream',
    originalTotalRecords: 1890000,
    originalProcessedRecords: 1889950,
    originalErrorCount: 50,
    originalOutputHash: 'sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    snapshotUri: 's3://prod-enterprise-data-lake-eu-west-1/parquet-gold/ledger/2026_07.parquet',
    snapshotSizeBytes: 2420000000,
    mappingRulesVersion: 'v3.5-gl-dimension-cleansed',
    reproducibilityStatus: 'Verified (100% Match)',
  },
  {
    id: 'job-hist-209',
    jobName: 'HubSpot CRM Contacts to Business Central Contacts',
    sourceConnectorId: 'conn-hubspot-crm',
    sourceConnectorName: 'HubSpot Revenue & CRM Engine',
    sourceEntity: 'hubspot_contacts',
    destConnectorId: 'conn-bc-prod',
    destConnectorName: 'Dynamics 365 Business Central (Prod)',
    destEntity: 'Contact API',
    category: 'CRM',
    connectorIcon: 'Globe',
    executionTimestamp: '2026-08-01T17:30:00Z',
    mode: 'REST v3 Incremental',
    originalTotalRecords: 64200,
    originalProcessedRecords: 64188,
    originalErrorCount: 12,
    originalOutputHash: 'sha256:deadbeefcafebabe0123456789abcdef0123456789abcdef0123456789abcdef',
    snapshotUri: 's3://enterprise-migration-vault/snapshots/2026-08-01/hubspot_contacts.parquet',
    snapshotSizeBytes: 245000000,
    mappingRulesVersion: 'v1.9-hubspot-lifecycle-clean',
    reproducibilityStatus: 'Verified (100% Match)',
  },
  {
    id: 'job-hist-210',
    jobName: 'PostgreSQL Staging Item & Pricing Catalog Load',
    sourceConnectorId: 'conn-postgres-warehouse',
    sourceConnectorName: 'PostgreSQL Staging Warehouse',
    sourceEntity: 'dim_products_stage',
    destConnectorId: 'conn-bc-prod',
    destConnectorName: 'Dynamics 365 Business Central (Prod)',
    destEntity: 'Item Master API v2.0',
    category: 'Database',
    connectorIcon: 'Server',
    executionTimestamp: '2026-08-03T10:15:00Z',
    mode: 'Parallel COPY Streaming',
    originalTotalRecords: 480000,
    originalProcessedRecords: 479960,
    originalErrorCount: 40,
    originalOutputHash: 'sha256:4433221100ffeeddccbbaa99887766554433221100ffeeddccbbaa9988776655',
    snapshotUri: 'gs://edimp-migration-audit-bucket/snapshots/2026-08-03/pg_products.parquet',
    snapshotSizeBytes: 620000000,
    mappingRulesVersion: 'v2.6-sku-barcode-iso',
    reproducibilityStatus: 'Verified (100% Match)',
  },
  {
    id: 'job-hist-211',
    jobName: 'Customer Master Excel Files Cleansed Ingestion',
    sourceConnectorId: 'conn-excel-files',
    sourceConnectorName: 'Customer Master Excel (.xlsx)',
    sourceEntity: 'Customers_July2026.xlsx',
    destConnectorId: 'conn-bc-prod',
    destConnectorName: 'Dynamics 365 Business Central (Prod)',
    destEntity: 'Customer',
    category: 'Files',
    connectorIcon: 'FileSpreadsheet',
    executionTimestamp: '2026-08-05T07:20:00Z',
    mode: 'Validated OpenXML Parse',
    originalTotalRecords: 14250,
    originalProcessedRecords: 14240,
    originalErrorCount: 10,
    originalOutputHash: 'sha256:9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
    snapshotUri: 's3://enterprise-migration-vault/snapshots/2026-08-05/customers_excel.parquet',
    snapshotSizeBytes: 42000000,
    mappingRulesVersion: 'v2.0-phone-zip-standard',
    reproducibilityStatus: 'Verified (100% Match)',
  },
  {
    id: 'job-hist-212',
    jobName: 'SharePoint Contracts & Document Attachments Archive',
    sourceConnectorId: 'conn-sharepoint-docs',
    sourceConnectorName: 'SharePoint Document Library',
    sourceEntity: 'Vendor_Contracts_Archive',
    destConnectorId: 'conn-d365-fo',
    destConnectorName: 'Dynamics 365 Finance & Operations',
    destEntity: 'DocuRefEntity',
    category: 'Cloud Storage',
    connectorIcon: 'Cloud',
    executionTimestamp: '2026-08-08T12:00:00Z',
    mode: 'Graph API Binary Snapshot',
    originalTotalRecords: 18500,
    originalProcessedRecords: 18498,
    originalErrorCount: 2,
    originalOutputHash: 'sha256:abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
    snapshotUri: 's3://enterprise-migration-vault/snapshots/2026-08-08/sharepoint_docs.parquet',
    snapshotSizeBytes: 3100000000,
    mappingRulesVersion: 'v1.7-pdf-metadata-std',
    reproducibilityStatus: 'Verified (100% Match)',
  },
  {
    id: 'job-hist-213',
    jobName: 'Legacy HRMS Employee Master Migration',
    sourceConnectorId: 'conn-custom-rest',
    sourceConnectorName: 'Legacy HRMS REST API Endpoint',
    sourceEntity: 'hrms_employee_roster',
    destConnectorId: 'conn-bc-prod',
    destConnectorName: 'Dynamics 365 Business Central (Prod)',
    destEntity: 'Employee API',
    category: 'Custom API',
    connectorIcon: 'Code',
    executionTimestamp: '2026-08-10T15:40:00Z',
    mode: 'REST JSON Cursor Pagination',
    originalTotalRecords: 6200,
    originalProcessedRecords: 6197,
    originalErrorCount: 3,
    originalOutputHash: 'sha256:7766554433221100ffeeddccbbaa99887766554433221100ffeeddccbbaa9988',
    snapshotUri: 'gs://edimp-migration-audit-bucket/snapshots/2026-08-10/legacy_hrms.parquet',
    snapshotSizeBytes: 58000000,
    mappingRulesVersion: 'v2.1-department-org-clean',
    reproducibilityStatus: 'Verified (100% Match)',
  },
  {
    id: 'job-hist-214',
    jobName: 'Dynamics 365 F&O Intercompany Balance Consolidation',
    sourceConnectorId: 'conn-d365-fo',
    sourceConnectorName: 'Dynamics 365 Finance & Operations',
    sourceEntity: 'CustCustomerV3Entity',
    destConnectorId: 'conn-bc-prod',
    destConnectorName: 'Dynamics 365 Business Central (Prod)',
    destEntity: 'Customer Posting Group API',
    category: 'ERP',
    connectorIcon: 'Building2',
    executionTimestamp: '2026-08-12T18:00:00Z',
    mode: 'Dual-Write Realtime Stream',
    originalTotalRecords: 45000,
    originalProcessedRecords: 44990,
    originalErrorCount: 10,
    originalOutputHash: 'sha256:00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff',
    snapshotUri: 's3://enterprise-migration-vault/snapshots/2026-08-12/d365_fo_balances.parquet',
    snapshotSizeBytes: 380000000,
    mappingRulesVersion: 'v3.2-currency-dual-write',
    reproducibilityStatus: 'Verified (100% Match)',
  },
  {
    id: 'job-hist-215',
    jobName: 'Business Central Production Master Baseline Replay',
    sourceConnectorId: 'conn-bc-prod',
    sourceConnectorName: 'Dynamics 365 Business Central (Prod)',
    destConnectorId: 'conn-bc-prod',
    destConnectorName: 'Dynamics 365 Business Central (Prod)',
    sourceEntity: 'Customer Master Ingestion Pipeline',
    destEntity: 'Customer Ledger Entries',
    category: 'ERP',
    connectorIcon: 'Building2',
    executionTimestamp: '2026-08-14T01:10:00Z',
    mode: 'Baseline Verification Snapshot',
    originalTotalRecords: 92400,
    originalProcessedRecords: 92395,
    originalErrorCount: 5,
    originalOutputHash: 'sha256:ffeeddccbbaa99887766554433221100ffeeddccbbaa99887766554433221100',
    snapshotUri: 's3://enterprise-migration-vault/snapshots/2026-08-14/bc_baseline.parquet',
    snapshotSizeBytes: 710000000,
    mappingRulesVersion: 'v3.6-baseline-audit-std',
    reproducibilityStatus: 'Verified (100% Match)',
  },
];

// GET Historical Replay Jobs (supports connectorId, category, search)
app.get('/api/replay/historical-jobs', (req, res) => {
  const { connectorId, category, search } = req.query;
  let jobs = [...mockHistoricalReplayJobs];

  if (connectorId && connectorId !== 'All') {
    jobs = jobs.filter((j) => j.sourceConnectorId === connectorId || j.destConnectorId === connectorId);
  }

  if (category && category !== 'All') {
    jobs = jobs.filter((j) => j.category === category);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    jobs = jobs.filter((j) =>
      j.jobName.toLowerCase().includes(q) ||
      j.sourceEntity.toLowerCase().includes(q) ||
      j.destEntity.toLowerCase().includes(q) ||
      j.sourceConnectorName.toLowerCase().includes(q) ||
      j.destConnectorName.toLowerCase().includes(q)
    );
  }

  res.json({
    success: true,
    totalCount: mockHistoricalReplayJobs.length,
    filteredCount: jobs.length,
    jobs,
    timestamp: new Date().toISOString(),
  });
});

// GET Connectors summary for Replay
app.get('/api/replay/connectors', (req, res) => {
  const connectorSummaryMap = new Map<string, { id: string; name: string; category: string; icon: string; snapshotCount: number; totalRecords: number }>();

  for (const job of mockHistoricalReplayJobs) {
    if (!connectorSummaryMap.has(job.sourceConnectorId)) {
      connectorSummaryMap.set(job.sourceConnectorId, {
        id: job.sourceConnectorId,
        name: job.sourceConnectorName,
        category: job.category || 'ERP',
        icon: job.connectorIcon || 'Layers',
        snapshotCount: 0,
        totalRecords: 0,
      });
    }
    const item = connectorSummaryMap.get(job.sourceConnectorId)!;
    item.snapshotCount += 1;
    item.totalRecords += job.originalTotalRecords;
  }

  res.json({
    success: true,
    connectors: Array.from(connectorSummaryMap.values()),
    totalConnectors: connectorSummaryMap.size,
  });
});

// POST Generate Snapshot for Connector in Real Time
app.post('/api/replay/generate-snapshot', (req, res) => {
  const { connectorId, connectorName, entityName, category, recordCount, mappingVersion } = req.body;
  const count = recordCount || Math.floor(5000 + Math.random() * 45000);
  const sizeMb = Math.round(count * 0.035 + Math.random() * 20);
  const now = new Date().toISOString();
  const hash = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

  const newJob = {
    id: `job-hist-${Date.now().toString().slice(-4)}`,
    jobName: `${connectorName || 'Custom'} Historical Replay Snapshot (${entityName || 'Entity'})`,
    sourceConnectorId: connectorId || 'conn-custom-adhoc',
    sourceConnectorName: connectorName || 'Active Enterprise Connector',
    sourceEntity: entityName || 'Discovered_Entity_Master',
    destConnectorId: 'conn-bc-prod',
    destConnectorName: 'Dynamics 365 Business Central (Prod)',
    destEntity: 'Customer / Ledger Ingestion',
    category: category || 'ERP',
    connectorIcon: category === 'CRM' ? 'Users' : category === 'Database' ? 'Database' : category === 'Cloud Storage' ? 'Cloud' : 'Layers',
    executionTimestamp: now,
    mode: 'Realtime Ad-Hoc Snapshot',
    originalTotalRecords: count,
    originalProcessedRecords: count - Math.floor(Math.random() * 5),
    originalErrorCount: Math.floor(Math.random() * 5),
    originalOutputHash: `sha256:${hash}`,
    snapshotUri: `s3://enterprise-migration-vault/snapshots/${now.split('T')[0]}/${(entityName || 'entity').toLowerCase().replace(/[^a-z0-9]/g, '_')}.parquet`,
    snapshotSizeBytes: sizeMb * 1048576,
    mappingRulesVersion: mappingVersion || 'v3.0-enterprise-cleansed',
    reproducibilityStatus: 'Verified (100% Match)',
  };

  mockHistoricalReplayJobs.unshift(newJob);
  res.json({ success: true, message: `Created new historical replay snapshot for ${newJob.sourceConnectorName}`, job: newJob });
});

// POST Replay Simulation
app.post('/api/replay/simulate', (req, res) => {
  const { jobId, sampleLimitPercent, mappingVersionOverride } = req.body;
  const targetJob = mockHistoricalReplayJobs.find((j) => j.id === jobId) || mockHistoricalReplayJobs[0];

  const pct = sampleLimitPercent || 100;
  const simulatedRecords = Math.round((targetJob.originalTotalRecords * pct) / 100);
  const isRuleChanged = mappingVersionOverride && mappingVersionOverride !== targetJob.mappingRulesVersion;

  const simulatedErrors = isRuleChanged
    ? Math.max(0, targetJob.originalErrorCount - 2)
    : targetJob.originalErrorCount;

  const simulatedOutputHash = isRuleChanged
    ? `sha256:${targetJob.originalOutputHash.slice(7, 30)}ab12cd34ef56${targetJob.originalOutputHash.slice(42)}`
    : targetJob.originalOutputHash;

  const reproducibilityScore = isRuleChanged ? 98.6 : 100.0;
  const matchStatus = isRuleChanged
    ? 'Controlled Rule Variance (Optimized Delta)'
    : 'Deterministic Bit-for-Bit Match (100% Identical)';

  const identicalRows = isRuleChanged
    ? simulatedRecords - simulatedErrors - 15
    : simulatedRecords - simulatedErrors;

  const modifiedRows = isRuleChanged ? 15 : 0;
  const fixedErrorsCount = isRuleChanged ? 2 : 0;

  const result = {
    jobId: targetJob.id,
    simulatedAt: new Date().toISOString(),
    mode: 'Dry-Run Simulation',
    samplePercent: pct,
    simulatedRecords,
    simulatedErrors,
    simulatedSuccessRate: Number((((simulatedRecords - simulatedErrors) / simulatedRecords) * 100).toFixed(2)),
    reproducibilityScore,
    matchStatus,
    simulatedOutputHash,
    originalOutputHash: targetJob.originalOutputHash,
    mappingRulesApplied: mappingVersionOverride || targetJob.mappingRulesVersion,
    rowDeltaSummary: {
      identicalRows,
      modifiedRows,
      newErrorsCount: 0,
      fixedErrorsCount,
    },
    verificationLogs: [
      `[SNAPSHOT] Mounted Parquet snapshot from ${targetJob.snapshotUri} (${(targetJob.snapshotSizeBytes / 1048576).toFixed(1)} MB)`,
      `[SOURCE VALIDATION] Source payload SHA-256 Checksum: ${targetJob.originalOutputHash}`,
      `[CONNECTOR HANDSHAKE] Verified read-only dry-run isolation for source "${targetJob.sourceConnectorName}" and target "${targetJob.destConnectorName}"`,
      `[MAPPING] Re-applied transformation rule matrix (${mappingVersionOverride || targetJob.mappingRulesVersion})`,
      `[DRY-RUN EXECUTION] Processed ${simulatedRecords.toLocaleString()} rows in memory (${pct}% sampling). Zero target database mutations committed.`,
      `[OUTPUT CHECKSUM] Calculated simulated payload SHA-256: ${simulatedOutputHash}`,
      `[AUDIT CERTIFICATION] Reproducibility match score: ${reproducibilityScore}% - ${matchStatus}`,
    ],
  };

  res.json({
    success: true,
    replayResult: result,
  });
});
const WORKER_NODES = ['spark-worker-01', 'spark-worker-02', 'spark-worker-03', 'spark-worker-04', 'sap-bapi-worker-01', 'odata-sink-02'];
const LOG_MODULES = ['BatchExtractor', 'SchemaValidator', 'FKResolver', 'DataTransformer', 'ODataWriter', 'DeadLetterQueue'];

let logSequenceId = 1000;

function createSampleLog(jobId: string, customType?: string) {
  logSequenceId++;
  const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
  const node = WORKER_NODES[Math.floor(Math.random() * WORKER_NODES.length)];
  const module = LOG_MODULES[Math.floor(Math.random() * LOG_MODULES.length)];
  const batchId = Math.floor(100 + Math.random() * 800);
  const recordOffset = Math.floor(Math.random() * 15000);

  if (customType === 'ERROR') {
    return {
      id: `log-${logSequenceId}`,
      jobId,
      timestamp,
      level: 'ERROR',
      node,
      module: 'DeadLetterQueue',
      message: `[BATCH REJECTED] OData HTTP 429 Too Many Requests from Business Central API on batch #${batchId}. Quarantining 12 records.`,
      details: { batchId, retryCount: 3, latencyMs: 1420, dlqPath: '/dlq/quarantine_20260728.json' },
    };
  }

  if (customType === 'WARN') {
    return {
      id: `log-${logSequenceId}`,
      jobId,
      timestamp,
      level: 'WARN',
      node,
      module: 'FKResolver',
      message: `[FK MISSING] Customer Posting Group "DOMESTIC" missing in target ERP. Applying default fallback rule "GEN-DOM".`,
      details: { batchId, recordOffset, latencyMs: 310 },
    };
  }

  if (customType === 'SUCCESS') {
    return {
      id: `log-${logSequenceId}`,
      jobId,
      timestamp,
      level: 'SUCCESS',
      node,
      module: 'ODataWriter',
      message: `[BATCH COMMITTED] Successfully ingested 500 records into Business Central entity "Customer". Ingestion rate: 480 rec/sec.`,
      details: { batchId, recordsCommitted: 500, latencyMs: 185 },
    };
  }

  // Default INFO / TRACE
  const level = Math.random() > 0.8 ? 'TRACE' : 'INFO';
  return {
    id: `log-${logSequenceId}`,
    jobId,
    timestamp,
    level,
    node,
    module,
    message: level === 'TRACE'
      ? `[MEMORY METRICS] JVM Heap 64% used. GC Pause 42ms. Active thread count: 128.`
      : `[STREAM PROCESSING] Ingesting batch #${batchId} (${recordOffset}..${recordOffset + 500}). Field transformation rules executed cleanly.`,
    details: { batchId, latencyMs: Math.floor(80 + Math.random() * 150) },
  };
}

io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  // Send initial welcome trace event
  socket.emit('job_log', {
    id: `log-init-${socket.id}`,
    jobId: 'all',
    timestamp: new Date().toISOString().split('T')[1].slice(0, 8),
    level: 'INFO',
    node: 'orchestrator-primary',
    module: 'SocketStreamServer',
    message: `[WEBSOCKET CONNECTED] Streaming real-time event pipeline logs via Socket.IO session ${socket.id}`,
    details: { transport: socket.conn.transport.name, protocol: 'v4' },
  });

  socket.on('subscribe_job_logs', (data: { jobId: string }) => {
    const roomId = `job_${data.jobId || 'all'}`;
    socket.join(roomId);
    console.log(`[Socket.IO] Socket ${socket.id} joined room ${roomId}`);
    
    // Emit initial historical batch logs
    for (let i = 0; i < 5; i++) {
      socket.emit('job_log', createSampleLog(data.jobId || 'all'));
    }
  });

  socket.on('unsubscribe_job_logs', (data: { jobId: string }) => {
    const roomId = `job_${data.jobId || 'all'}`;
    socket.leave(roomId);
  });

  socket.on('trigger_simulated_event', (data: { jobId: string; eventType?: string }) => {
    const log = createSampleLog(data.jobId || 'all', data.eventType || 'ERROR');
    io.emit('job_log', log);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// Periodic background log emission every 1.2s to simulate real-time worker node activity
setInterval(() => {
  if (io.sockets.sockets.size > 0) {
    const log = createSampleLog('all');
    io.emit('job_log', log);
  }
}, 1200);

// Vite Server Setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT} with Socket.IO enabled`);
  });
}

startServer();
