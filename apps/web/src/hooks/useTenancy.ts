import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantsApi, workspacesApi, environmentsApi } from '../lib/api/tenancy';
import type { CreateTenantDto, UpdateTenantDto, CreateWorkspaceDto, UpdateWorkspaceDto, CreateEnvironmentDto, UpdateEnvironmentDto } from '@edimp/contracts';

// Query Keys
export const tenancyKeys = {
  tenants: ['tenants'] as const,
  tenant: (id: string) => ['tenants', id] as const,
  workspaces: (tenantId: string) => ['workspaces', tenantId] as const,
  workspace: (tenantId: string, id: string) => ['workspaces', tenantId, id] as const,
  environments: (workspaceId: string) => ['environments', workspaceId] as const,
  environment: (workspaceId: string, id: string) => ['environments', workspaceId, id] as const,
};

// Tenant Hooks
export function useTenants() {
  return useQuery({
    queryKey: tenancyKeys.tenants,
    queryFn: () => tenantsApi.list(),
  });
}

export function useTenant(id: string) {
  return useQuery({
    queryKey: tenancyKeys.tenant(id),
    queryFn: () => tenantsApi.get(id),
    enabled: !!id,
  });
}

export function useCreateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTenantDto) => tenantsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenancyKeys.tenants });
    },
  });
}

export function useUpdateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTenantDto }) => tenantsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: tenancyKeys.tenants });
      queryClient.invalidateQueries({ queryKey: tenancyKeys.tenant(variables.id) });
    },
  });
}

export function useDeleteTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tenantsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenancyKeys.tenants });
    },
  });
}

// Workspace Hooks
export function useWorkspaces(tenantId: string) {
  return useQuery({
    queryKey: tenancyKeys.workspaces(tenantId),
    queryFn: () => workspacesApi.list(tenantId),
    enabled: !!tenantId,
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tenantId, data }: { tenantId: string; data: CreateWorkspaceDto }) =>
      workspacesApi.create(tenantId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: tenancyKeys.workspaces(variables.tenantId) });
    },
  });
}

// Environment Hooks
export function useEnvironments(workspaceId: string) {
  return useQuery({
    queryKey: tenancyKeys.environments(workspaceId),
    queryFn: () => environmentsApi.list(workspaceId),
    enabled: !!workspaceId,
  });
}

export function useCreateEnvironment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, data }: { workspaceId: string; data: CreateEnvironmentDto }) =>
      environmentsApi.create(workspaceId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: tenancyKeys.environments(variables.workspaceId) });
    },
  });
}
