import React, { useState, useEffect } from 'react';
import { Globe, KeyRound, Lock, FileCode2, Activity, ArrowUpRight, Zap, RefreshCw, Server, AlertCircle, Plus, Copy, Check, X, Shield, Eye, EyeOff, Download, Code, Terminal, Clock, ShieldCheck, Database, Settings, BarChart3, Beaker, Upload, FileJson, ShieldAlert, PlayCircle, ArrowRightLeft } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CliDownloadModal } from './CliDownloadModal';

export default function RestApiPlatformView() {
  const [activeTab, setActiveTab] = useState<'monitoring' | 'analytics' | 'api-keys' | 'oauth' | 'rate-limiting' | 'endpoints' | 'sdks' | 'security' | 'mocking' | 'scanner' | 'migration'>('monitoring');

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

  useEffect(() => {
    if (activeTab !== 'migration') return;
    const interval = setInterval(() => {
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
    }, 1500);
    return () => clearInterval(interval);
  }, [activeTab]);

  const apiVolumeData = [
    { date: 'Aug 01', requests: 120000, bandwidth: 45 },
    { date: 'Aug 02', requests: 135000, bandwidth: 52 },
    { date: 'Aug 03', requests: 110000, bandwidth: 38 },
    { date: 'Aug 04', requests: 180000, bandwidth: 70 },
    { date: 'Aug 05', requests: 165000, bandwidth: 65 },
    { date: 'Aug 06', requests: 210000, bandwidth: 85 },
    { date: 'Aug 07', requests: 195000, bandwidth: 78 },
  ];

  const throttlingInsightsData = [
    { day: 'Mon', data: [12, 10, 8, 5, 15, 30, 60, 80, 95, 90, 70, 50, 45, 40, 55, 70, 85, 60, 40, 25, 20, 15, 10, 8] },
    { day: 'Tue', data: [15, 12, 9, 6, 18, 35, 65, 85, 100, 95, 75, 55, 50, 45, 60, 75, 90, 65, 45, 30, 25, 18, 12, 10] },
    { day: 'Wed', data: [14, 11, 8, 5, 16, 32, 62, 82, 98, 92, 72, 52, 48, 42, 58, 72, 88, 62, 42, 28, 22, 16, 11, 9] },
    { day: 'Thu', data: [16, 13, 10, 7, 20, 40, 70, 90, 105, 100, 80, 60, 55, 50, 65, 80, 95, 70, 50, 35, 30, 20, 15, 12] },
    { day: 'Fri', data: [18, 15, 12, 9, 22, 42, 72, 92, 102, 98, 78, 58, 52, 48, 62, 78, 85, 60, 45, 30, 25, 18, 12, 10] },
    { day: 'Sat', data: [25, 20, 15, 12, 15, 25, 40, 50, 60, 65, 55, 45, 40, 35, 40, 45, 50, 40, 30, 20, 15, 12, 10, 8] },
    { day: 'Sun', data: [22, 18, 14, 10, 12, 20, 35, 45, 55, 60, 50, 40, 35, 30, 35, 40, 45, 35, 25, 18, 14, 10, 8, 6] },
  ];

  const topClientsData = [
    { name: 'Mobile App', volume: 850000 },
    { name: 'Internal Dashboard', volume: 620000 },
    { name: 'Partner API (Acme)', volume: 310000 },
    { name: 'Zapier Integration', volume: 150000 },
    { name: 'Data Pipeline Sync', volume: 80000 },
  ];

  const [metrics, setMetrics] = useState({
    rps: 124,
    latency: 45,
    errorRate: 0.2,
  });

  const [logs, setLogs] = useState([
    { id: 'req-001', method: 'POST', endpoint: '/api/v2/jobs/job-101/start', status: 200, time: 'Just now', latency: 42 },
    { id: 'req-002', method: 'GET', endpoint: '/api/v2/connectors/status', status: 200, time: '2s ago', latency: 15 },
    { id: 'req-003', method: 'GET', endpoint: '/graphql', status: 200, time: '5s ago', latency: 28 },
    { id: 'req-004', method: 'POST', endpoint: '/api/v2/webhooks/salesforce', status: 401, time: '12s ago', latency: 8 },
    { id: 'req-005', method: 'GET', endpoint: '/api/v2/metrics/throughput', status: 200, time: '18s ago', latency: 55 },
  ]);

  const [apiKeys, setApiKeys] = useState<{ id: string; name: string; keyStr: string; type: string; status: string; lastUsed: string; fullKey?: string }[]>([
    { id: 'key-1', name: 'Production Webhook Key', keyStr: 'pk_live_*******************39a', type: 'live', status: 'Active', lastUsed: '2 mins ago' },
    { id: 'key-2', name: 'Development Sandbox Key', keyStr: 'pk_test_*******************8f2', type: 'test', status: 'Inactive', lastUsed: '3 days ago' }
  ]);

  const [oauthClients, setOauthClients] = useState([
    { id: 'client-1', name: 'Internal Dashboard', clientId: 'cli_8xj29fk', redirectUris: ['https://dashboard.internal/callback'], status: 'Active' },
    { id: 'client-2', name: 'Mobile App', clientId: 'cli_94mx3la', redirectUris: ['app://login/callback'], status: 'Active' }
  ]);

  const [oauthScopes, setOauthScopes] = useState([
    { id: 'scope-1', scope: 'read:jobs', description: 'Read access to migration jobs', grantedTo: ['Internal Dashboard', 'User: admin@company.com'], lastAccessed: '1 hour ago' },
    { id: 'scope-2', scope: 'write:jobs', description: 'Create and update migration jobs', grantedTo: ['Internal Dashboard'], lastAccessed: '1 hour ago' },
    { id: 'scope-3', scope: 'read:connectors', description: 'Read access to connector configurations', grantedTo: ['Mobile App', 'User: data-eng@company.com'], lastAccessed: '3 hours ago' },
    { id: 'scope-4', scope: 'write:connectors', description: 'Create and update connector configurations', grantedTo: ['Internal Dashboard'], lastAccessed: '1 day ago' },
    { id: 'scope-5', scope: 'admin:billing', description: 'Manage billing and subscriptions', grantedTo: ['User: finance@company.com'], lastAccessed: '2 days ago' },
  ]);

  const [rateLimits, setRateLimits] = useState([
    { id: 'rl-1', name: 'Free Tier', maxRequests: 100, window: '1 minute', appliedTo: 'All endpoints' },
    { id: 'rl-2', name: 'Premium Tier', maxRequests: 10000, window: '1 minute', appliedTo: 'All endpoints' },
    { id: 'rl-3', name: 'Auth Endpoints', maxRequests: 5, window: '1 minute', appliedTo: '/auth/*' },
  ]);

  const [mockEndpoints, setMockEndpoints] = useState([
    { id: 'mock-1', method: 'GET', path: '/v2/jobs', status: 200, response: '{\n  "data": [\n    { "id": "job-1", "status": "running" }\n  ]\n}', active: true },
    { id: 'mock-2', method: 'POST', path: '/v2/jobs/:id/start', status: 202, response: '{\n  "status": "accepted"\n}', active: true },
  ]);

  const [showCreateMockModal, setShowCreateMockModal] = useState(false);
  const [newMockForm, setNewMockForm] = useState({ method: 'GET', path: '/v2/test', status: '200', response: '{\n  "message": "success"\n}' });

  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal State
  const [showGenerateSdkModal, setShowGenerateSdkModal] = useState(false);
  const [selectedSdkLang, setSelectedSdkLang] = useState('typescript');
  const [selectedLibrary, setSelectedLibrary] = useState('axios');
  const [selectedApiVersion, setSelectedApiVersion] = useState('v2');
  const [savedPresets, setSavedPresets] = useState([
    { id: 'p1', name: 'TS + Axios (v2)', lang: 'typescript', library: 'axios', version: 'v2' },
    { id: 'p2', name: 'JS + Fetch (v2)', lang: 'javascript', library: 'fetch', version: 'v2' },
  ]);
  const [generatedSdkCode, setGeneratedSdkCode] = useState('');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showCliModal, setShowCliModal] = useState(false);
  const [showSwaggerImportModal, setShowSwaggerImportModal] = useState(false);
  const [swaggerImportStep, setSwaggerImportStep] = useState<'input' | 'processing' | 'success'>('input');
  const [swaggerInput, setSwaggerInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<{ id: string, type: string, endpoint: string, severity: 'High' | 'Medium' | 'Low', description: string }[] | null>(null);
  const [newKeyForm, setNewKeyForm] = useState({ name: '', type: 'test' });
  const [generatedKeyResult, setGeneratedKeyResult] = useState<any>(null);
  const [showSecret, setShowSecret] = useState(false);

  const handleGenerateKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isLive = newKeyForm.type === 'live';
    const prefix = isLive ? 'sk_live_' : 'sk_test_';
    
    // Generate a secure looking key
    const array = new Uint8Array(24);
    window.crypto.getRandomValues(array);
    const randomStr = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    
    const fullKey = `${prefix}${randomStr}`;
    const maskedKeyStr = `${prefix}${randomStr.substring(0, 4)}*******************${randomStr.substring(randomStr.length - 4)}`;
    
    const newKey = {
      id: `key-${Date.now()}`,
      name: newKeyForm.name || `Generated ${isLive ? 'Production' : 'Sandbox'} Key`,
      keyStr: maskedKeyStr,
      type: newKeyForm.type,
      status: 'Active',
      lastUsed: 'Never',
      fullKey: fullKey,
      createdAt: new Date().toISOString()
    };
    
    setApiKeys(prev => [newKey, ...prev]);
    setGeneratedKeyResult(newKey);
  };

  const closeAndResetModal = () => {
    setShowGenerateModal(false);
    setTimeout(() => {
      setGeneratedKeyResult(null);
      setNewKeyForm({ name: '', type: 'test' });
      setShowSecret(false);
    }, 300);
  };

  const loadPreset = (presetId: string) => {
    const p = savedPresets.find(x => x.id === presetId);
    if (p) {
      setSelectedSdkLang(p.lang);
      setSelectedLibrary(p.library);
      setSelectedApiVersion(p.version);
    }
  };

  const saveCurrentAsPreset = () => {
    const name = `${selectedSdkLang.toUpperCase()} + ${selectedLibrary} (${selectedApiVersion})`;
    setSavedPresets([...savedPresets, {
      id: Date.now().toString(),
      name,
      lang: selectedSdkLang,
      library: selectedLibrary,
      version: selectedApiVersion
    }]);
  };

  const handleGenerateSdk = () => {
    let code = '';
    if (selectedSdkLang === 'typescript' && selectedLibrary === 'axios') {
      code = `import axios from 'axios';

export class ApiClient {
  private client;

  constructor(apiKey: string) {
    this.client = axios.create({
      baseURL: 'https://api.example.com',
      headers: {
        'Authorization': \`Bearer \${apiKey}\`,
        'Content-Type': 'application/json'
      }
    });
  }

  async getJobs(status?: string) {
    const res = await this.client.get('/${selectedApiVersion}/jobs', { params: { status } });
    return res.data;
  }

  async startJob(jobId: string) {
    const res = await this.client.post(\`/${selectedApiVersion}/jobs/\${jobId}/start\`);
    return res.data;
  }
}
`;
    } else if (selectedSdkLang === 'typescript' && selectedLibrary === 'fetch') {
      code = `export class ApiClient {
  private apiKey: string;
  private baseUrl = 'https://api.example.com';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async fetch(path: string, options: RequestInit = {}) {
    const res = await fetch(\`\${this.baseUrl}\${path}\`, {
      ...options,
      headers: {
        'Authorization': \`Bearer \${this.apiKey}\`,
        'Content-Type': 'application/json',
        ...options.headers,
      }
    });
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  }

  async getJobs(status?: string) {
    const qs = status ? \`?status=\${status}\` : '';
    return this.fetch(\`/${selectedApiVersion}/jobs\${qs}\`);
  }

  async startJob(jobId: string) {
    return this.fetch(\`/${selectedApiVersion}/jobs/\${jobId}/start\`, { method: 'POST' });
  }
}
`;
    } else if (selectedSdkLang === 'javascript' && selectedLibrary === 'axios') {
      code = `import axios from 'axios';

class ApiClient {
  constructor(apiKey) {
    this.client = axios.create({
      baseURL: 'https://api.example.com',
      headers: {
        'Authorization': \`Bearer \${apiKey}\`,
        'Content-Type': 'application/json'
      }
    });
  }

  async getJobs(status) {
    const res = await this.client.get(\`/${selectedApiVersion}/jobs\`, { params: { status } });
    return res.data;
  }

  async startJob(jobId) {
    const res = await this.client.post(\`/${selectedApiVersion}/jobs/\${jobId}/start\`);
    return res.data;
  }
}

export default ApiClient;
`;
    } else if (selectedSdkLang === 'javascript' && selectedLibrary === 'fetch') {
      code = `class ApiClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.example.com';
  }

  async _fetch(path, options = {}) {
    const res = await fetch(\`\${this.baseUrl}\${path}\`, {
      ...options,
      headers: {
        'Authorization': \`Bearer \${this.apiKey}\`,
        'Content-Type': 'application/json',
        ...options.headers,
      }
    });
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  }

  async getJobs(status) {
    const qs = status ? \`?status=\${status}\` : '';
    return this._fetch(\`/${selectedApiVersion}/jobs\${qs}\`);
  }

  async startJob(jobId) {
    return this._fetch(\`/${selectedApiVersion}/jobs/\${jobId}/start\`, { method: 'POST' });
  }
}

export default ApiClient;
`;
    } else if (selectedSdkLang === 'python') {
      code = `import requests

class ApiClient:
    def __init__(self, api_key: str):
        self.base_url = 'https://api.example.com'
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        })

    def get_jobs(self, status: str = None):
        params = {'status': status} if status else {}
        res = self.session.get(f'{self.base_url}/${selectedApiVersion}/jobs', params=params)
        res.raise_for_status()
        return res.json()

    def start_job(self, job_id: str):
        res = self.session.post(f'{self.base_url}/${selectedApiVersion}/jobs/{job_id}/start')
        res.raise_for_status()
        return res.json()
`;
    } else if (selectedSdkLang === 'java') {
      code = `import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URI;
import java.time.Duration;

public class ApiClient {
    private final HttpClient client;
    private final String baseUrl = "https://api.example.com";
    private final String apiKey;

    public ApiClient(String apiKey) {
        this.apiKey = apiKey;
        this.client = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_2)
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public String getJobs(String status) throws Exception {
        String url = baseUrl + "/${selectedApiVersion}/jobs" + (status != null ? "?status=" + status : "");
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Authorization", "Bearer " + this.apiKey)
                .GET()
                .build();
        
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        return response.body();
    }
}
`;
    }
    setGeneratedSdkCode(code);
  };

  useEffect(() => {
    if (selectedSdkLang === 'typescript' || selectedSdkLang === 'javascript') {
      if (selectedLibrary !== 'axios' && selectedLibrary !== 'fetch') setSelectedLibrary('axios');
    } else if (selectedSdkLang === 'python') {
      setSelectedLibrary('requests');
    } else if (selectedSdkLang === 'java') {
      setSelectedLibrary('httpclient');
    }
  }, [selectedSdkLang]);

  useEffect(() => {
    if (showGenerateSdkModal) {
      handleGenerateSdk();
    }
  }, [selectedSdkLang, selectedLibrary, selectedApiVersion, showGenerateSdkModal]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics({
        rps: Math.floor(Math.random() * 50) + 100,
        latency: Math.floor(Math.random() * 20) + 30,
        errorRate: Number((Math.random() * 0.5).toFixed(2)),
      });

      const endpoints = ['/api/v2/jobs/job-101/start', '/api/v2/connectors/status', '/graphql', '/api/v2/webhooks/salesforce', '/api/v2/metrics/throughput'];
      const methods = ['GET', 'POST', 'PUT'];
      const statuses = [200, 201, 200, 200, 401, 500];

      const newLog = {
        id: `req-${Math.random().toString(36).substr(2, 5)}`,
        method: methods[Math.floor(Math.random() * methods.length)],
        endpoint: endpoints[Math.floor(Math.random() * endpoints.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        time: 'Just now',
        latency: Math.floor(Math.random() * 100) + 10,
      };

      setLogs(prev => {
        const updated = [newLog, ...prev.map(l => ({ ...l, time: l.time === 'Just now' ? '2s ago' : l.time }))].slice(0, 5);
        return updated;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleSwaggerImportSubmit = () => {
    setSwaggerImportStep('processing');
    setTimeout(() => {
      setSwaggerImportStep('success');
    }, 1500);
  };

  const handleRunScan = () => {
    setIsScanning(true);
    setScanResults(null);
    setTimeout(() => {
      setScanResults([
        { id: 'vuln-1', type: 'Broken Authentication', endpoint: '/v2/jobs', severity: 'High', description: 'Missing robust JWT validation on this endpoint. The signature is not being correctly verified.' },
        { id: 'vuln-2', type: 'Injection', endpoint: '/v2/jobs/:id/start', severity: 'High', description: 'Possible SQL injection in the job ID parameter. Sanitize inputs before database queries.' },
        { id: 'vuln-3', type: 'Insecure Headers', endpoint: '/auth/login', severity: 'Medium', description: 'Missing Security Headers: Strict-Transport-Security (HSTS) is not set.' },
        { id: 'vuln-4', type: 'Rate Limiting', endpoint: '/auth/reset-password', severity: 'Medium', description: 'Endpoint lacks sufficient rate limiting, susceptible to brute-force attacks.' },
        { id: 'vuln-5', type: 'Information Disclosure', endpoint: '/v2/users', severity: 'Low', description: 'Verbose error messages leak internal server implementation details.' },
      ]);
      setIsScanning(false);
    }, 2500);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Globe className="w-6 h-6 text-indigo-600" />
            API Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage API keys, OAuth clients, rate limits, and monitor traffic for REST & GraphQL endpoints.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowSwaggerImportModal(true)}
            className="px-4 py-2 bg-indigo-50 text-indigo-700 text-sm font-semibold rounded-lg hover:bg-indigo-100 border border-indigo-100 transition flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Upload className="w-4 h-4 text-indigo-600" /> Import Swagger / OpenAPI
          </button>
          <button 
            onClick={() => setShowCliModal(true)}
            className="px-4 py-2 bg-white text-indigo-700 text-sm font-semibold rounded-lg hover:bg-slate-50 border border-indigo-200 transition flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4 text-indigo-600" /> Download CLI Tools
          </button>
        </div>
      </div>

      <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl w-fit">
        {[
          { id: 'monitoring', label: 'Monitoring', icon: <Activity className="w-4 h-4" /> },
          { id: 'analytics', label: 'Usage Analytics', icon: <BarChart3 className="w-4 h-4" /> },
          { id: 'api-keys', label: 'API Keys', icon: <KeyRound className="w-4 h-4" /> },
          { id: 'oauth', label: 'OAuth Clients', icon: <ShieldCheck className="w-4 h-4" /> },
          { id: 'rate-limiting', label: 'Rate Limiting', icon: <Clock className="w-4 h-4" /> },
          { id: 'endpoints', label: 'Endpoints', icon: <Server className="w-4 h-4" /> },
          { id: 'mocking', label: 'API Mocking', icon: <Beaker className="w-4 h-4" /> },
          { id: 'scanner', label: 'Security Scanner', icon: <ShieldAlert className="w-4 h-4" /> },
          { id: 'migration', label: 'Migration Health', icon: <ArrowRightLeft className="w-4 h-4" /> },
          { id: 'sdks', label: 'SDKs & Docs', icon: <Code className="w-4 h-4" /> },
          { id: 'security', label: 'Security & Scopes', icon: <Lock className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 transition-all ${
              activeTab === tab.id
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-4 space-y-6">
          
          {activeTab === 'analytics' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600">Track API usage, bandwidth, and identify top-consuming clients to inform rate-limiting strategies.</p>
                <div className="flex gap-2">
                  <select className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer">
                    <option>Last 7 Days</option>
                    <option>Last 30 Days</option>
                    <option>This Month</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
                  <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-600" /> Daily API Request Volume
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={apiVolumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `${val / 1000}k`} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          formatter={(value: number) => [new Intl.NumberFormat('en').format(value), 'Requests']}
                        />
                        <Area type="monotone" dataKey="requests" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRequests)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
                  <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-sky-600" /> Bandwidth Consumption (GB)
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={apiVolumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorBandwidth" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          formatter={(value: number) => [`${value} GB`, 'Bandwidth']}
                        />
                        <Area type="monotone" dataKey="bandwidth" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorBandwidth)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 lg:col-span-2">
                  <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-emerald-600" /> Top Consuming Client IDs
                  </h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topClientsData} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `${val / 1000}k`} />
                        <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#475569', fontWeight: 500 }} width={140} />
                        <Tooltip 
                          cursor={{ fill: '#f1f5f9' }}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          formatter={(value: number) => [new Intl.NumberFormat('en').format(value), 'Total Requests']}
                        />
                        <Bar dataKey="volume" fill="#10b981" radius={[0, 4, 4, 0]} barSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'monitoring' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Requests / Sec</p>
                    <div className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                      {metrics.rps} <span className="text-xs font-normal text-emerald-500 flex items-center"><ArrowUpRight className="w-3 h-3"/> +12%</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-sky-50 text-sky-600 rounded-lg">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Avg Latency</p>
                    <div className="text-2xl font-bold text-slate-800">
                      {metrics.latency} <span className="text-sm font-normal text-slate-500">ms</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Error Rate</p>
                    <div className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                      {metrics.errorRate}% {metrics.errorRate > 0.3 && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <span className="font-bold text-slate-700 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-indigo-500" /> Live API Traffic
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xs font-medium text-slate-500">Listening</span>
                  </div>
                </div>
                <div className="p-0 overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 bg-slate-50 uppercase border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-3 font-semibold">Method & Endpoint</th>
                        <th className="px-6 py-3 font-semibold text-center">Status</th>
                        <th className="px-6 py-3 font-semibold text-right">Latency</th>
                        <th className="px-6 py-3 font-semibold text-right">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-3 font-mono text-xs">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold mr-2 ${
                              log.method === 'GET' ? 'bg-blue-100 text-blue-700' : 
                              log.method === 'POST' ? 'bg-emerald-100 text-emerald-700' : 
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {log.method}
                            </span>
                            <span className="text-slate-700">{log.endpoint}</span>
                          </td>
                          <td className="px-6 py-3 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              log.status < 300 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 
                              log.status < 500 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 
                              'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {log.status}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-right font-mono text-slate-500">
                            {log.latency}ms
                          </td>
                          <td className="px-6 py-3 text-right text-slate-400 text-xs">
                            {log.time}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'api-keys' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600">Use these keys to authenticate API requests from your backend services.</p>
                <button 
                  onClick={() => setShowGenerateModal(true)}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 shadow-sm shadow-indigo-200 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Generate API Key
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 font-bold text-slate-700 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-slate-500" /> Active API Keys
                </div>
                <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
                  {apiKeys.map((apiKey) => (
                    <div key={apiKey.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-100 rounded-lg bg-slate-50/50 hover:bg-slate-50 transition gap-4">
                      <div className="flex items-start sm:items-center gap-3">
                        <div className={`p-2 rounded-lg ${apiKey.type === 'live' ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-600'}`}>
                          <KeyRound className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            {apiKey.name}
                            {apiKey.fullKey && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold uppercase">New</span>}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="text-xs text-slate-500 font-mono">{apiKey.fullKey || apiKey.keyStr}</div>
                            {(apiKey.fullKey || apiKey.keyStr) && (
                              <button 
                                onClick={() => copyToClipboard(apiKey.fullKey || apiKey.keyStr, apiKey.id)}
                                className="text-slate-400 hover:text-indigo-600 transition"
                                title="Copy to clipboard"
                              >
                                {copiedId === apiKey.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 flex flex-row sm:flex-col items-center sm:items-end gap-2 sm:gap-1 w-full sm:w-auto justify-between sm:justify-start border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${apiKey.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                          {apiKey.status}
                        </span>
                        <span>Last used: {apiKey.status === 'Active' && metrics.rps > 100 && apiKey.type === 'live' ? 'Just now' : apiKey.lastUsed}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'oauth' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600">Register OAuth 2.0 clients to allow users to authenticate and authorize access securely.</p>
                <button 
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 shadow-sm shadow-indigo-200 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Create OAuth Client
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 font-bold text-slate-700 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-slate-500" /> OAuth 2.0 Clients
                </div>
                <div className="p-0 overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 bg-slate-50 uppercase border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-3 font-semibold">Client Name</th>
                        <th className="px-6 py-3 font-semibold">Client ID</th>
                        <th className="px-6 py-3 font-semibold">Redirect URIs</th>
                        <th className="px-6 py-3 font-semibold text-center">Status</th>
                        <th className="px-6 py-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {oauthClients.map((client) => (
                        <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-3 font-medium text-slate-800">{client.name}</td>
                          <td className="px-6 py-3 font-mono text-xs text-slate-600">{client.clientId}</td>
                          <td className="px-6 py-3 text-xs text-slate-500 truncate max-w-xs">{client.redirectUris.join(', ')}</td>
                          <td className="px-6 py-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">{client.status}</span>
                          </td>
                          <td className="px-6 py-3 text-right">
                            <button className="text-indigo-600 hover:text-indigo-800 text-xs font-medium cursor-pointer">Edit</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'rate-limiting' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600">Configure rate limit policies to protect your APIs from abuse and enforce quotas.</p>
                <button 
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 shadow-sm shadow-indigo-200 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Rate Limit Rule
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 font-bold text-slate-700 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500" /> Rate Limit Policies
                </div>
                <div className="p-0 overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 bg-slate-50 uppercase border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-3 font-semibold">Policy Name</th>
                        <th className="px-6 py-3 font-semibold">Limit</th>
                        <th className="px-6 py-3 font-semibold">Window</th>
                        <th className="px-6 py-3 font-semibold">Applied To</th>
                        <th className="px-6 py-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rateLimits.map((rl) => (
                        <tr key={rl.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-3 font-medium text-slate-800">{rl.name}</td>
                          <td className="px-6 py-3 text-slate-600">{rl.maxRequests} req</td>
                          <td className="px-6 py-3 text-slate-500">{rl.window}</td>
                          <td className="px-6 py-3 font-mono text-xs text-slate-600">{rl.appliedTo}</td>
                          <td className="px-6 py-3 text-right">
                            <button className="text-indigo-600 hover:text-indigo-800 text-xs font-medium cursor-pointer">Edit</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mt-6">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 font-bold text-slate-700 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-slate-500" /> Throttling Insights (Requests per hour)
                </div>
                <div className="p-6 overflow-x-auto">
                  <div className="min-w-max">
                    <div className="flex mb-2">
                      <div className="w-12"></div>
                      {Array.from({ length: 24 }).map((_, i) => (
                        <div key={i} className="flex-1 text-center text-xs text-slate-500 font-medium w-8">
                          {i % 3 === 0 ? `${i}h` : ''}
                        </div>
                      ))}
                    </div>
                    {throttlingInsightsData.map((row) => (
                      <div key={row.day} className="flex mb-1 items-center">
                        <div className="w-12 text-xs text-slate-500 font-medium">{row.day}</div>
                        {row.data.map((val, j) => {
                          const opacity = Math.max(0.1, val / 110);
                          return (
                            <div 
                              key={j} 
                              className="flex-1 w-8 h-8 rounded-sm mx-0.5"
                              style={{ backgroundColor: `rgba(99, 102, 241, ${opacity})` }}
                              title={`${row.day} ${j}:00 - ${val} requests/min`}
                            ></div>
                          );
                        })}
                      </div>
                    ))}
                    <div className="flex items-center justify-end mt-4 text-xs text-slate-500 gap-2">
                      <span>Less traffic</span>
                      <div className="flex gap-1">
                        <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)' }}></div>
                        <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: 'rgba(99, 102, 241, 0.4)' }}></div>
                        <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: 'rgba(99, 102, 241, 0.7)' }}></div>
                        <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: 'rgba(99, 102, 241, 1)' }}></div>
                      </div>
                      <span>More traffic</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'endpoints' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-200">
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-indigo-600" /> REST APIs
                </h3>
                <div className="space-y-4">
                  <div className="border border-slate-100 rounded-lg p-3">
                    <div className="text-xs font-bold text-slate-800 mb-2 uppercase tracking-wide">Jobs API</div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-mono"><span className="text-blue-600 font-bold">GET</span> /v2/jobs</div>
                      <div className="flex items-center gap-2 text-xs font-mono"><span className="text-emerald-600 font-bold">POST</span> /v2/jobs/:id/start</div>
                    </div>
                  </div>
                  <div className="border border-slate-100 rounded-lg p-3">
                    <div className="text-xs font-bold text-slate-800 mb-2 uppercase tracking-wide">Connectors API</div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-mono"><span className="text-blue-600 font-bold">GET</span> /v2/connectors</div>
                      <div className="flex items-center gap-2 text-xs font-mono"><span className="text-emerald-600 font-bold">POST</span> /v2/connectors/sync</div>
                    </div>
                  </div>
                  <button className="w-full py-2 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition cursor-pointer">
                    View Swagger Docs &rarr;
                  </button>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Database className="w-5 h-5 text-pink-600" /> GraphQL API
                </h3>
                <div className="space-y-4">
                  <p className="text-sm text-slate-600">Query exactly the data you need from our unified graph endpoint.</p>
                  
                  <div className="border border-slate-100 rounded-lg p-3 bg-slate-50">
                    <div className="text-xs font-bold text-slate-800 mb-2 uppercase tracking-wide">Endpoint</div>
                    <div className="flex items-center justify-between gap-2 text-sm font-mono text-slate-700 bg-white border border-slate-200 p-2 rounded">
                      https://api.example.com/graphql
                      <button onClick={() => copyToClipboard('https://api.example.com/graphql', 'gql-url')} className="text-slate-400 hover:text-indigo-600 cursor-pointer">
                        {copiedId === 'gql-url' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="border border-slate-100 rounded-lg p-3 bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto">
                    <pre>{`query {
  user(id: "123") {
    name
    jobs {
      status
      startedAt
    }
  }
}`}</pre>
                  </div>

                  <button className="w-full py-2 text-xs font-medium text-pink-600 bg-pink-50 hover:bg-pink-100 rounded-lg transition cursor-pointer flex items-center justify-center gap-2">
                    Open GraphQL Playground <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sdks' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-200">
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-6 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
                    <Code className="w-5 h-5 text-indigo-600" /> Client SDKs
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:border-slate-200 hover:shadow-xs transition">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded flex items-center justify-center font-bold text-sm">TS</div>
                        <div>
                          <div className="text-sm font-bold text-slate-800">Node.js / TypeScript</div>
                          <div className="text-xs text-slate-500">v2.4.1 • npm install @api/client</div>
                        </div>
                      </div>
                      <button className="text-indigo-600 hover:text-indigo-800 cursor-pointer p-2"><Download className="w-4 h-4" /></button>
                    </div>

                    <div className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:border-slate-200 hover:shadow-xs transition">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-yellow-50 text-yellow-600 rounded flex items-center justify-center font-bold text-sm">PY</div>
                        <div>
                          <div className="text-sm font-bold text-slate-800">Python</div>
                          <div className="text-xs text-slate-500">v1.2.0 • pip install api-client</div>
                        </div>
                      </div>
                      <button className="text-indigo-600 hover:text-indigo-800 cursor-pointer p-2"><Download className="w-4 h-4" /></button>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:border-slate-200 hover:shadow-xs transition">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-cyan-50 text-cyan-600 rounded flex items-center justify-center font-bold text-sm">GO</div>
                        <div>
                          <div className="text-sm font-bold text-slate-800">Golang</div>
                          <div className="text-xs text-slate-500">v1.0.5 • go get github.com/api/go-client</div>
                        </div>
                      </div>
                      <button className="text-indigo-600 hover:text-indigo-800 cursor-pointer p-2"><Download className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 pt-6 border-t border-slate-100">
                  <button 
                    onClick={() => setShowGenerateSdkModal(true)}
                    className="w-full py-2.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition font-medium text-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Terminal className="w-4 h-4" /> Generate Custom SDK Code
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 border border-indigo-700 rounded-xl shadow-sm p-6 text-white flex flex-col justify-between">
                <div>
                  <h3 className="font-bold mb-2 flex items-center gap-2">
                    <FileCode2 className="w-5 h-5 text-indigo-300" /> API Documentation
                  </h3>
                  <p className="text-indigo-200 text-sm mb-6">Learn how to authenticate, trigger migrations, and listen to webhook events.</p>
                  <ul className="space-y-3 text-sm font-medium">
                    <li><a href="#" className="flex items-center gap-2 text-indigo-100 hover:text-white transition"><ArrowUpRight className="w-4 h-4"/> Authentication Guide</a></li>
                    <li><a href="#" className="flex items-center gap-2 text-indigo-100 hover:text-white transition"><ArrowUpRight className="w-4 h-4"/> Triggering Jobs via API</a></li>
                    <li><a href="#" className="flex items-center gap-2 text-indigo-100 hover:text-white transition"><ArrowUpRight className="w-4 h-4"/> Webhooks & Events</a></li>
                    <li><a href="#" className="flex items-center gap-2 text-indigo-100 hover:text-white transition"><ArrowUpRight className="w-4 h-4"/> Pagination & Filtering</a></li>
                  </ul>
                </div>
                
                <div className="mt-8 pt-6 border-t border-indigo-500/30">
                  <button className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition font-medium text-sm flex items-center justify-center gap-2 cursor-pointer">
                    Browse Full Documentation <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600">Review and manage active OAuth scopes granted to clients and users.</p>
                <button 
                  className="px-4 py-2 bg-rose-600 text-white text-sm font-semibold rounded-lg hover:bg-rose-700 transition flex items-center gap-2 shadow-sm shadow-rose-200 cursor-pointer"
                >
                  <Shield className="w-4 h-4" /> Revoke All Tokens
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 font-bold text-slate-700 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-500" /> Active OAuth Scopes
                </div>
                <div className="p-0 overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 bg-slate-50 uppercase border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-3 font-semibold">Scope</th>
                        <th className="px-6 py-3 font-semibold">Description</th>
                        <th className="px-6 py-3 font-semibold">Granted To</th>
                        <th className="px-6 py-3 font-semibold">Last Accessed</th>
                        <th className="px-6 py-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {oauthScopes.map((scope) => (
                        <tr key={scope.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-3 font-mono text-xs text-indigo-700 font-semibold bg-indigo-50/50">{scope.scope}</td>
                          <td className="px-6 py-3 text-slate-600 text-xs">{scope.description}</td>
                          <td className="px-6 py-3">
                            <div className="flex flex-wrap gap-1">
                                {scope.grantedTo.map(grantee => (
                                    <span key={grantee} className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">{grantee}</span>
                                ))}
                            </div>
                          </td>
                          <td className="px-6 py-3 text-xs text-slate-500">{scope.lastAccessed}</td>
                          <td className="px-6 py-3 text-right">
                            <button className="text-rose-600 hover:text-rose-800 text-xs font-medium cursor-pointer">Revoke</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'mocking' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600">Create mock endpoints to test integration logic without hitting live backend services.</p>
                <button 
                  onClick={() => setShowCreateMockModal(true)}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 shadow-sm shadow-indigo-200 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Create Mock Endpoint
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 font-bold text-slate-700 flex items-center gap-2">
                  <Beaker className="w-4 h-4 text-slate-500" /> Active Mock Endpoints
                </div>
                <div className="p-0 overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 bg-slate-50 uppercase border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-3 font-semibold">Status</th>
                        <th className="px-6 py-3 font-semibold">Method</th>
                        <th className="px-6 py-3 font-semibold">Path</th>
                        <th className="px-6 py-3 font-semibold">Response Code</th>
                        <th className="px-6 py-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {mockEndpoints.map((mock) => (
                        <tr key={mock.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-3">
                            <button 
                              onClick={() => setMockEndpoints(mockEndpoints.map(m => m.id === mock.id ? { ...m, active: !m.active } : m))}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${mock.active ? 'bg-indigo-500' : 'bg-slate-300'}`}
                            >
                              <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${mock.active ? 'translate-x-5' : 'translate-x-1'}`} />
                            </button>
                          </td>
                          <td className="px-6 py-3">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                              mock.method === 'GET' ? 'bg-blue-100 text-blue-700' :
                              mock.method === 'POST' ? 'bg-emerald-100 text-emerald-700' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {mock.method}
                            </span>
                          </td>
                          <td className="px-6 py-3 font-mono text-xs text-slate-700">{mock.path}</td>
                          <td className="px-6 py-3 font-mono text-xs text-slate-600">{mock.status}</td>
                          <td className="px-6 py-3 text-right">
                            <button 
                              onClick={() => setMockEndpoints(mockEndpoints.filter(m => m.id !== mock.id))}
                              className="text-rose-600 hover:text-rose-800 text-xs font-medium cursor-pointer"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                      {mockEndpoints.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                            No mock endpoints configured.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'scanner' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600">Run automated vulnerability scans on configured API endpoints for common issues.</p>
                <button 
                  onClick={handleRunScan}
                  disabled={isScanning}
                  className={`px-4 py-2 text-white text-sm font-semibold rounded-lg transition flex items-center gap-2 shadow-sm ${isScanning ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 cursor-pointer'}`}
                >
                  {isScanning ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Scanning...</>
                  ) : (
                    <><PlayCircle className="w-4 h-4" /> Run Full Scan</>
                  )}
                </button>
              </div>

              {scanResults ? (
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 font-bold text-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-rose-500" /> Scan Results
                    </div>
                    <span className="text-xs font-normal bg-white px-2 py-1 rounded border border-slate-200">
                      Found {scanResults.length} issues
                    </span>
                  </div>
                  <div className="p-0 overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-slate-500 bg-slate-50 uppercase border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-3 font-semibold">Severity</th>
                          <th className="px-6 py-3 font-semibold">Vulnerability Type</th>
                          <th className="px-6 py-3 font-semibold">Endpoint / Scope</th>
                          <th className="px-6 py-3 font-semibold">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {scanResults.map((result) => (
                          <tr key={result.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                                result.severity === 'High' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                                result.severity === 'Medium' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                'bg-blue-100 text-blue-700 border border-blue-200'
                              }`}>
                                {result.severity}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-800">{result.type}</td>
                            <td className="px-6 py-4 font-mono text-xs text-slate-600">{result.endpoint}</td>
                            <td className="px-6 py-4 text-slate-600 text-sm max-w-md">{result.description}</td>
                          </tr>
                        ))}
                        {scanResults.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-6 py-8 text-center text-slate-500 flex flex-col items-center">
                              <Check className="w-8 h-8 text-emerald-500 mb-2" />
                              <span className="font-medium text-slate-700">No vulnerabilities found!</span>
                              <span className="text-sm mt-1">Your endpoints appear secure against common threats.</span>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : isScanning ? (
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-12 flex flex-col items-center justify-center space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 border-4 border-indigo-100 rounded-full animate-ping opacity-75"></div>
                    <div className="w-16 h-16 bg-indigo-50 border-4 border-indigo-500 rounded-full flex items-center justify-center relative z-10">
                      <ShieldAlert className="w-6 h-6 text-indigo-600 animate-pulse" />
                    </div>
                  </div>
                  <div className="text-center">
                    <h4 className="font-bold text-slate-800 text-lg">Analyzing Endpoints</h4>
                    <p className="text-sm text-slate-500 mt-1">Testing for injection, auth bypass, and missing security headers...</p>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center">
                  <ShieldAlert className="w-10 h-10 text-slate-400 mb-4" />
                  <h3 className="font-bold text-slate-700 text-lg">No Recent Scans</h3>
                  <p className="text-slate-500 text-sm mt-2 max-w-sm mx-auto">
                    Click "Run Full Scan" to test your configured endpoints for common vulnerabilities like SQL injection and missing headers.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'migration' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Migration Health / Reconciliation</h3>
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 font-bold text-slate-700 flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-slate-500" /> Migration Reconciliation
                </div>
                <div className="p-0 overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 bg-slate-50 uppercase border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-3 font-semibold">Integration</th>
                        <th className="px-6 py-3 font-semibold">Entity</th>
                        <th className="px-6 py-3 font-semibold text-right">Source</th>
                        <th className="px-6 py-3 font-semibold text-right">Target</th>
                        <th className="px-6 py-3 font-semibold text-right">Migrated</th>
                        <th className="px-6 py-3 font-semibold text-right">Matched</th>
                        <th className="px-6 py-3 font-semibold text-right">Exceptions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reconciliationData.map((row, idx) => (
                        <tr key={row.id} className={`hover:bg-slate-50 transition-colors ${idx % 2 === 1 ? 'bg-slate-50/50' : ''}`}>
                          <td className="px-6 py-4 font-medium text-slate-700">{row.integration}</td>
                          <td className="px-6 py-4 font-medium text-slate-800 flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${row.status === 'syncing' ? 'bg-emerald-500 animate-pulse' : row.status === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'}`}></div> {row.entity}
                          </td>
                          <td className="px-6 py-4 text-right text-slate-600">{row.source.toLocaleString()}</td>
                          <td className="px-6 py-4 text-right text-slate-600">{row.target.toLocaleString()}</td>
                          <td className="px-6 py-4 text-right text-slate-600">{row.migrated.toLocaleString()}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden flex-shrink-0">
                                <div className={`h-full rounded-full ${row.matched < 100 ? (row.matched < 99.8 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-emerald-500'}`} style={{ width: `${row.matched}%` }}></div>
                              </div>
                              <span className={`font-medium ${row.matched < 100 ? (row.matched < 99.8 ? 'text-amber-600' : 'text-slate-800') : 'text-slate-800'}`}>
                                {row.matched}%
                              </span>
                            </div>
                          </td>
                          <td className={`px-6 py-4 text-right font-medium ${row.exceptions > 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                            <div className="flex items-center justify-end gap-1">
                              {row.exceptions > 0 ? <AlertCircle className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5 text-emerald-500" />} {row.exceptions.toLocaleString()}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Create Mock Modal */}
      {showCreateMockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Beaker className="w-5 h-5 text-indigo-600" />
                Create Mock Endpoint
              </h3>
              <button 
                onClick={() => setShowCreateMockModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex gap-4">
                <div className="w-1/3">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Method</label>
                  <select 
                    value={newMockForm.method}
                    onChange={(e) => setNewMockForm({...newMockForm, method: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option>GET</option>
                    <option>POST</option>
                    <option>PUT</option>
                    <option>DELETE</option>
                    <option>PATCH</option>
                  </select>
                </div>
                <div className="w-2/3">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Path</label>
                  <input 
                    type="text" 
                    value={newMockForm.path}
                    onChange={(e) => setNewMockForm({...newMockForm, path: e.target.value})}
                    placeholder="/v2/my-endpoint"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Response Status Code</label>
                <input 
                  type="text" 
                  value={newMockForm.status}
                  onChange={(e) => setNewMockForm({...newMockForm, status: e.target.value})}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mock JSON Response</label>
                <textarea 
                  value={newMockForm.response}
                  onChange={(e) => setNewMockForm({...newMockForm, response: e.target.value})}
                  rows={6}
                  className="w-full px-3 py-2 bg-slate-900 text-slate-300 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  onClick={() => setShowCreateMockModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    setMockEndpoints([...mockEndpoints, {
                      id: `mock-\${Date.now()}`,
                      method: newMockForm.method,
                      path: newMockForm.path,
                      status: parseInt(newMockForm.status) || 200,
                      response: newMockForm.response,
                      active: true
                    }]);
                    setShowCreateMockModal(false);
                    setNewMockForm({ method: 'GET', path: '/v2/test', status: '200', response: '{\n  "message": "success"\n}' });
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition cursor-pointer"
                >
                  Create Mock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generate API Key Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                {generatedKeyResult ? 'API Key Generated' : 'Create New API Key'}
              </h3>
              <button 
                onClick={closeAndResetModal}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              {!generatedKeyResult ? (
                <form onSubmit={handleGenerateKeySubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Key Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Production Webhook Service"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all"
                      value={newKeyForm.name}
                      onChange={e => setNewKeyForm({...newKeyForm, name: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Environment</label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className={`border rounded-lg p-3 cursor-pointer transition-all flex items-start gap-3 ${newKeyForm.type === 'test' ? 'border-indigo-600 ring-1 ring-indigo-600 bg-indigo-50/30' : 'border-slate-200 hover:border-slate-300 bg-slate-50'}`}>
                        <div className="mt-0.5">
                          <input type="radio" name="keyType" className="sr-only" checked={newKeyForm.type === 'test'} onChange={() => setNewKeyForm({...newKeyForm, type: 'test'})} />
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${newKeyForm.type === 'test' ? 'border-indigo-600' : 'border-slate-300'}`}>
                            {newKeyForm.type === 'test' && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
                          </div>
                        </div>
                        <div>
                          <div className={`text-sm font-medium ${newKeyForm.type === 'test' ? 'text-indigo-900' : 'text-slate-700'}`}>Sandbox</div>
                          <div className="text-xs text-slate-500 mt-0.5">For development</div>
                        </div>
                      </label>
                      
                      <label className={`border rounded-lg p-3 cursor-pointer transition-all flex items-start gap-3 ${newKeyForm.type === 'live' ? 'border-indigo-600 ring-1 ring-indigo-600 bg-indigo-50/30' : 'border-slate-200 hover:border-slate-300 bg-slate-50'}`}>
                        <div className="mt-0.5">
                          <input type="radio" name="keyType" className="sr-only" checked={newKeyForm.type === 'live'} onChange={() => setNewKeyForm({...newKeyForm, type: 'live'})} />
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${newKeyForm.type === 'live' ? 'border-indigo-600' : 'border-slate-300'}`}>
                            {newKeyForm.type === 'live' && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
                          </div>
                        </div>
                        <div>
                          <div className={`text-sm font-medium ${newKeyForm.type === 'live' ? 'text-indigo-900' : 'text-slate-700'}`}>Production</div>
                          <div className="text-xs text-slate-500 mt-0.5">Live data access</div>
                        </div>
                      </label>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                    <button 
                      type="button" 
                      onClick={closeAndResetModal}
                      className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition cursor-pointer"
                    >
                      Create Secret Key
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 text-amber-800 text-sm">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                    <div>
                      <span className="font-semibold block mb-1">Please copy this key now.</span>
                      For your security, it will never be shown again. If you lose it, you will need to generate a new one.
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Your new API key</label>
                    <div className="relative">
                      <div className="flex bg-slate-50 border border-slate-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
                        <div className="px-3 py-2.5 border-r border-slate-200 bg-slate-100 flex items-center justify-center text-slate-400">
                          <KeyRound className="w-4 h-4" />
                        </div>
                        <input
                          type={showSecret ? "text" : "password"}
                          readOnly
                          value={generatedKeyResult.fullKey}
                          className="flex-1 px-3 py-2.5 bg-transparent font-mono text-sm focus:outline-none text-slate-800"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSecret(!showSecret)}
                          className="px-3 py-2.5 text-slate-400 hover:text-slate-600 transition border-l border-slate-200 bg-white cursor-pointer"
                          title={showSecret ? "Hide secret" : "Show secret"}
                        >
                          {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(generatedKeyResult.fullKey, 'modal-key')}
                          className="px-4 py-2.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition font-medium text-sm flex items-center gap-2 border-l border-slate-200 cursor-pointer"
                        >
                          {copiedId === 'modal-key' ? (
                            <><Check className="w-4 h-4" /> Copied!</>
                          ) : (
                            <><Copy className="w-4 h-4" /> Copy</>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <button 
                      onClick={closeAndResetModal}
                      className="w-full px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 hover:bg-slate-50 rounded-lg transition cursor-pointer"
                    >
                      I've safely stored this key
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CLI Tools Download Modal */}
      <CliDownloadModal
        isOpen={showCliModal}
        onClose={() => setShowCliModal(false)}
      />

      {/* Generate SDK Modal */}
      {showGenerateSdkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Terminal className="w-5 h-5 text-indigo-600" />
                Generate Custom SDK Code
              </h3>
              <button 
                onClick={() => setShowGenerateSdkModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex flex-col gap-4 border-b border-slate-200 pb-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <label htmlFor="preset" className="text-sm font-medium text-slate-700">Configuration Presets:</label>
                      <select
                        id="preset"
                        onChange={(e) => loadPreset(e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                        defaultValue=""
                      >
                        <option value="" disabled>Load a preset...</option>
                        {savedPresets.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <button 
                        onClick={saveCurrentAsPreset}
                        className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
                      >
                        Save Current
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <label htmlFor="apiVersion" className="text-sm font-medium text-slate-700">API Version:</label>
                      <select
                        id="apiVersion"
                        value={selectedApiVersion}
                        onChange={(e) => setSelectedApiVersion(e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="v1">v1 (Legacy)</option>
                        <option value="v2">v2 (Current)</option>
                        <option value="v3">v3 (Beta)</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex gap-6">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-700">Language:</span>
                      <select 
                        value={selectedSdkLang} 
                        onChange={(e) => setSelectedSdkLang(e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg px-3 py-1 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="typescript">TypeScript</option>
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                        <option value="java">Java</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-700">HTTP Client:</span>
                      <select 
                        value={selectedLibrary} 
                        onChange={(e) => setSelectedLibrary(e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg px-3 py-1 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                      >
                        {selectedSdkLang === 'typescript' || selectedSdkLang === 'javascript' ? (
                          <>
                            <option value="axios">Axios</option>
                            <option value="fetch">Fetch API</option>
                          </>
                        ) : selectedSdkLang === 'python' ? (
                          <>
                            <option value="requests">Requests</option>
                          </>
                        ) : (
                          <>
                            <option value="httpclient">java.net.http</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="absolute top-2 right-2">
                    <button 
                      onClick={() => copyToClipboard(generatedSdkCode, 'sdk-code')}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                    >
                      {copiedId === 'sdk-code' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedId === 'sdk-code' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre className="bg-slate-900 text-slate-300 p-4 rounded-lg text-sm font-mono overflow-x-auto border border-slate-800 max-h-96 overflow-y-auto">
                    <code>{generatedSdkCode}</code>
                  </pre>
                </div>
                <p className="text-xs text-slate-500">
                  This SDK is pre-configured with the current schema. You need to replace API keys in your actual application environment.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Swagger Import Modal */}
      {showSwaggerImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <FileJson className="w-5 h-5 text-indigo-600" />
                Import Swagger / OpenAPI
              </h3>
              <button 
                onClick={() => {
                  setShowSwaggerImportModal(false);
                  setSwaggerImportStep('input');
                  setSwaggerInput('');
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              {swaggerImportStep === 'input' && (
                <div className="space-y-4 animate-in fade-in">
                  <p className="text-sm text-slate-600">
                    Paste your Swagger or OpenAPI JSON/YAML definition below to automatically scaffold your API endpoints, schemas, and configurations.
                  </p>
                  
                  <div className="relative">
                    <textarea 
                      value={swaggerInput}
                      onChange={(e) => setSwaggerInput(e.target.value)}
                      placeholder='{ "openapi": "3.0.0", "info": { "title": "My API" }... }'
                      className="w-full h-64 p-4 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-slate-400"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button 
                      onClick={() => {
                        setShowSwaggerImportModal(false);
                        setSwaggerInput('');
                      }}
                      className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      disabled={!swaggerInput.trim()}
                      onClick={handleSwaggerImportSubmit}
                      className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" /> Import Definition
                    </button>
                  </div>
                </div>
              )}

              {swaggerImportStep === 'processing' && (
                <div className="py-12 flex flex-col items-center justify-center space-y-4 animate-in fade-in">
                  <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin" />
                  <div className="text-center">
                    <h4 className="font-bold text-slate-800 text-lg">Analyzing API Definition...</h4>
                    <p className="text-sm text-slate-500 mt-1">Extracting endpoints, parsing schemas, and setting up mock servers.</p>
                  </div>
                </div>
              )}

              {swaggerImportStep === 'success' && (
                <div className="py-8 flex flex-col items-center justify-center space-y-6 animate-in fade-in zoom-in-95">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Check className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div className="text-center space-y-2">
                    <h4 className="font-bold text-slate-800 text-xl">Import Successful!</h4>
                    <p className="text-sm text-slate-500 max-w-sm mx-auto">
                      Your API infrastructure has been successfully scaffolded based on the provided definition.
                    </p>
                  </div>
                  
                  <div className="w-full bg-slate-50 rounded-lg p-4 text-sm border border-slate-100">
                    <ul className="space-y-2 text-slate-600">
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> 14 Endpoints Configured</li>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> 8 Data Schemas Parsed</li>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Mock Servers Initialized</li>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Rate Limiting Policies Applied</li>
                    </ul>
                  </div>

                  <button 
                    onClick={() => {
                      setShowSwaggerImportModal(false);
                      setSwaggerImportStep('input');
                      setSwaggerInput('');
                      setActiveTab('endpoints');
                    }}
                    className="w-full px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition cursor-pointer"
                  >
                    View Configured Endpoints
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

