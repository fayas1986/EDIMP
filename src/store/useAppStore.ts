import { create } from 'zustand';
import { Connector, MigrationJob, UserRole } from '../types';
import { UserIdentity, MOCK_ALL_USERS } from '../data/mockUsers';
import { offlineCacheService } from '../services/offlineCacheService';
import { MOCK_CONNECTORS, MOCK_MIGRATION_JOBS } from '../data/mockData';
import { generateAutomatedDataProfile } from '../services/dataProfilingService';

interface AppState {
  connectors: Connector[];
  jobs: MigrationJob[];
  hasGeminiKey: boolean;
  isAuthenticated: boolean;
  currentUser: UserIdentity;
  userRole: UserRole;
  setConnectors: (connectors: Connector[] | ((prev: Connector[]) => Connector[])) => void;
  setJobs: (jobs: MigrationJob[] | ((prev: MigrationJob[]) => MigrationJob[])) => void;
  setHasGeminiKey: (hasKey: boolean) => void;
  handleLoginSuccess: (user: UserIdentity) => void;
  handleLogout: () => void;
  handleSelectUser: (user: UserIdentity) => void;
  setUserRole: (role: UserRole) => void;
}

export const useAppStore = create<AppState>((set, get) => {
  // Initialize connectors
  const cachedConnectors = offlineCacheService.getCachedConnectors();
  const initialConnectors = cachedConnectors && cachedConnectors.length >= 9 ? cachedConnectors : [];

  // Initialize jobs
  const initialJobs = offlineCacheService.getCachedJobs() || MOCK_MIGRATION_JOBS;

  // Initialize Auth
  const isAuth = localStorage.getItem('edimp_is_authenticated') !== 'false';
  const savedUserId = localStorage.getItem('edimp_user_id');
  const matchedUser = MOCK_ALL_USERS.find((u) => u.id === savedUserId);
  const initialUser = matchedUser || MOCK_ALL_USERS[0];

  return {
    connectors: initialConnectors,
    jobs: initialJobs,
    hasGeminiKey: true,
    isAuthenticated: isAuth,
    currentUser: initialUser,
    userRole: initialUser.role,

    setConnectors: (updater) => {
      set((state) => {
        const next = typeof updater === 'function' ? updater(state.connectors) : updater;
        offlineCacheService.saveConnectorsToOfflineCache(next);
        return { connectors: next };
      });
    },

    setJobs: (updater) => {
      set((state) => {
        const next = typeof updater === 'function' ? updater(state.jobs) : updater;
        offlineCacheService.saveJobsToOfflineCache(next);
        return { jobs: next };
      });
    },

    setHasGeminiKey: (hasKey) => set({ hasGeminiKey: hasKey }),

    handleLoginSuccess: (user) => {
      localStorage.setItem('edimp_is_authenticated', 'true');
      localStorage.setItem('edimp_user_id', user.id);
      set({
        isAuthenticated: true,
        currentUser: user,
        userRole: user.role,
      });
    },

    handleLogout: () => {
      localStorage.setItem('edimp_is_authenticated', 'false');
      set({
        isAuthenticated: false,
      });
    },

    handleSelectUser: (user) => {
      localStorage.setItem('edimp_user_id', user.id);
      set({
        currentUser: user,
        userRole: user.role,
      });
    },

    setUserRole: (role) => {
      set({ userRole: role });
    }
  };
});
