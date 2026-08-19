import { apiClient } from './client';
import { MigrationJob } from '../types';
import { PaginationParams } from './connectors';

export interface CreateMigrationJobRequest {
  jobName: string;
  sourceConnectorId: string;
  sourceEntity: string;
  destConnectorId: string;
  destEntity: string;
  mode: 'Full' | 'Incremental' | 'Delta' | 'RealTime';
  batchProcessingEnabled?: boolean;
  batchSize?: number;
}

export interface JobProgressResponse {
  jobId: string;
  status: MigrationJob['status'];
  progressPct: number;
  totalRecords: number;
  processedRecords: number;
  errorCount: number;
  warningCount: number;
  throughputRps: number;
}

export const jobsApi = {
  list: (params?: PaginationParams) => {
    const query = new URLSearchParams(params as any).toString();
    return apiClient.get<MigrationJob[]>(`/jobs${query ? `?${query}` : ''}`);
  },
  get: (id: string) => apiClient.get<MigrationJob>(`/jobs/${id}`),
  create: (data: CreateMigrationJobRequest) => apiClient.post<MigrationJob>('/jobs', data),
  start: (id: string) => apiClient.post<{ success: boolean }>(`/jobs/${id}/start`, {}),
  pause: (id: string) => apiClient.post<{ success: boolean }>(`/jobs/${id}/pause`, {}),
  cancel: (id: string) => apiClient.post<{ success: boolean }>(`/jobs/${id}/cancel`, {}),
  progress: (id: string) => apiClient.get<JobProgressResponse>(`/jobs/${id}/progress`),
};
