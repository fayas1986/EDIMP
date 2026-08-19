import React from 'react';
import { Wifi, Lock, GitMerge, Database, HardDrive, CheckCircle2 } from 'lucide-react';
import { ErrorCategory, ErrorLog } from '../../types';

export const CATEGORY_CONFIG: Record<
  ErrorCategory,
  {
    label: ErrorCategory;
    icon: React.FC<{ className?: string }>;
    badgeClass: string;
    description: string;
  }
> = {
  Network: {
    label: 'Network',
    icon: Wifi,
    badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-100 shadow-2xs',
    description: 'API timeouts, rate limits (429), gateway connectivity failures',
  },
  Auth: {
    label: 'Auth',
    icon: Lock,
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-100 shadow-2xs',
    description: 'Expired tokens, 401/403 credentials, missing scopes/permissions',
  },
  'Data Mapping': {
    label: 'Data Mapping',
    icon: GitMerge,
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-100 shadow-2xs',
    description: 'Unmapped lookup keys, foreign key misses, enum transformation errors',
  },
  Schema: {
    label: 'Schema',
    icon: Database,
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-100 shadow-2xs',
    description: 'Data type mismatches, max length overflows, missing required fields',
  },
  Database: {
    label: 'Database',
    icon: HardDrive,
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-100 shadow-2xs',
    description: 'Table lock timeouts, deadlocks, primary key constraint violations',
  },
  Validation: {
    label: 'Validation',
    icon: CheckCircle2,
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-100 shadow-2xs',
    description: 'Format regex failures (email, tax ID), string trimming warnings',
  },
};

export const getErrorCategory = (err: Partial<ErrorLog>): ErrorCategory => {
  if (err.category) return err.category;
  const code = (err.errorCode || '').toUpperCase();
  const field = (err.fieldName || '').toUpperCase();
  const msg = (err.errorMessage || '').toUpperCase();

  if (
    code.includes('NET') || code.includes('HTTP') || code.includes('503') || code.includes('504') ||
    code.includes('CONNECT') || code.includes('RATE') || msg.includes('NETWORK') || msg.includes('GATEWAY')
  ) {
    return 'Network';
  }
  if (
    code.includes('AUTH') || code.includes('401') || code.includes('403') ||
    code.includes('TOKEN') || code.includes('CREDENTIAL') || code.includes('PERM') ||
    msg.includes('UNAUTHORIZED') || msg.includes('FORBIDDEN') || msg.includes('CREDENTIAL')
  ) {
    return 'Auth';
  }
  if (
    code.includes('FK') || code.includes('MAP') || code.includes('LOOKUP') ||
    code.includes('TRANSFORM') || code.includes('CONVERT') || code.includes('UNMAPPED') ||
    msg.includes('FOREIGN KEY') || msg.includes('LOOKUP')
  ) {
    return 'Data Mapping';
  }
  if (
    code.includes('SCHEMA') || code.includes('NULL') || code.includes('TYPE') ||
    code.includes('LENGTH') || msg.includes('SCHEMA') || msg.includes('REQUIRED')
  ) {
    return 'Schema';
  }
  if (
    code.includes('DB') || code.includes('SQL') || code.includes('LOCK') ||
    code.includes('DEADLOCK') || code.includes('CONSTRAINT') || code.includes('DUPLICATE') ||
    msg.includes('POSTGRES') || msg.includes('DEADLOCK') || msg.includes('LOCK')
  ) {
    return 'Database';
  }
  return 'Validation';
};
