// EDIMP Offline Cache & Service Worker Registration Manager

import { MigrationJob, Connector, ActivityFeedItem } from '../types';

export interface ServiceWorkerStatus {
  isRegistered: boolean;
  isSupported: boolean;
  isOffline: boolean;
  isSimulatedOffline: boolean;
  hasUpdate: boolean;
  shellCacheCount: number;
  dataCacheCount: number;
  lastSyncTimestamp: string | null;
}

const CACHE_KEYS = {
  OFFLINE_JOBS: 'edimp_offline_jobs_v1',
  OFFLINE_CONNECTORS: 'edimp_offline_connectors_v1',
  OFFLINE_ACTIVITIES: 'edimp_offline_activities_v1',
  SIMULATE_OFFLINE: 'edimp_simulate_offline',
  LAST_SYNC: 'edimp_offline_last_sync',
};

class OfflineCacheManager {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private statusListeners: Array<(status: ServiceWorkerStatus) => void> = [];
  private simulatedOffline: boolean = false;

  constructor() {
    this.simulatedOffline = localStorage.getItem(CACHE_KEYS.SIMULATE_OFFLINE) === 'true';

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.notifyListeners());
      window.addEventListener('offline', () => this.notifyListeners());
    }
  }

  // Register the service worker at /sw.js
  public async register(): Promise<boolean> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.log('[Offline Cache] Service Workers are not supported in this environment.');
      return false;
    }

    try {
      // Register service worker with scope /
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      this.swRegistration = reg;
      console.log('[Offline Cache] Service Worker registered successfully with scope:', reg.scope);

      // Check for updates
      reg.addEventListener('updatefound', () => {
        const installingWorker = reg.installing;
        if (installingWorker) {
          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[Offline Cache] New Service Worker version available.');
              this.notifyListeners();
            }
          });
        }
      });

      this.notifyListeners();
      return true;
    } catch (error) {
      console.warn('[Offline Cache] Service Worker registration failed:', error);
      return false;
    }
  }

  // Toggle simulated offline mode for testing/previewing offline access
  public setSimulatedOffline(simulate: boolean) {
    this.simulatedOffline = simulate;
    localStorage.setItem(CACHE_KEYS.SIMULATE_OFFLINE, String(simulate));
    this.notifyListeners();
  }

  public isOfflineMode(): boolean {
    if (typeof navigator === 'undefined') return false;
    return !navigator.onLine || this.simulatedOffline;
  }

  public getStatus(): ServiceWorkerStatus {
    const isSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator;
    const isRegistered = Boolean(this.swRegistration);
    const isOffline = typeof navigator !== 'undefined' ? !navigator.onLine : false;
    const lastSyncTimestamp = localStorage.getItem(CACHE_KEYS.LAST_SYNC);

    return {
      isRegistered,
      isSupported,
      isOffline,
      isSimulatedOffline: this.simulatedOffline,
      hasUpdate: Boolean(this.swRegistration?.waiting),
      shellCacheCount: 5,
      dataCacheCount: 12,
      lastSyncTimestamp: lastSyncTimestamp || new Date().toLocaleTimeString(),
    };
  }

  public subscribeStatus(listener: (status: ServiceWorkerStatus) => void): () => void {
    this.statusListeners.push(listener);
    listener(this.getStatus());
    return () => {
      this.statusListeners = this.statusListeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    const currentStatus = this.getStatus();
    this.statusListeners.forEach((listener) => listener(currentStatus));
  }

  // --- Offline Metadata Storage for Migration Jobs & Dashboard Activity ---

  public saveJobsToOfflineCache(jobs: MigrationJob[]) {
    try {
      localStorage.setItem(CACHE_KEYS.OFFLINE_JOBS, JSON.stringify(jobs));
      localStorage.setItem(CACHE_KEYS.LAST_SYNC, new Date().toISOString());
    } catch (e) {
      console.warn('[Offline Cache] Failed to save jobs to local offline cache:', e);
    }
  }

  public getCachedJobs(): MigrationJob[] | null {
    try {
      const data = localStorage.getItem(CACHE_KEYS.OFFLINE_JOBS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('[Offline Cache] Error reading cached jobs:', e);
    }
    return null;
  }

  public saveConnectorsToOfflineCache(connectors: Connector[]) {
    try {
      localStorage.setItem(CACHE_KEYS.OFFLINE_CONNECTORS, JSON.stringify(connectors));
    } catch (e) {
      console.warn('[Offline Cache] Failed to save connectors:', e);
    }
  }

  public getCachedConnectors(): Connector[] | null {
    try {
      const data = localStorage.getItem(CACHE_KEYS.OFFLINE_CONNECTORS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('[Offline Cache] Error reading cached connectors:', e);
    }
    return null;
  }

  public saveActivitiesToOfflineCache(activities: ActivityFeedItem[]) {
    try {
      localStorage.setItem(CACHE_KEYS.OFFLINE_ACTIVITIES, JSON.stringify(activities));
    } catch (e) {
      console.warn('[Offline Cache] Failed to save activities:', e);
    }
  }

  public getCachedActivities(): ActivityFeedItem[] | null {
    try {
      const data = localStorage.getItem(CACHE_KEYS.OFFLINE_ACTIVITIES);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('[Offline Cache] Error reading cached activities:', e);
    }
    return null;
  }

  // Clear offline cache storage
  public async clearCache(): Promise<boolean> {
    try {
      localStorage.removeItem(CACHE_KEYS.OFFLINE_JOBS);
      localStorage.removeItem(CACHE_KEYS.OFFLINE_CONNECTORS);
      localStorage.removeItem(CACHE_KEYS.OFFLINE_ACTIVITIES);
      localStorage.removeItem(CACHE_KEYS.LAST_SYNC);

      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }

      this.notifyListeners();
      return true;
    } catch (e) {
      console.error('[Offline Cache] Failed to clear caches:', e);
      return false;
    }
  }

  // Trigger manual synchronization
  public async syncNow(): Promise<boolean> {
    try {
      // Simulate network latency for synchronization
      await new Promise(resolve => setTimeout(resolve, 1500));
      localStorage.setItem(CACHE_KEYS.LAST_SYNC, new Date().toISOString());
      this.notifyListeners();
      return true;
    } catch (e) {
      console.error('[Offline Cache] Sync failed:', e);
      return false;
    }
  }
}

export const offlineCacheService = new OfflineCacheManager();
