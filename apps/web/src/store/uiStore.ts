import { create } from 'zustand';

interface UiState {
  activeTenantId: string | null;
  activeWorkspaceId: string | null;
  activeEnvironmentId: string | null;
  activeTab: string;
  sidebarCollapsed: boolean;
  setActiveTenantId: (id: string | null) => void;
  setActiveWorkspaceId: (id: string | null) => void;
  setActiveEnvironmentId: (id: string | null) => void;
  setActiveTab: (tab: string) => void;
  toggleSidebar: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeTenantId: null,
  activeWorkspaceId: null,
  activeEnvironmentId: null,
  activeTab: 'dashboard',
  sidebarCollapsed: false,
  setActiveTenantId: (id) => set({ activeTenantId: id }),
  setActiveWorkspaceId: (id) => set({ activeWorkspaceId: id }),
  setActiveEnvironmentId: (id) => set({ activeEnvironmentId: id }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));
