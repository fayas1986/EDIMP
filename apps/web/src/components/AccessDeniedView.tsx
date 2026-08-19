import React, { useState } from 'react';
import { ShieldAlert, ShieldX, KeyRound, ArrowLeft, Send, Sparkles, UserCheck, Lock, CheckCircle2 } from 'lucide-react';
import { UserIdentity } from '../data/mockUsers';
import { TAB_PERMISSIONS } from '../services/rbacService';

interface AccessDeniedViewProps {
  currentRole: string;
  currentUser: UserIdentity;
  forbiddenTabId: string;
  onNavigateHome: () => void;
  onOpenAuthModal: () => void;
}

export const AccessDeniedView: React.FC<AccessDeniedViewProps> = ({
  currentRole,
  currentUser,
  forbiddenTabId,
  onNavigateHome,
  onOpenAuthModal,
}) => {
  const [requestSent, setRequestSent] = useState(false);
  const [reasonText, setReasonText] = useState('');

  const allowedRoles = TAB_PERMISSIONS[forbiddenTabId] || ['Super Administrator', 'Customer Administrator'];

  const handleSendRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setRequestSent(true);
  };

  const formatTabName = (tab: string) => {
    return tab
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-12 px-4 sm:px-6">
      <div className="bg-slate-900/90 border border-rose-500/30 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-rose-950/20 backdrop-blur-xl relative overflow-hidden space-y-8">
        {/* Background Decorative Grid */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* 403 Forbidden Header Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b border-slate-800 pb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-950/80 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-900/30">
              <ShieldX className="w-9 h-9 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-rose-950 border border-rose-800/80 text-rose-300 font-mono text-[10px] font-black uppercase tracking-wider">
                  HTTP 403 Forbidden
                </span>
                <span className="text-slate-500 font-mono text-xs">• RBAC Policy Enforced</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                Access Restricted: {formatTabName(forbiddenTabId)}
              </h1>
            </div>
          </div>

          <button
            onClick={onNavigateHome}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl cursor-pointer transition-all border border-slate-700"
          >
            <ArrowLeft className="w-4 h-4 text-indigo-400" />
            Return to Dashboard
          </button>
        </div>

        {/* Active Identity Context Box */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-indigo-400" /> Current Authenticated User
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${currentUser.avatarColor || 'bg-indigo-600'} text-white font-black text-sm flex items-center justify-center shadow-md`}>
                {currentUser.firstName?.[0]}{currentUser.lastName?.[0]}
              </div>
              <div>
                <div className="font-bold text-white text-sm">{currentUser.firstName} {currentUser.lastName}</div>
                <div className="text-xs font-mono text-slate-400">{currentUser.email}</div>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Assigned Security Role:</span>
              <span className="px-2.5 py-1 bg-amber-950/80 border border-amber-800/80 text-amber-300 font-mono text-xs font-black rounded-lg">
                {currentRole}
              </span>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Lock className="w-4 h-4 text-rose-400" /> Required Security Role(s)
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              This module ({formatTabName(forbiddenTabId)}) requires one of the following privilege levels:
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {allowedRoles.map((r) => (
                <span
                  key={r}
                  className="px-2 py-1 bg-indigo-950/80 border border-indigo-800/80 text-indigo-300 font-mono text-[10px] font-bold rounded"
                >
                  {r}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Action Panel: Request Elevation or Switch Account */}
        <div className="bg-indigo-950/30 border border-indigo-900/50 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" /> Request Role Elevation or Switch Account
              </h3>
              <p className="text-xs text-slate-400">
                Need access to execute data operations? Request privilege elevation from Super Admin or log in as an authorized role.
              </p>
            </div>
            <button
              onClick={onOpenAuthModal}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl cursor-pointer transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2 whitespace-nowrap"
            >
              <KeyRound className="w-3.5 h-3.5" />
              Switch Account / Role
            </button>
          </div>

          {!requestSent ? (
            <form onSubmit={handleSendRequest} className="space-y-3 pt-2">
              <div>
                <label className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-wider block mb-1">
                  Business Justification for Elevation Request *
                </label>
                <input
                  type="text"
                  value={reasonText}
                  onChange={(e) => setReasonText(e.target.value)}
                  placeholder="e.g., Executing customer ERP schema migration under ticket #MIG-9941"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                type="submit"
                className="py-2.5 px-5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors flex items-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                Submit Role Elevation Request to Super Admin
              </button>
            </form>
          ) : (
            <div className="p-4 bg-emerald-950/80 border border-emerald-800 rounded-xl flex items-center gap-3 text-emerald-300 text-xs font-bold">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>
                Elevation request dispatched to Platform Governance Admin ({currentUser.email}). Audit Ticket #ELEV-{Date.now().toString().slice(-4)} created.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
