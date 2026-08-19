import React, { useState } from 'react';
import {
  ShieldCheck,
  KeyRound,
  Lock,
  Mail,
  Eye,
  EyeOff,
  UserCheck,
  Globe,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Shield,
  Layers,
  Fingerprint,
  Building2,
  Users,
} from 'lucide-react';
import { UserIdentity, MOCK_ALL_USERS } from '../data/mockUsers';

interface LoginViewProps {
  onLoginSuccess: (user: UserIdentity) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('sarah.jenkins@edimp-platform.io');
  const [password, setPassword] = useState('SuperAdmin2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // MFA Challenge State
  const [mfaChallengeUser, setMfaChallengeUser] = useState<UserIdentity | null>(null);
  const [mfaCode, setMfaCode] = useState('842910');
  const [mfaError, setMfaError] = useState('');

  // Persona Category Filter for Quick Login
  const [personaCategory, setPersonaCategory] = useState<'ALL' | 'ADMIN' | 'ENGINEER' | 'CONSULTANT' | 'AUDIT' | 'READONLY'>('ALL');
  const [personaSearch, setPersonaSearch] = useState('');

  // Handle Standard Credentials Form Submit
  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const cleanInput = usernameOrEmail.trim().toLowerCase();

      // Find matching mock user by email, ID, or username match
      const foundUser = MOCK_ALL_USERS.find(
        (u) =>
          u.email.toLowerCase() === cleanInput ||
          u.id.toLowerCase() === cleanInput ||
          u.firstName.toLowerCase() === cleanInput ||
          cleanInput.includes(u.firstName.toLowerCase())
      );

      if (!foundUser) {
        setErrorMessage('Invalid corporate credentials. Please check your email or username.');
        return;
      }

      if (foundUser.mfaEnforced && !mfaChallengeUser) {
        setMfaChallengeUser(foundUser);
        return;
      }

      onLoginSuccess(foundUser);
    }, 600);
  };

  // Handle Quick Login Select
  const handleQuickLogin = (user: UserIdentity) => {
    if (user.mfaEnforced) {
      setMfaChallengeUser(user);
    } else {
      onLoginSuccess(user);
    }
  };

  // Handle SSO Single Sign-On Simulation
  const handleSsoLogin = (providerName: string) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const ssoUser = MOCK_ALL_USERS.find((u) => u.ssoProvider.includes(providerName)) || MOCK_ALL_USERS[0];
      onLoginSuccess(ssoUser);
    }, 800);
  };

  // Handle MFA Form Submit
  const handleMfaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaCode || mfaCode.length < 4) {
      setMfaError('Please enter a valid 6-digit TOTP security code.');
      return;
    }
    if (mfaChallengeUser) {
      onLoginSuccess(mfaChallengeUser);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
      {/* Top Header Branding Bar */}
      <header className="border-b border-slate-800/80 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 font-black text-lg">
            E
          </div>
          <div>
            <span className="font-black text-white text-base tracking-tight flex items-center gap-2">
              EDIMP Migration Studio
              <span className="px-2 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px] font-mono font-bold rounded">
                v3.4 Production
              </span>
            </span>
            <p className="text-[11px] text-slate-400 font-medium">Enterprise Single Sign-On &amp; Identity Portal</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-4 text-xs text-slate-400 font-mono">
          <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Okta &amp; SAML2 Active
          </span>
          <span>•</span>
          <span>SOC2 Type II Certified</span>
        </div>
      </header>

      {/* Main Container Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        {/* MFA Challenge Modal View */}
        {mfaChallengeUser ? (
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-indigo-950 border border-indigo-700/80 mx-auto flex items-center justify-center text-indigo-400 shadow-lg">
                <Fingerprint className="w-8 h-8 animate-pulse" />
              </div>
              <h2 className="text-xl font-black text-white">Multi-Factor Authentication</h2>
              <p className="text-xs text-slate-400">
                Security policy enforces MFA for <strong className="text-white">{mfaChallengeUser.email}</strong>
              </p>
            </div>

            <form onSubmit={handleMfaSubmit} className="space-y-4">
              {mfaError && (
                <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-300 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{mfaError}</span>
                </div>
              )}

              <div>
                <label className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-wider block mb-1.5">
                  6-Digit TOTP / Hardware Security Key Code *
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 px-4 text-center font-mono font-black text-2xl text-emerald-400 tracking-widest outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="123456"
                />
                <span className="text-[10px] font-mono text-slate-500 mt-1 block text-center">
                  Tip: Use default code <strong className="text-indigo-300">842910</strong> or any 6 digits to verify.
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMfaChallengeUser(null)}
                  className="w-1/3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl cursor-pointer transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Verify &amp; Authenticate
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Standard Login & Quick Persona Selector Grid */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center w-full">
            {/* Left Column: Standard Credentials & SSO Login Form */}
            <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
              <div className="space-y-1">
                <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <Lock className="w-5 h-5 text-indigo-400" /> Enterprise Sign-In
                </h2>
                <p className="text-xs text-slate-400">
                  Authenticate with corporate credentials or enterprise Single Sign-On (SSO).
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-300 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Login Credentials Form */}
              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-wider block">
                    Corporate Email or Username *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={usernameOrEmail}
                      onChange={(e) => setUsernameOrEmail(e.target.value)}
                      placeholder="e.g. sarah.jenkins@edimp-platform.io"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs font-mono font-bold text-white outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-wider block">
                      Password *
                    </label>
                    <span className="text-[10px] font-mono text-indigo-400 hover:underline cursor-pointer">
                      Forgot password?
                    </span>
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-10 text-xs font-mono font-bold text-white outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-medium">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                    />
                    Remember enterprise session
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl cursor-pointer transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <span className="animate-pulse font-mono">Authenticating session...</span>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" />
                      Sign In to Workbench
                    </>
                  )}
                </button>
              </form>

              {/* SSO Single Sign-On Division */}
              <div className="space-y-3 pt-2 border-t border-slate-800/80">
                <div className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-wider text-center">
                  Or Authenticate via Enterprise SSO
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleSsoLogin('Okta')}
                    className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5 text-sky-400" />
                    Okta SSO
                  </button>
                  <button
                    onClick={() => handleSsoLogin('Azure')}
                    className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                    Azure AD
                  </button>
                  <button
                    onClick={() => handleSsoLogin('Google')}
                    className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    Google Workspace
                  </button>
                  <button
                    onClick={() => handleSsoLogin('PingFederate')}
                    className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                    PingFederate
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Demo Persona Quick Selector */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-400" /> Demo Quick Login Selector
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Select an enterprise persona to evaluate RBAC access levels &amp; permissions:
                    </p>
                  </div>
                  <span className="px-2 py-0.5 bg-indigo-950 text-indigo-300 text-[10px] font-mono font-bold rounded border border-indigo-800">
                    One-Click
                  </span>
                </div>

                {/* Category Tabs & Search */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                    {[
                      { id: 'ALL', label: 'All Roles' },
                      { id: 'ADMIN', label: 'Admins' },
                      { id: 'ENGINEER', label: 'Engineering' },
                      { id: 'CONSULTANT', label: 'Consultants & PM' },
                      { id: 'AUDIT', label: 'Audit & Analytics' },
                      { id: 'READONLY', label: 'Read-Only & Guest' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setPersonaCategory(tab.id as any)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap cursor-pointer transition-all ${
                          personaCategory === tab.id
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    placeholder="Search by name, role or email..."
                    value={personaSearch}
                    onChange={(e) => setPersonaSearch(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Filtered Persona List */}
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {MOCK_ALL_USERS.filter((user) => {
                    // Category check
                    if (personaCategory === 'ADMIN') {
                      if (!['Super Administrator', 'Platform Administrator', 'Admin', 'Partner Administrator', 'Partner Admin', 'Customer Administrator'].includes(user.role)) return false;
                    } else if (personaCategory === 'ENGINEER') {
                      if (!['Data Engineer', 'Migration Consultant'].includes(user.role)) return false;
                    } else if (personaCategory === 'CONSULTANT') {
                      if (!['Project Manager', 'Functional Consultant'].includes(user.role)) return false;
                    } else if (personaCategory === 'AUDIT') {
                      if (!['Auditor', 'Data Analyst'].includes(user.role)) return false;
                    } else if (personaCategory === 'READONLY') {
                      if (!['Business User', 'Read Only'].includes(user.role)) return false;
                    }

                    // Search check
                    if (!personaSearch.trim()) return true;
                    const q = personaSearch.toLowerCase().trim();
                    return (
                      user.firstName.toLowerCase().includes(q) ||
                      user.lastName.toLowerCase().includes(q) ||
                      user.role.toLowerCase().includes(q) ||
                      user.email.toLowerCase().includes(q) ||
                      user.organization.toLowerCase().includes(q)
                    );
                  }).map((user) => {
                    // Determine Role Badge Styling
                    let roleBadgeClass = 'bg-slate-800 text-slate-300 border-slate-700';
                    let roleCategoryText = 'USER';
                    if (['Super Administrator', 'Platform Administrator', 'Admin', 'Partner Administrator', 'Partner Admin', 'Customer Administrator'].includes(user.role)) {
                      roleBadgeClass = 'bg-purple-950/80 text-purple-300 border-purple-800';
                      roleCategoryText = 'ADMIN';
                    } else if (['Data Engineer', 'Migration Consultant'].includes(user.role)) {
                      roleBadgeClass = 'bg-cyan-950/80 text-cyan-300 border-cyan-800';
                      roleCategoryText = 'TECH';
                    } else if (['Project Manager', 'Functional Consultant'].includes(user.role)) {
                      roleBadgeClass = 'bg-amber-950/80 text-amber-300 border-amber-800';
                      roleCategoryText = 'PM/ADVISORY';
                    } else if (['Auditor', 'Data Analyst'].includes(user.role)) {
                      roleBadgeClass = 'bg-emerald-950/80 text-emerald-300 border-emerald-800';
                      roleCategoryText = 'AUDIT';
                    } else if (['Business User', 'Read Only'].includes(user.role)) {
                      roleBadgeClass = 'bg-rose-950/80 text-rose-300 border-rose-800';
                      roleCategoryText = 'RESTRICTED';
                    }

                    return (
                      <button
                        key={user.id}
                        onClick={() => handleQuickLogin(user)}
                        className="w-full text-left p-3 bg-slate-950/80 hover:bg-slate-800/90 border border-slate-800/80 hover:border-indigo-500/50 rounded-2xl cursor-pointer transition-all flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl ${user.avatarColor} text-white font-black text-xs flex items-center justify-center shadow-md shrink-0`}>
                            {user.firstName[0]}{user.lastName[0]}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-white group-hover:text-indigo-300 transition-colors flex items-center gap-2">
                              <span className="truncate">{user.firstName} {user.lastName}</span>
                              <span className="text-[10px] font-mono font-normal text-slate-400 shrink-0">
                                @{user.email.split('@')[0]}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1.5 truncate mt-0.5">
                              <span className="font-semibold text-slate-300 truncate">{user.role}</span>
                              <span>•</span>
                              <span className="truncate">{user.organization}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded border ${roleBadgeClass}`}>
                            {roleCategoryText}
                          </span>
                          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer Compliance Information */}
      <footer className="border-t border-slate-800/80 px-6 py-4 text-center text-xs text-slate-500 font-mono">
        EDIMP Enterprise Migration Studio • Secured with OAuth2, OIDC &amp; RBAC Access Controls • ISO 27001 / SOC 2 Type II
      </footer>
    </div>
  );
};
