import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ShieldAlert,
  Clock,
  Lock,
  LogOut,
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Activity,
  KeyRound,
  UserCheck,
  AlertTriangle,
  Sliders,
  X,
  Sparkles,
} from 'lucide-react';

export interface UserSessionProfile {
  name: string;
  email: string;
  role: string;
  department: string;
  ssoProvider: string;
  lastLogin: string;
}

const DEFAULT_USER: UserSessionProfile = {
  name: 'Alex Mercer',
  email: 'alex.mercer@enterprise.com',
  role: 'Lead Migration Architect',
  department: 'Global Commercial Operations',
  ssoProvider: 'Okta Enterprise SSO',
  lastLogin: 'Today, 08:30 AM',
};

interface SessionManagerProps {
  children: React.ReactNode;
  onSessionStateChange?: (isLoggedIn: boolean) => void;
}

export const SessionManager: React.FC<SessionManagerProps> = ({
  children,
  onSessionStateChange,
}) => {
  // Session Configuration State (Default 30 minutes = 1800s)
  const [timeoutMinutes, setTimeoutMinutes] = useState<number>(30); // 30 min enterprise default
  const [warningPeriodSeconds, setWarningPeriodSeconds] = useState<number>(120); // 2 min warning
  
  // Dynamic Session Runtime State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const [secondsInactive, setSecondsInactive] = useState<number>(0);
  const [lastActivityTime, setLastActivityTime] = useState<Date>(new Date());
  const [logoutReason, setLogoutReason] = useState<'idle_timeout' | 'manual' | null>(null);
  const [showWarningModal, setShowWarningModal] = useState<boolean>(false);
  const [showSecurityDetails, setShowSecurityDetails] = useState<boolean>(false);
  const [isTestMode, setIsTestMode] = useState<boolean>(false); // Fast test mode (30s timeout)

  // Re-auth form state
  const [authPassword, setAuthPassword] = useState<string>('');
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Effective max timeout seconds
  const maxIdleSeconds = isTestMode ? 30 : timeoutMinutes * 60;
  const effectiveWarningSeconds = isTestMode ? 10 : warningPeriodSeconds;

  const secondsRemaining = Math.max(0, maxIdleSeconds - secondsInactive);
  const isWarningPeriod = secondsRemaining <= effectiveWarningSeconds && secondsRemaining > 0;

  // Ref to throttle activity events to avoid high re-render rates
  const lastActivityRef = useRef<number>(Date.now());

  // Function to wipe sensitive enterprise state
  const clearSensitiveState = useCallback(() => {
    try {
      // Clear localStorage sensitive keys
      const keysToRemove = [
        'edimp_session_token',
        'edimp_oauth_state',
        'edimp_cached_queries',
        'edimp_api_secrets',
        'edimp_draft_mappings',
      ];
      keysToRemove.forEach((key) => localStorage.removeItem(key));
      
      // Clear sessionStorage completely
      sessionStorage.clear();

      console.warn(
        '[SECURITY COMPLIANCE] Purged in-memory buffers and sensitive storage keys in accordance with SOC2 Type II and NIST 800-53 idle lock standards.'
      );
    } catch (err) {
      console.error('Error clearing sensitive session state:', err);
    }
  }, []);

  // Logout handler
  const performLogout = useCallback((reason: 'idle_timeout' | 'manual') => {
    clearSensitiveState();
    setIsLoggedIn(false);
    setLogoutReason(reason);
    setShowWarningModal(false);
    if (onSessionStateChange) onSessionStateChange(false);
  }, [clearSensitiveState, onSessionStateChange]);

  // Reset activity timestamp
  const resetActivityTimer = useCallback(() => {
    const now = Date.now();
    // Throttle to max 1 update per second
    if (now - lastActivityRef.current > 1000) {
      lastActivityRef.current = now;
      setSecondsInactive(0);
      setLastActivityTime(new Date(now));
      if (showWarningModal) {
        setShowWarningModal(false);
      }
    }
  }, [showWarningModal]);

  // Attach window event listeners for user activity
  useEffect(() => {
    if (!isLoggedIn) return;

    const activityEvents = [
      'mousemove',
      'mousedown',
      'keydown',
      'touchstart',
      'scroll',
      'wheel',
      'click',
    ];

    const handleUserActivity = () => {
      resetActivityTimer();
    };

    activityEvents.forEach((evt) => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });

    return () => {
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, handleUserActivity);
      });
    };
  }, [isLoggedIn, resetActivityTimer]);

  // Main 1-second interval timer
  useEffect(() => {
    if (!isLoggedIn) return;

    const interval = setInterval(() => {
      setSecondsInactive((prev) => {
        const nextSeconds = prev + 1;
        const remaining = maxIdleSeconds - nextSeconds;

        // Check if should show warning modal
        if (remaining <= effectiveWarningSeconds && remaining > 0) {
          setShowWarningModal(true);
        }

        // Check if session timeout threshold reached
        if (nextSeconds >= maxIdleSeconds) {
          performLogout('idle_timeout');
          return maxIdleSeconds;
        }

        return nextSeconds;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isLoggedIn, maxIdleSeconds, effectiveWarningSeconds, performLogout]);

  // Re-authentication handler
  const handleReAuthenticate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsAuthenticating(true);
    setAuthError(null);

    // Simulate enterprise SSO/Password verification
    setTimeout(() => {
      setIsAuthenticating(false);
      setIsLoggedIn(true);
      setSecondsInactive(0);
      setLastActivityTime(new Date());
      setLogoutReason(null);
      setAuthPassword('');
      if (onSessionStateChange) onSessionStateChange(true);
    }, 600);
  };

  // Format seconds to mm:ss
  const formatTimeMinutesSeconds = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative w-full min-h-screen">
      {/* Session Security Global Status Indicator / Quick Controls Bar */}
      {isLoggedIn && (
        <div id="session-security-status-bar" className="bg-slate-900/90 border-b border-slate-800/80 px-4 py-1.5 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>SOC2 Session Active</span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Auto-Lock:</span>
              <strong className="text-white font-bold">{formatTimeMinutesSeconds(secondsRemaining)}</strong>
              <span className="text-slate-500">({timeoutMinutes}m Policy)</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace Children or Locked Screen */}
      {isLoggedIn ? (
        children
      ) : (
        /* Locked / Timed-Out Screen Overlay */
        <div id="session-lock-overlay" className="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950 to-slate-950">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl relative overflow-hidden">
            {/* Top Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500"></div>

            <div className="text-center space-y-2">
              <div className="inline-flex p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20 mb-1">
                <Lock className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">Session Suspended</h2>
              <p className="text-xs text-slate-400">
                {logoutReason === 'idle_timeout'
                  ? 'Your session timed out after 30 minutes of inactivity to protect sensitive enterprise data.'
                  : 'You have manually locked your active enterprise session.'}
              </p>
            </div>

            {/* Security Compliance Banner */}
            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5 font-bold text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                  Security Protocol Executed
                </span>
                <span className="text-[10px] font-mono text-slate-500">SOC 2 / NIST 800-53</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                In-memory tokens, cached database responses, and sensitive migration buffers were purged from browser local storage.
              </p>
            </div>

            {/* Locked User Card */}
            <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800/80 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold text-sm font-mono">
                AM
              </div>
              <div className="text-left flex-1 min-w-0">
                <h4 className="font-bold text-xs text-white truncate">{DEFAULT_USER.name}</h4>
                <p className="text-[11px] text-slate-400 truncate">{DEFAULT_USER.email}</p>
                <span className="text-[10px] text-indigo-400 font-mono block mt-0.5">{DEFAULT_USER.role}</span>
              </div>
            </div>

            {/* Re-Authentication Form */}
            <form onSubmit={handleReAuthenticate} className="space-y-4">
              <div>
                <label className="text-slate-400 text-xs font-bold block mb-1.5">
                  Enter Password or Re-Authenticate SSO
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    placeholder="Enter account password..."
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              {authError && (
                <div className="text-rose-400 text-xs flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                {isAuthenticating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>Unlock & Restore Workspace</span>
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => handleReAuthenticate()}
                className="text-indigo-400 hover:text-indigo-300 text-xs font-medium underline cursor-pointer"
              >
                Quick SSO Re-Auth via Okta Enterprise
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inactivity Warning Modal */}
      {showWarningModal && isLoggedIn && (
        <div id="idle-timeout-warning-modal" className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-5 shadow-2xl relative">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <span className="p-2.5 bg-amber-500/20 text-amber-300 rounded-xl border border-amber-500/40">
                <Clock className="w-6 h-6 animate-pulse" />
              </span>
              <div>
                <h3 className="font-bold text-base text-white">Session Timeout Warning</h3>
                <p className="text-xs text-slate-400">Inactivity detected on account</p>
              </div>
            </div>

            <div className="text-center space-y-3 py-2">
              <div className="text-3xl font-extrabold font-mono text-amber-300">
                {formatTimeMinutesSeconds(secondsRemaining)}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                You have been inactive. In compliance with enterprise security policy, your session will automatically log out and purge memory state in{' '}
                <strong className="text-amber-300 font-mono">{secondsRemaining} seconds</strong>.
              </p>

              {/* Urgency Progress Bar */}
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-amber-400 to-rose-500 h-full transition-all duration-1000"
                  style={{
                    width: `${Math.min(100, (secondsRemaining / effectiveWarningSeconds) * 100)}%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => performLogout('manual')}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Log Out Now
              </button>

              <button
                type="button"
                onClick={resetActivityTimer}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Stay Logged In</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
