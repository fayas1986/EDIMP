import { apiClient } from './client';
import { Connector } from '../types';

export interface PaginationParams {
  page?: number;
  limit?: number;
  status?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  requestId: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface CreateConnectorRequest {
  name: string;
  category: string;
  systemType: string;
  provider: string;
  authType: string;
  hostUrl?: string;
  dbName?: string;
  tenantId?: string;
  credentials?: Record<string, string>;
}

export const connectorsApi = {
  list: (params?: PaginationParams) => {
    const query = new URLSearchParams(params as any).toString();
    return apiClient.get<Connector[]>(`/connectors${query ? `?${query}` : ''}`);
  },
  get: (id: string) => apiClient.get<Connector>(`/connectors/${id}`),
  create: (data: CreateConnectorRequest) => apiClient.post<Connector>('/connectors', data),
  test: (id: string) => apiClient.post<{ latencyMs: number; status: string }>(`/connectors/${id}/test`, {}),
};
