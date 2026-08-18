import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, HardDrive, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck, Database, Info, X } from 'lucide-react';
import { offlineCacheService, ServiceWorkerStatus } from '../services/offlineCacheService';

interface OfflineStatusBannerProps {
  onForceSync?: () => void;
}

export const OfflineStatusBanner: React.FC<OfflineStatusBannerProps> = ({ onForceSync }) => {
  const [swStatus, setSwStatus] = useState<ServiceWorkerStatus>(offlineCacheService.getStatus());
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isClearing, setIsClearing] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [bannerDismissed, setBannerDismissed] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = offlineCacheService.subscribeStatus((status) => {
      setSwStatus(status);
    });
    return () => unsubscribe();
  }, []);

  const isOffline = swStatus.isOffline || swStatus.isSimulatedOffline;

  const handleToggleSimulatedOffline = () => {
    offlineCacheService.setSimulatedOffline(!swStatus.isSimulatedOffline);
  };

  const handleClearCache = async () => {
    setIsClearing(true);
    await offlineCacheService.clearCache();
    setIsClearing(false);
    setIsModalOpen(false);
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    await offlineCacheService.syncNow();
    setIsSyncing(false);
    if (onForceSync) onForceSync();
  };

  return (
    <>
      {/* Offline Alert Bar - Appears prominently when Network or Simulated Offline Mode is Active */}
      {isOffline && !bannerDismissed && (
        <div className="bg-amber-950/90 border-b border-amber-800/80 px-4 py-2 text-amber-200 text-xs font-sans flex items-center justify-between gap-3 shadow-md backdrop-blur-md relative z-40">
          <div className="flex items-center gap-2 min-w-0">
            <span className="p-1 rounded bg-amber-900/90 border border-amber-700/80 text-amber-300 shrink-0">
              <WifiOff className="w-3.5 h-3.5 animate-pulse" />
            </span>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 truncate">
              <span className="font-extrabold font-mono text-amber-100 flex items-center gap-1">
                OFFLINE MODE ACTIVE
                {swStatus.isSimulatedOffline && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                    [SIMULATED]
                  </span>
                )}
              </span>
              <span className="hidden sm:inline text-amber-400/60">•</span>
              <span className="text-amber-200/90 truncate">
                Viewing cached migration jobs, activity feed, and dashboard metadata via Service Worker cache.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {swStatus.lastSyncTimestamp && (
              <div className="hidden md:flex flex-col items-end gap-0.5 leading-none">
                <span className="text-[8px] text-amber-500/70 uppercase tracking-widest font-extrabold">Last Sync</span>
                <span className="text-[10px] text-amber-100 font-mono font-bold">
                  {new Date(swStatus.lastSyncTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            )}
            
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 border border-amber-500/40 rounded-md font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 relative group"
              title={`${swStatus.dataCacheCount} unsynced migration records currently waiting for server transmission`}
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
              
              {swStatus.dataCacheCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 text-[8px] items-center justify-center text-amber-950 font-bold">
                    {swStatus.dataCacheCount}
                  </span>
                </span>
              )}
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-2.5 py-1 bg-amber-900/80 hover:bg-amber-800 text-amber-100 border border-amber-700 rounded-md font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <HardDrive className="w-3.5 h-3.5 text-amber-300" />
              <span>Inspect SW Cache</span>
            </button>

            {swStatus.isSimulatedOffline && (
              <button
                onClick={handleToggleSimulatedOffline}
                className="px-2.5 py-1 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 border border-emerald-800 rounded-md font-mono text-xs font-bold transition-all cursor-pointer"
              >
                Go Online
              </button>
            )}

            <button
              onClick={() => setBannerDismissed(true)}
              className="p-1 text-amber-400 hover:text-amber-100 rounded hover:bg-amber-900/60 transition-colors"
              title="Dismiss banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Service Worker Telemetry & Cache Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-950/80 rounded-xl border border-indigo-800/80 text-indigo-400">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">Service Worker Cache Manager</h3>
                  <p className="text-xs text-slate-400 font-mono">EDIMP Offline Metadata & Storage Inspector</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1">
                <span className="text-slate-400 text-[10px] uppercase tracking-wider block">Registration Status</span>
                <div className="flex items-center gap-1.5 font-bold">
                  {swStatus.isRegistered ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-300">Active (/sw.js)</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span className="text-amber-300">Not Registered</span>
                    </>
                  )}
                </div>
              </div>

              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1">
                <span className="text-slate-400 text-[10px] uppercase tracking-wider block">Network Connection</span>
                <div className="flex items-center gap-1.5 font-bold">
                  {isOffline ? (
                    <>
                      <WifiOff className="w-4 h-4 text-amber-400" />
                      <span className="text-amber-300">Offline / Simulated</span>
                    </>
                  ) : (
                    <>
                      <Wifi className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-300">Connected (Online)</span>
                    </>
                  )}
                </div>
              </div>

              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1">
                <span className="text-slate-400 text-[10px] uppercase tracking-wider block">App Shell Cache</span>
                <div className="text-slate-200 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  <span>edimp-shell-v1 (5 assets)</span>
                </div>
              </div>

              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1">
                <span className="text-slate-400 text-[10px] uppercase tracking-wider block">Job Metadata Cache</span>
                <div className="text-slate-200 font-bold flex items-center gap-1">
                  <Database className="w-4 h-4 text-indigo-400" />
                  <span>Cached Jobs & Feed</span>
                </div>
              </div>

              <div className="col-span-2 p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase tracking-wider block">Last Server Sync</span>
                  <div className="text-indigo-300 font-mono text-sm font-bold">
                    {swStatus.lastSyncTimestamp ? new Date(swStatus.lastSyncTimestamp).toLocaleString() : 'Never'}
                  </div>
                </div>
                <button
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-all flex items-center gap-2 disabled:opacity-50"
                  title={`${swStatus.dataCacheCount} unsynced migration records currently waiting for server transmission`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Syncing...' : 'Sync Now'}
                </button>
              </div>
            </div>

            {/* Offline Mode Toggle Banner */}
            <div className="p-3.5 bg-indigo-950/40 border border-indigo-800/60 rounded-xl flex items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-200 block">Simulate Offline Network Environment</span>
                <p className="text-slate-400 text-[11px]">
                  Forces the application to read exclusively from local Service Worker caches and offline metadata.
                </p>
              </div>
              <button
                onClick={handleToggleSimulatedOffline}
                className={`px-3 py-1.5 rounded-lg font-mono font-bold text-xs border transition-all cursor-pointer shrink-0 ${
                  swStatus.isSimulatedOffline
                    ? 'bg-amber-600 text-white border-amber-500 shadow-xs'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-700'
                }`}
              >
                {swStatus.isSimulatedOffline ? 'Disable Simulation' : 'Enable Simulation'}
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                onClick={handleClearCache}
                disabled={isClearing}
                className="px-3.5 py-2 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/80 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isClearing ? 'animate-spin' : ''}`} />
                <span>{isClearing ? 'Purging Cache...' : 'Purge Offline Cache'}</span>
              </button>

              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
