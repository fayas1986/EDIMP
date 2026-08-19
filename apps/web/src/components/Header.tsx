import React, { useState, useEffect } from 'react';
import { Menu, Keyboard, Wifi, WifiOff, HardDrive, Command, Search, ShieldCheck, UserCheck, KeyRound, Users, LogOut, Shield } from 'lucide-react';
import { offlineCacheService, ServiceWorkerStatus } from '../services/offlineCacheService';
import { UserIdentity } from '../data/mockUsers';

export type AppTheme = 'default' | 'theme-emerald' | 'theme-sapphire' | 'theme-titanium';

interface HeaderProps {
  onNaturalQuerySubmit?: (query: string) => void;
  hasGeminiKey?: boolean;
  onToggleMobileSidebar: () => void;
  mobileSidebarOpen?: boolean;
  currentTheme?: AppTheme;
  onThemeChange?: (theme: AppTheme) => void;
  onOpenShortcuts?: () => void;
  onOpenQuickActions?: () => void;
  onOpenOfflineManager?: () => void;
  currentUser?: UserIdentity;
  onOpenAuthModal?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileSidebar,
  mobileSidebarOpen = false,
  onOpenShortcuts,
  onOpenQuickActions,
  currentUser,
  onOpenAuthModal,
  onLogout,
}) => {
  const [swStatus, setSwStatus] = useState<ServiceWorkerStatus>(offlineCacheService.getStatus());

  useEffect(() => {
    const unsubscribe = offlineCacheService.subscribeStatus((status) => {
      setSwStatus(status);
    });
    return () => unsubscribe();
  }, []);

  const isOffline = swStatus.isOffline || swStatus.isSimulatedOffline;

  return (
    <header
      id="header-main-nav"
      role="banner"
      aria-label="Application Header"
      className="bg-slate-900/95 backdrop-blur-md text-white border-b border-slate-800/80 sticky top-0 z-30 shadow-md"
    >
      {/* Accessible Skip Link for Keyboard & Screen Reader Users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2.5 focus:bg-indigo-600 focus:text-white focus:font-bold focus:rounded-xl focus:shadow-2xl focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-900 transition-all"
        aria-label="Skip to main content area"
      >
        Skip to main content (Alt + M)
      </a>

      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Left: Mobile Toggle & Header Brand */}
          <div className="flex items-center gap-3">
            <button
              id="mobile-sidebar-toggle-btn"
              onClick={onToggleMobileSidebar}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileSidebarOpen}
              aria-controls="app-sidebar"
              aria-keyshortcuts="Alt+B"
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              title="Toggle Navigation Menu (Alt + B)"
            >
              <Menu className="w-5 h-5" aria-hidden="true" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse inline-block" aria-hidden="true" />
                  EDIMP Workbench
                </span>
              </div>
              <p className="text-xs text-slate-200 hidden sm:block font-medium">
                Enterprise Data Integration &amp; Migration Platform
              </p>
            </div>
          </div>

          {/* Right: SW / Offline Status & Keyboard Shortcuts */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Service Worker & Offline Status Indicator */}
            <button
              onClick={() => offlineCacheService.setSimulatedOffline(!swStatus.isSimulatedOffline)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                isOffline
                  ? 'bg-amber-950/80 text-amber-200 border-amber-700/80 hover:bg-amber-900'
                  : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/80 hover:bg-emerald-950/80'
              }`}
              title={isOffline ? 'Offline Mode Active (Click to toggle Online Simulation)' : 'Service Worker Active (Click to Simulate Offline Mode)'}
            >
              {isOffline ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span className="hidden sm:inline">Offline (Cached)</span>
                  <span className="sm:hidden">Offline</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">SW Active</span>
                  <span className="sm:hidden">SW</span>
                </>
              )}
            </button>

            {/* Global Quick Actions Button */}
            <button
              type="button"
              onClick={onOpenQuickActions}
              aria-label="Open Global Quick Actions Menu (Press Ctrl+K or Cmd+K)"
              aria-keyshortcuts="Control+K"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-950/70 hover:bg-indigo-900/90 border border-indigo-700/70 text-indigo-200 hover:text-white text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              title="Global Quick Action Menu (Ctrl + K / Cmd + K)"
            >
              <Command className="w-3.5 h-3.5 text-indigo-400 animate-pulse" aria-hidden="true" />
              <span className="hidden sm:inline">Quick Actions</span>
              <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] bg-indigo-900/90 text-indigo-200 rounded font-mono border border-indigo-600/80 font-extrabold">
                Ctrl+K
              </kbd>
            </button>

            {/* Authenticated User Identity Pill & Role Badge */}
            {currentUser && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <button
                  type="button"
                  onClick={onOpenAuthModal}
                  className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-white transition-all cursor-pointer"
                  title="Click to Switch Account or Manage Identity"
                >
                  <div className={`w-7 h-7 rounded-lg ${currentUser.avatarColor || 'bg-indigo-600'} text-white font-black text-xs flex items-center justify-center shadow-xs`}>
                    {currentUser.firstName?.[0]}{currentUser.lastName?.[0]}
                  </div>
                  <div className="hidden lg:block text-left space-y-0.5">
                    <div className="text-xs font-bold leading-none flex items-center gap-1.5">
                      <span>{currentUser.firstName} {currentUser.lastName}</span>
                      <span className="px-1.5 py-0.2 bg-indigo-950 text-indigo-300 border border-indigo-800 text-[9px] font-mono font-bold rounded">
                        {currentUser.role}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono leading-none">{currentUser.email}</div>
                  </div>
                </button>

                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-950/80 border border-slate-700 hover:border-rose-700/80 text-slate-300 hover:text-rose-300 transition-all cursor-pointer"
                    title="Sign Out / Terminate Enterprise Session"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};



