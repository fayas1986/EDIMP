import React, { useState, useEffect } from 'react';
import {
  Shield,
  UserCheck,
  KeyRound,
  Lock,
  Search,
  Filter,
  CheckCircle2,
  X,
  Mail,
  Copy,
  Check,
  RefreshCw,
  Globe,
  Fingerprint,
  QrCode,
  ShieldCheck,
  ShieldAlert,
  Terminal,
  ExternalLink,
  Users,
  LogOut,
  Sparkles,
  ArrowRight,
  Sliders,
  Award,
  Layers,
  Building2,
} from 'lucide-react';
import { UserRole } from '../types';
import { UserIdentity, MOCK_ALL_USERS } from '../data/mockUsers';

export interface AuthSessionManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserIdentity;
  onSelectUser: (user: UserIdentity) => void;
  onRoleChange: (role: UserRole) => void;
}

export const AuthSessionManagerModal: React.FC<AuthSessionManagerModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSelectUser,
  onRoleChange,
}) => {
  const [activeTab, setActiveTab] = useState<'SWITCH_USER' | 'SSO_PROVIDERS' | 'MFA_CHALLENGE' | 'SSO_TOKENS'>('SWITCH_USER');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [selectedOrgTypeFilter, setSelectedOrgTypeFilter] = useState<string>('ALL');
  const [copiedToken, setCopiedToken] = useState(false);

  // SAML & OIDC SSO Provider Management State
  const [ssoProvidersList, setSsoProvidersList] = useState([
    {
      id: 'prov-okta-01',
      name: 'Okta Universal Directory',
      protocol: 'OIDC' as 'OIDC' | 'SAML2',
      domain: 'acme-corp.com',
      issuer: 'https://acme.okta.com/oauth2/default',
      clientId: '0oae189x09XzMkp097',
      status: 'Active' as 'Active' | 'Configuring' | 'Disabled',
      verificationStatus: 'Pending' as 'Verified' | 'Error' | 'Pending',
      mappedRole: 'Customer Administrator',
      enforceMfa: true,
      acsUrl: 'https://app.edimp.io/api/auth/sso/oidc/callback',
      samlEntityId: 'urn:edimp:sp:acme-corp',
      x509CertFingerprint: '9A:8B:7C:6D:5E:4F:3A:2B:1C:0D:9E:8F:7A:6B:5C:4D',
      created: '2025-08-10',
    },
    {
      id: 'prov-azure-02',
      name: 'Microsoft Entra ID (Azure AD)',
      protocol: 'SAML2' as 'OIDC' | 'SAML2',
      domain: 'contoso-retail.com',
      issuer: 'https://sts.windows.net/72f988bf-86f1-41af-91ab-2d7cd011db47/',
      clientId: 'contoso-sso-app-id-998',
      status: 'Active' as 'Active' | 'Configuring' | 'Disabled',
      verificationStatus: 'Pending' as 'Verified' | 'Error' | 'Pending',
      mappedRole: 'Customer Administrator',
      enforceMfa: true,
      acsUrl: 'https://app.edimp.io/api/auth/sso/saml/acs',
      samlEntityId: 'https://contoso-retail.com/saml2',
      x509CertFingerprint: '11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00',
      created: '2025-09-01',
    },
    {
      id: 'prov-google-03',
      name: 'Google Workspace Enterprise',
      protocol: 'OIDC' as 'OIDC' | 'SAML2',
      domain: 'avanade-partner.com',
      issuer: 'https://accounts.google.com',
      clientId: '882910398201-g8s91k.apps.googleusercontent.com',
      status: 'Active' as 'Active' | 'Configuring' | 'Disabled',
      verificationStatus: 'Pending' as 'Verified' | 'Error' | 'Pending',
      mappedRole: 'Partner Administrator',
      enforceMfa: true,
      acsUrl: 'https://app.edimp.io/api/auth/sso/oidc/callback',
      samlEntityId: 'urn:edimp:sp:avanade',
      x509CertFingerprint: 'AA:BB:CC:DD:EE:FF:11:22:33:44:55:66:77:88:99:00',
      created: '2025-04-12',
    },
    {
      id: 'prov-ping-04',
      name: 'PingFederate Identity Enterprise',
      protocol: 'SAML2' as 'OIDC' | 'SAML2',
      domain: 'pwc-advisory.de',
      issuer: 'https://sso.pwc-advisory.de/idp/shibboleth',
      clientId: 'ping-pwc-client-id',
      status: 'Active' as 'Active' | 'Configuring' | 'Disabled',
      verificationStatus: 'Pending' as 'Verified' | 'Error' | 'Pending',
      mappedRole: 'Partner Administrator',
      enforceMfa: true,
      acsUrl: 'https://app.edimp.io/api/auth/sso/saml/acs',
      samlEntityId: 'https://pwc-advisory.de/saml/sp',
      x509CertFingerprint: 'FF:EE:DD:CC:BB:AA:99:88:77:66:55:44:33:22:11:00',
      created: '2025-06-15',
    },
  ]);

  // Automatic page load status verification check for configured SSO providers
  useEffect(() => {
    const timer = setTimeout(() => {
      setSsoProvidersList((prev) =>
        prev.map((prov) => {
          let vStatus: 'Verified' | 'Error' | 'Pending' = 'Verified';
          if (prov.status === 'Disabled') {
            vStatus = 'Error';
          } else if (prov.status === 'Configuring') {
            vStatus = 'Pending';
          } else if (!prov.issuer || prov.issuer.trim() === '') {
            vStatus = 'Error';
          } else {
            vStatus = 'Verified';
          }
          return {
            ...prov,
            verificationStatus: vStatus,
          };
        })
      );
    }, 700);

    return () => clearTimeout(timer);
  }, []);

  const [selectedProviderId, setSelectedProviderId] = useState<string>('prov-okta-01');
  const [ssoTestEmail, setSsoTestEmail] = useState<string>('marcus@acme-corp.com');
  const [ssoTestStep, setSsoTestStep] = useState<number>(0);
  const [isSimulatingSso, setIsSimulatingSso] = useState<boolean>(false);
  const [ssoTestLog, setSsoTestLog] = useState<string[]>([]);

  // New Provider Form State
  const [showAddProviderModal, setShowAddProviderModal] = useState<boolean>(false);
  const [newProvName, setNewProvName] = useState('');
  const [newProvProtocol, setNewProvProtocol] = useState<'OIDC' | 'SAML2'>('OIDC');
  const [newProvDomain, setNewProvDomain] = useState('');
  const [newProvIssuer, setNewProvIssuer] = useState('');
  const [newProvClientId, setNewProvClientId] = useState('');

  // MFA Challenge State
  const [mfaPin, setMfaPin] = useState(['', '', '', '', '', '']);
  const [mfaStatus, setMfaStatus] = useState<'IDLE' | 'SUCCESS' | 'FAILED'>('IDLE');

  if (!isOpen) return null;

  // Filter user list
  const filteredUsers = MOCK_ALL_USERS.filter((u) => {
    if (selectedRoleFilter !== 'ALL' && u.role !== selectedRoleFilter) return false;
    if (selectedOrgTypeFilter !== 'ALL' && u.orgType !== selectedOrgTypeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = `${u.firstName} ${u.lastName}`.toLowerCase().includes(q);
      const matchEmail = u.email.toLowerCase().includes(q);
      const matchOrg = u.organization.toLowerCase().includes(q);
      const matchRole = u.role.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchOrg && !matchRole) return false;
    }
    return true;
  });

  const handleCopyToken = () => {
    if (currentUser.jwtToken) {
      navigator.clipboard.writeText(currentUser.jwtToken);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const handleVerifyMfa = () => {
    const pinStr = mfaPin.join('');
    if (pinStr.length === 6) {
      setMfaStatus('SUCCESS');
    } else {
      setMfaStatus('FAILED');
    }
  };

  const handleSimulateSsoLogin = (emailToTest: string) => {
    setIsSimulatingSso(true);
    setSsoTestStep(1);
    setSsoTestLog([`[INIT] Intercepting single sign-on authentication request for ${emailToTest}...`]);

    const domain = emailToTest.includes('@') ? emailToTest.split('@')[1] : 'acme-corp.com';
    const matchedProv = ssoProvidersList.find((p) => p.domain.toLowerCase() === domain.toLowerCase()) || ssoProvidersList[0];

    setTimeout(() => {
      setSsoTestStep(2);
      setSsoTestLog((prev) => [
        ...prev,
        `[DOMAIN_ROUTING] Domain @${domain} matched active Enterprise SSO Provider: "${matchedProv.name}" (${matchedProv.protocol}).`,
        `[IDP_HANDSHAKE] Initializing ${matchedProv.protocol === 'SAML2' ? 'SAML 2.0 AuthNRequest HTTP-POST' : 'OIDC Authorization Code + PKCE'} redirect...`,
        `[ENDPOINT] Redirecting to IdP Issuer: ${matchedProv.issuer}`,
      ]);
    }, 900);

    setTimeout(() => {
      setSsoTestStep(3);
      setSsoTestLog((prev) => [
        ...prev,
        `[IDP_RESPONSE] Received signed ${matchedProv.protocol === 'SAML2' ? 'SAML Assertion' : 'OIDC ID Token / JWS'} from ${matchedProv.name}.`,
        `[CRYPTOGRAPHY] Validated X.509 Certificate (Fingerprint: ${matchedProv.x509CertFingerprint.slice(0, 14)}...).`,
        `[CLAIMS_MAPPING] Claims parsed: email=${emailToTest}, role=${matchedProv.mappedRole}, provider=${matchedProv.protocol}`,
      ]);
    }, 2000);

    setTimeout(() => {
      setSsoTestStep(4);
      setSsoTestLog((prev) => [
        ...prev,
        `[SUCCESS] SSO Session Established! Enterprise JWT token issued & user profile activated.`,
      ]);
      setIsSimulatingSso(false);

      const match = MOCK_ALL_USERS.find((u) => u.email.toLowerCase() === emailToTest.toLowerCase());
      if (match) {
        onSelectUser(match);
        onRoleChange(match.role);
      }
    }, 3200);
  };

  const handleCreateSsoProvider = () => {
    if (!newProvName || !newProvDomain) return;
    const newProv = {
      id: `prov-custom-${Date.now()}`,
      name: newProvName,
      protocol: newProvProtocol,
      domain: newProvDomain.toLowerCase().replace(/https?:\/\//, '').trim(),
      issuer: newProvIssuer || `https://auth.${newProvDomain}/oauth2/v1`,
      clientId: newProvClientId || `sso-client-${Math.floor(Math.random() * 100000)}`,
      status: 'Active' as const,
      verificationStatus: 'Pending' as const,
      mappedRole: 'Customer Administrator',
      enforceMfa: true,
      acsUrl: newProvProtocol === 'SAML2' ? 'https://app.edimp.io/api/auth/sso/saml/acs' : 'https://app.edimp.io/api/auth/sso/oidc/callback',
      samlEntityId: `urn:edimp:sp:${newProvDomain.replace(/\./g, '-')}`,
      x509CertFingerprint: 'C4:5A:90:12:34:56:78:90:AB:CD:EF:FE:DC:BA:09:87',
      created: new Date().toISOString().split('T')[0],
    };
    setSsoProvidersList([newProv as any, ...ssoProvidersList]);
    setSelectedProviderId(newProv.id);
    setNewProvName('');
    setNewProvDomain('');
    setNewProvIssuer('');
    setNewProvClientId('');
    setShowAddProviderModal(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-tight">
                  Enterprise Authentication &amp; Identity Manager
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  SSO &amp; RBAC Auth Hub
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Authenticate as platform users, partner leads, or customer administrators with live RBAC session propagation.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Logged In Banner */}
        <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border-b border-indigo-900/40 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl ${currentUser.avatarColor} text-white font-black text-sm flex items-center justify-center shadow-md border border-white/20`}>
              {currentUser.firstName[0]}
              {currentUser.lastName[0]}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-white">{currentUser.firstName} {currentUser.lastName}</span>
                <span className="px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-[10px] font-mono font-black">
                  {currentUser.role}
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-extrabold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  AUTHENTICATED
                </span>
              </div>
              <div className="text-xs text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                <span>{currentUser.email}</span>
                <span>•</span>
                <span className="text-indigo-300 font-semibold">{currentUser.organization}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <div className="text-[10px] uppercase font-mono font-bold text-slate-400">SSO Provider</div>
              <div className="text-xs font-bold text-slate-200 font-mono">{currentUser.ssoProvider}</div>
            </div>
            <button
              onClick={handleCopyToken}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
            >
              {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-indigo-400" />}
              <span>{copiedToken ? 'JWT Copied' : 'Copy JWT Token'}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 pt-3 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('SWITCH_USER')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition cursor-pointer flex items-center gap-2 border-b-2 ${
              activeTab === 'SWITCH_USER'
                ? 'bg-slate-900 text-indigo-300 border-indigo-500'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Switch User / Partner Directory ({MOCK_ALL_USERS.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('SSO_PROVIDERS')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition cursor-pointer flex items-center gap-2 border-b-2 ${
              activeTab === 'SSO_PROVIDERS'
                ? 'bg-slate-900 text-indigo-300 border-indigo-500'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>SAML 2.0 &amp; OIDC Providers ({ssoProvidersList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('MFA_CHALLENGE')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition cursor-pointer flex items-center gap-2 border-b-2 ${
              activeTab === 'MFA_CHALLENGE'
                ? 'bg-slate-900 text-indigo-300 border-indigo-500'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Fingerprint className="w-4 h-4" />
            <span>MFA &amp; Biometric Auth</span>
          </button>

          <button
            onClick={() => setActiveTab('SSO_TOKENS')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition cursor-pointer flex items-center gap-2 border-b-2 ${
              activeTab === 'SSO_TOKENS'
                ? 'bg-slate-900 text-indigo-300 border-indigo-500'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>OIDC / JWT Claims Inspector</span>
          </button>
        </div>

        {/* Tab 1: User Directory & One-Click Login Switcher */}
        {activeTab === 'SWITCH_USER' && (
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            {/* Filter bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search name, email, role, partner..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <select
                  value={selectedRoleFilter}
                  onChange={(e) => setSelectedRoleFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="ALL">All Roles (11 Granular Tiers)</option>
                  <option value="Super Administrator">Super Administrator</option>
                  <option value="Platform Administrator">Platform Administrator</option>
                  <option value="Partner Administrator">Partner Administrator</option>
                  <option value="Customer Administrator">Customer Administrator</option>
                  <option value="Project Manager">Project Manager</option>
                  <option value="Migration Consultant">Migration Consultant</option>
                  <option value="Data Engineer">Data Engineer</option>
                  <option value="Functional Consultant">Functional Consultant</option>
                  <option value="Auditor">Auditor</option>
                  <option value="Data Analyst">Data Analyst</option>
                  <option value="Business User">Business User</option>
                  <option value="Read Only">Read Only</option>
                </select>
              </div>

              <div>
                <select
                  value={selectedOrgTypeFilter}
                  onChange={(e) => setSelectedOrgTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="ALL">All Organization Types</option>
                  <option value="Platform">Platform Core HQ</option>
                  <option value="Partner">System Integrator Partners</option>
                  <option value="Customer">Enterprise Customers</option>
                </select>
              </div>
            </div>

            {/* Users Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredUsers.map((user) => {
                const isSelected = user.id === currentUser.id;

                return (
                  <div
                    key={user.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500 shadow-md ring-1 ring-indigo-500/50'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl ${user.avatarColor} text-white font-black text-xs flex items-center justify-center shrink-0 border border-white/20`}>
                        {user.firstName[0]}
                        {user.lastName[0]}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-xs text-white truncate">
                            {user.firstName} {user.lastName}
                          </span>
                          {isSelected && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[9px] font-bold border border-emerald-500/30">
                              Active
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] font-bold text-indigo-300 font-mono truncate">
                          {user.role}
                        </div>

                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5 truncate">
                          <Building2 className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="truncate">{user.organization}</span>
                        </div>

                        <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
                          <span>SSO: {user.ssoProvider}</span>
                          <span>•</span>
                          <span>MFA: {user.mfaEnforced ? 'Enforced' : 'Optional'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 pt-1">
                      {isSelected ? (
                        <div className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black rounded-lg font-mono flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>LOGGED IN</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            onSelectUser(user);
                            onRoleChange(user.role);
                          }}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1"
                        >
                          <span>Authenticate</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Enterprise SAML 2.0 & OIDC SSO Providers */}
        {activeTab === 'SSO_PROVIDERS' && (
          <div className="p-5 space-y-5 overflow-y-auto flex-1">
            {/* Header / Config summary banner */}
            <div className="p-4 bg-gradient-to-r from-slate-950 via-indigo-950/40 to-slate-950 border border-slate-800 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-extrabold text-sm text-white">Enterprise Single Sign-On (SAML 2.0 &amp; OIDC PKCE)</h3>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    4 IdPs Configured
                  </span>
                </div>
                <p className="text-xs text-slate-400 max-w-2xl">
                  Enterprise customers authenticate via corporate Identity Providers (Okta, Entra ID, Google Workspace, PingFederate). Email domain routing automatically redirects users to their assigned IdP.
                </p>
              </div>

              <button
                onClick={() => setShowAddProviderModal(true)}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-2 shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                <span>Register New SAML / OIDC IdP</span>
              </button>
            </div>

            {/* Modal for adding new Provider */}
            {showAddProviderModal && (
              <div className="p-4 bg-slate-950 border border-indigo-500/50 rounded-2xl space-y-4 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="font-extrabold text-xs text-white uppercase font-mono tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    Add Enterprise Identity Provider
                  </h4>
                  <button
                    onClick={() => setShowAddProviderModal(false)}
                    className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-400 mb-1">Provider Display Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Auth0 / OneLogin Enterprise"
                      value={newProvName}
                      onChange={(e) => setNewProvName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-400 mb-1">SSO Protocol Standard</label>
                    <select
                      value={newProvProtocol}
                      onChange={(e) => setNewProvProtocol(e.target.value as 'OIDC' | 'SAML2')}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="OIDC">OpenID Connect (OIDC Authorization Code + PKCE)</option>
                      <option value="SAML2">SAML 2.0 Assertion (HTTP-POST / Artifact Binding)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-400 mb-1">Target Corporate Domain</label>
                    <input
                      type="text"
                      placeholder="e.g. acme-corp.com"
                      value={newProvDomain}
                      onChange={(e) => setNewProvDomain(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-400 mb-1">IdP Issuer URL / Entity ID</label>
                    <input
                      type="text"
                      placeholder="e.g. https://auth.acme-corp.com/oauth2/v1"
                      value={newProvIssuer}
                      onChange={(e) => setNewProvIssuer(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => setShowAddProviderModal(false)}
                    className="px-3 py-1.5 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateSsoProvider}
                    disabled={!newProvName || !newProvDomain}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs transition cursor-pointer"
                  >
                    Save &amp; Activate Provider
                  </button>
                </div>
              </div>
            )}

            {/* Interactive SSO Login & Domain Routing Testing Panel */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-black uppercase font-mono text-white tracking-wider">
                    Domain Routing &amp; Live SSO Authentication Tester
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30">
                  Real-time IdP Handshake Simulator
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-mono font-bold text-slate-400 mb-1">
                    Enter Corporate Email to Test Domain Auto-Routing
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={ssoTestEmail}
                      onChange={(e) => setSsoTestEmail(e.target.value)}
                      placeholder="e.g. marcus@acme-corp.com or elena.rostova@avanade-partner.com"
                      className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      onClick={() => handleSimulateSsoLogin(ssoTestEmail)}
                      disabled={isSimulatingSso || !ssoTestEmail}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      {isSimulatingSso ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <KeyRound className="w-3.5 h-3.5" />
                      )}
                      <span>{isSimulatingSso ? 'Authenticating...' : 'Test SSO Flow'}</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold text-slate-400 block">Quick Email Presets:</span>
                  <div className="flex flex-wrap gap-1">
                    <button
                      onClick={() => setSsoTestEmail('marcus@acme-corp.com')}
                      className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-[10px] font-mono text-indigo-300 cursor-pointer"
                    >
                      @acme-corp.com (Okta)
                    </button>
                    <button
                      onClick={() => setSsoTestEmail('jennifer.w@contoso-retail.com')}
                      className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-[10px] font-mono text-sky-300 cursor-pointer"
                    >
                      @contoso-retail.com (Entra)
                    </button>
                    <button
                      onClick={() => setSsoTestEmail('elena.rostova@avanade-partner.com')}
                      className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-[10px] font-mono text-emerald-300 cursor-pointer"
                    >
                      @avanade-partner.com (Google)
                    </button>
                  </div>
                </div>
              </div>

              {/* Progress Steps Indicator */}
              {ssoTestStep > 0 && (
                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <div className="grid grid-cols-4 gap-1 text-[10px] font-mono font-bold text-center">
                    <div className={`p-1.5 rounded-lg border ${ssoTestStep >= 1 ? 'bg-indigo-950 border-indigo-500 text-indigo-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                      1. Intercept Request
                    </div>
                    <div className={`p-1.5 rounded-lg border ${ssoTestStep >= 2 ? 'bg-indigo-950 border-indigo-500 text-indigo-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                      2. Domain Routing &amp; IdP
                    </div>
                    <div className={`p-1.5 rounded-lg border ${ssoTestStep >= 3 ? 'bg-indigo-950 border-indigo-500 text-indigo-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                      3. SAML / JWS Validation
                    </div>
                    <div className={`p-1.5 rounded-lg border ${ssoTestStep >= 4 ? 'bg-emerald-950 border-emerald-500 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                      4. JWT Session Granted
                    </div>
                  </div>

                  {/* Terminal Log Console */}
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 font-mono text-[11px] text-emerald-400 space-y-1 overflow-x-auto max-h-32">
                    {ssoTestLog.map((logLine, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-slate-500 select-none">&gt;</span>
                        <span>{logLine}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Providers List Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>Active Enterprise Identity Provider Connections</span>
                <span className="text-[10px] font-mono text-slate-500">SSO ACS &amp; Metadata Endpoints</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {ssoProvidersList.map((prov) => {
                  const isSelected = prov.id === selectedProviderId;

                  return (
                    <div
                      key={prov.id}
                      onClick={() => setSelectedProviderId(prov.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                        isSelected
                          ? 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500/50 shadow-md'
                          : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-xs text-white">{prov.name}</span>

                            {/* Color-Coded Connection Status Badge */}
                            <span
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-mono font-extrabold border transition-all ${
                                prov.verificationStatus === 'Verified'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : prov.verificationStatus === 'Error'
                                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              }`}
                              title={`Verification Status: ${prov.verificationStatus || 'Pending'}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                  prov.verificationStatus === 'Verified'
                                    ? 'bg-emerald-400'
                                    : prov.verificationStatus === 'Error'
                                    ? 'bg-rose-400'
                                    : 'bg-amber-400 animate-pulse'
                                }`}
                              />
                              <span>{prov.verificationStatus || 'Pending'}</span>
                            </span>

                            <span
                              className={`px-2 py-0.5 rounded text-[9px] font-mono font-extrabold border ${
                                prov.protocol === 'SAML2'
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                  : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                              }`}
                            >
                              {prov.protocol === 'SAML2' ? 'SAML 2.0 Assertion' : 'OIDC PKCE'}
                            </span>
                          </div>
                          <div className="text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                            <Globe className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span>Auto-routed Domain: @{prov.domain}</span>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                          {prov.status}
                        </span>
                      </div>

                      <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 text-[10px] font-mono space-y-1 text-slate-300">
                        <div className="truncate">
                          <strong className="text-slate-400">Issuer / IdP URL:</strong> {prov.issuer}
                        </div>
                        <div className="truncate">
                          <strong className="text-slate-400">Entity / Client ID:</strong> {prov.clientId}
                        </div>
                        <div className="truncate">
                          <strong className="text-slate-400">ACS Callback:</strong> {prov.acsUrl}
                        </div>
                        <div className="truncate text-slate-400">
                          <strong>X.509 Cert Fingerprint:</strong> {prov.x509CertFingerprint}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800/80">
                        <span>Mapped Role: <strong className="text-indigo-300">{prov.mappedRole}</strong></span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSimulateSsoLogin(`admin@${prov.domain}`);
                          }}
                          className="px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600/60 text-indigo-200 border border-indigo-500/40 rounded-lg font-bold transition cursor-pointer"
                        >
                          Test @{prov.domain}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: MFA & Biometric Simulator */}
        {activeTab === 'MFA_CHALLENGE' && (
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-4">
              <QrCode className="w-16 h-16 text-indigo-400 bg-white p-2 rounded-xl shrink-0" />
              <div className="space-y-1">
                <h4 className="font-black text-sm text-white">Multi-Factor Authentication (TOTP / WebAuthn)</h4>
                <p className="text-xs text-slate-400">
                  Enter the 6-digit verification code generated by Microsoft Authenticator, Google Authenticator, or YubiKey hardware token.
                </p>
                <div className="text-[10px] font-mono text-indigo-300 font-bold">
                  User Account: {currentUser.email} ({currentUser.ssoProvider})
                </div>
              </div>
            </div>

            <div className="max-w-md mx-auto p-6 bg-slate-950 border border-slate-800 rounded-3xl space-y-5 text-center">
              <span className="text-xs font-mono font-bold uppercase text-slate-400">Enter 6-Digit TOTP Code</span>
              <div className="flex justify-center gap-2">
                {[0, 1, 2, 3, 4, 5].map((idx) => (
                  <input
                    key={idx}
                    type="text"
                    maxLength={1}
                    value={mfaPin[idx]}
                    onChange={(e) => {
                      const newPin = [...mfaPin];
                      newPin[idx] = e.target.value;
                      setMfaPin(newPin);
                    }}
                    className="w-10 h-12 text-center text-lg font-black font-mono bg-slate-900 border border-slate-700 rounded-xl focus:border-indigo-500 focus:outline-none text-white"
                  />
                ))}
              </div>

              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setMfaPin(['1', '2', '3', '4', '5', '6'])}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] font-mono font-bold text-slate-300 rounded-lg cursor-pointer"
                >
                  Autofill Valid Code (123456)
                </button>
              </div>

              {mfaStatus === 'SUCCESS' && (
                <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>MFA Token Verified Successfully! Session elevation granted.</span>
                </div>
              )}

              {mfaStatus === 'FAILED' && (
                <div className="p-3 bg-rose-500/20 border border-rose-500/40 text-rose-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>Invalid TOTP Pin Code. Please try again.</span>
                </div>
              )}

              <button
                onClick={handleVerifyMfa}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer"
              >
                Verify MFA Security Token
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: OIDC / JWT Claims Inspector */}
        {activeTab === 'SSO_TOKENS' && (
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-indigo-400" />
                <h4 className="font-extrabold text-sm text-white">Active OIDC ID Token Claims</h4>
              </div>
              <button
                onClick={handleCopyToken}
                className="px-3 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-xs font-bold rounded-lg cursor-pointer"
              >
                Copy Raw Encrypted JWT
              </button>
            </div>

            <div className="p-4 bg-slate-950 font-mono text-xs rounded-2xl border border-slate-800 space-y-2 text-slate-300">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Decoded Header &amp; Payload</div>
              <pre className="text-emerald-400 overflow-x-auto p-3 bg-slate-900 rounded-xl border border-slate-800 text-[11px] leading-relaxed">
{JSON.stringify(
  {
    alg: 'RS256',
    typ: 'JWT',
    kid: 'edimp-prod-key-2026',
    sub: currentUser.id,
    iss: `https://sso.${currentUser.ssoProvider.toLowerCase().replace(/\s+/g, '')}.com/oauth2/v1`,
    aud: 'edimp-migration-workbench-app',
    email: currentUser.email,
    name: `${currentUser.firstName} ${currentUser.lastName}`,
    role: currentUser.role,
    organization: currentUser.organization,
    tenant_access: currentUser.tenantAccessList,
    mfa_verified: currentUser.mfaVerified,
    iat: Math.floor(Date.now() / 1000) - 3600,
    exp: Math.floor(Date.now() / 1000) + 28800,
  },
  null,
  2
)}
              </pre>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span className="font-mono">
            Active Identity: <strong className="text-white">{currentUser.firstName} {currentUser.lastName}</strong> ({currentUser.role})
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
