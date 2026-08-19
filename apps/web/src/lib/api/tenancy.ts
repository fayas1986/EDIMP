import { apiFetch } from './client';
import type {
  Tenant, CreateTenantDto, UpdateTenantDto,
  Workspace, CreateWorkspaceDto, UpdateWorkspaceDto,
  Environment, CreateEnvironmentDto, UpdateEnvironmentDto
} from '@edimp/contracts';

// Tenants API
export const tenantsApi = {
  list: () => apiFetch<Tenant[]>('/tenants'),
  get: (id: string) => apiFetch<Tenant>(`/tenants/${id}`),
  create: (data: CreateTenantDto) => apiFetch<Tenant>('/tenants', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: UpdateTenantDto) => apiFetch<Tenant>(`/tenants/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiFetch<void>(`/tenants/${id}`, {
    method: 'DELETE',
  }),
};

// Workspaces API
export const workspacesApi = {
  list: (tenantId: string) => apiFetch<Workspace[]>(`/tenants/${tenantId}/workspaces`),
  get: (tenantId: string, id: string) => apiFetch<Workspace>(`/tenants/${tenantId}/workspaces/${id}`),
  create: (tenantId: string, data: CreateWorkspaceDto) => apiFetch<Workspace>(`/tenants/${tenantId}/workspaces`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (tenantId: string, id: string, data: UpdateWorkspaceDto) => apiFetch<Workspace>(`/tenants/${tenantId}/workspaces/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  delete: (tenantId: string, id: string) => apiFetch<void>(`/tenants/${tenantId}/workspaces/${id}`, {
    method: 'DELETE',
  }),
};

// Environments API
export const environmentsApi = {
  list: (workspaceId: string) => apiFetch<Environment[]>(`/workspaces/${workspaceId}/environments`),
  get: (workspaceId: string, id: string) => apiFetch<Environment>(`/workspaces/${workspaceId}/environments/${id}`),
  create: (workspaceId: string, data: CreateEnvironmentDto) => apiFetch<Environment>(`/workspaces/${workspaceId}/environments`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (workspaceId: string, id: string, data: UpdateEnvironmentDto) => apiFetch<Environment>(`/workspaces/${workspaceId}/environments/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  delete: (workspaceId: string, id: string) => apiFetch<void>(`/workspaces/${workspaceId}/environments/${id}`, {
    method: 'DELETE',
  }),
};
