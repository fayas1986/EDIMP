import React from 'react';
import { AlertCircle, CheckCircle2, EyeOff } from 'lucide-react';
import { ErrorCategory } from '../../types';
import { CATEGORY_CONFIG } from './CategoryConfig';

export const CategoryBadge: React.FC<{ category: ErrorCategory; size?: 'sm' | 'md' }> = ({ category, size = 'sm' }) => {
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.Validation;
  const IconComp = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono font-bold border rounded-md transition-all shrink-0 ${config.badgeClass} ${
        size === 'md' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-[10px]'
      }`}
      title={`Category: ${config.label} — ${config.description}`}
    >
      <IconComp className={size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3'} />
      <span>{config.label}</span>
    </span>
  );
};

export const StatusBadge: React.FC<{
  status: 'Open' | 'Unresolved' | 'Resolved' | 'Ignored' | string;
  onClick?: () => void;
  size?: 'sm' | 'md';
  interactive?: boolean;
}> = ({ status, onClick, size = 'sm', interactive = true }) => {
  const isResolved = status === 'Resolved';
  const isIgnored = status === 'Ignored';

  let badgeClass = '';
  let Icon = AlertCircle;
  let label = 'Open';

  if (isResolved) {
    badgeClass = 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-700';
    Icon = CheckCircle2;
    label = 'Resolved';
  } else if (isIgnored) {
    badgeClass = 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-600';
    Icon = EyeOff;
    label = 'Ignored';
  } else {
    badgeClass = 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 hover:text-amber-700 shadow-2xs';
    Icon = AlertCircle;
    label = 'Open';
  }

  const sizeClass = size === 'md' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-[10px]';

  return (
    <button
      type="button"
      disabled={!interactive || !onClick}
      onClick={(e) => {
        if (interactive && onClick) {
          e.stopPropagation();
          onClick();
        }
      }}
      className={`inline-flex items-center gap-1 font-mono font-bold rounded-full border transition-all ${sizeClass} ${badgeClass} ${
        interactive && onClick ? 'cursor-pointer hover:scale-105 active:scale-95 shadow-2xs' : 'cursor-default'
      }`}
      title={interactive && onClick ? `Click to toggle status (Current: ${label})` : `Status: ${label}`}
    >
      <Icon className={size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3'} />
      <span>{label}</span>
    </button>
  );
};
