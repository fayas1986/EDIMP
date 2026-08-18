import { http, HttpResponse } from 'msw';
import { MOCK_CONNECTORS, MOCK_MIGRATION_JOBS } from '../data/mockData';
import { generateAutomatedDataProfile } from '../services/dataProfilingService';
import { Connector, MigrationJob } from '../types';

let connectors = MOCK_CONNECTORS.map(c => 
  c.dataProfile ? c : { ...c, dataProfile: generateAutomatedDataProfile(c) }
);

let jobs = [...MOCK_MIGRATION_JOBS];

export const handlers = [
  // Connectors
  http.get('/api/v1/connectors', () => {
    return HttpResponse.json(connectors);
  }),
  
  http.get('/api/v1/connectors/:id', ({ params }) => {
    const { id } = params;
    const connector = connectors.find((c) => c.id === id);
    if (!connector) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(connector);
  }),
  
  // Jobs
  http.get('/api/v1/jobs', () => {
    return HttpResponse.json(jobs);
  }),
  
  http.get('/api/v1/jobs/:id', ({ params }) => {
    const { id } = params;
    const job = jobs.find((j) => j.id === id);
    if (!job) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(job);
  }),
  
  http.get('/api/v1/jobs/:id/progress', ({ params }) => {
    const { id } = params;
    const job = jobs.find((j) => j.id === id);
    if (!job) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({
      jobId: job.id,
      status: job.status,
      progressPct: job.progressPct,
      totalRecords: job.totalRecords,
      processedRecords: job.processedRecords,
      errorCount: job.errorCount,
      warningCount: job.warningCount,
      throughputRps: job.throughputRps,
    });
  }),
];
