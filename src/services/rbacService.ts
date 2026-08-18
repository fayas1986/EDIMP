import { UserRole } from '../types';
import { UserIdentity } from '../data/mockUsers';

export type Permission =
  | 'VIEW_DASHBOARD'
  | 'VIEW_CONNECTORS'
  | 'MANAGE_CONNECTORS'
  | 'VIEW_DISCOVERY'
  | 'VIEW_DATA_DICTIONARY'
  | 'VIEW_MAPPING'
  | 'EDIT_MAPPING'
  | 'VIEW_SCHEMA_REGISTRY'
  | 'MANAGE_SCHEMA_REGISTRY'
  | 'DESIGN_WORKFLOW'
  | 'EXECUTE_MIGRATION'
  | 'ROLLBACK_MIGRATION'
  | 'VIEW_LINEAGE'
  | 'VIEW_DEPENDENCY'
  | 'VIEW_QUALITY'
  | 'CLEANSE_DATA'
  | 'ANONYMIZE_DATA'
  | 'MANAGE_EXPORTS'
  | 'VIEW_ERROR_CENTER'
  | 'RESOLVE_ERRORS'
  | 'VIEW_NOTIFICATIONS'
  | 'VIEW_BATCH_PROCESSING'
  | 'VIEW_LOAD_BALANCER'
  | 'VIEW_DECISION_LOGS'
  | 'VIEW_REALTIME_SYNC'
  | 'VIEW_PARTNER_PORTAL'
  | 'MANAGE_PARTNER_PORTAL'
  | 'VIEW_BILLING'
  | 'MANAGE_BILLING'
  | 'VIEW_LICENSE'
  | 'VIEW_CUSTOMERS'
  | 'MANAGE_CUSTOMERS'
  | 'VIEW_TENANTS'
  | 'MANAGE_TENANTS'
  | 'VIEW_USERS'
  | 'MANAGE_USERS'
  | 'VIEW_AI_ASSISTANT'
  | 'MANAGE_ADMIN_HUB'
  | 'MANAGE_SETTINGS';

export interface RoleDefinition {
  name: UserRole;
  description: string;
  category: 'Platform Super Admin' | 'Partner Governance' | 'Customer Operations' | 'Technical / Engineering' | 'Audit & Compliance' | 'Read Only';
  badgeColor: string;
  isSuperAdmin?: boolean;
  allowedPermissions: Permission[];
  allowedTabs: string[];
}

export const TAB_PERMISSIONS: Record<string, UserRole[]> = {
  'dashboard': ['Super Administrator', 'Super Admin', 'Platform Administrator', 'Partner Administrator', 'Partner Admin', 'Customer Administrator', 'Project Manager', 'Migration Consultant', 'Data Engineer', 'Functional Consultant', 'Auditor', 'Business User', 'Data Analyst', 'Read Only', 'Admin'],
  'connectors': ['Super Administrator', 'Super Admin', 'Platform Administrator', 'Partner Administrator', 'Partner Admin', 'Customer Administrator', 'Data Engineer', 'Migration Consultant'],
  'discovery': ['Super Administrator', 'Super Admin', 'Platform Administrator', 'Partner Administrator', 'Partner Admin', 'Customer Administrator', 'Migration Consultant', 'Data Engineer', 'Functional Consultant', 'Business User', 'Data Analyst'],
  'data-dictionary': ['Super Administrator', 'Super Admin', 'Platform Administrator', 'Partner Administrator', 'Partner Admin', 'Customer Administrator', 'Migration Consultant', 'Data Engineer', 'Functional Consultant', 'Business User', 'Data Analyst', 'Auditor', 'Read Only'],
  'schema-registry': ['Super Administrator', 'Super Admin', 'Platform Administrator', 'Partner Administrator', 'Partner Admin', 'Customer Administrator', 'Migration Consultant', 'Data Engineer', 'Functional Consultant', 'Business User', 'Data Analyst'],
  'mapping': ['Super Administrator', 'Super Admin', 'Platform Administrator', 'Partner Administrator', 'Partner Admin', 'Customer Administrator', 'Migration Consultant', 'Data Engineer', 'Functional Consultant', 'Data Analyst'],
  'schema-comparison': ['Super Administrator', 'Super Admin', 'Platform Administrator', 'Partner Administrator', 'Partner Admin', 'Customer Administrator', 'Migration Consultant', 'Data Engineer', 'Data Analyst'],
  'workflow-designer': ['Super Administrator', 'Super Admin', 'Platform Administrator', 'Partner Administrator', 'Partner Admin', 'Customer Administrator', 'Data Engineer', 'Migration Consultant'],
  'lineage': ['Super Administrator', 'Super Admin', 'Platform Administrator', 'Partner Administrator', 'Partner Admin', 'Customer Administrator', 'Migration Consultant', 'Data Engineer', 'Auditor', 'Data Analyst', 'Read Only'],
  'dependency-explorer': ['Super Administrator', 'Super Admin', 'Platform Administrator', 'Partner Administrator', 'Partner Admin', 'Customer Administrator', 'Migration Consultant', 'Data Engineer', 'Auditor', 'Data Analyst', 'Read Only'],
  'data-quality-audit': ['Super Administrator', 'Super Admin', 'Platform Administrator', 'Partner Administrator', 'Partner Admin', 'Customer Administrator', 'Migration Consultant', 'Data Engineer', 'Functional Consultant', 'Auditor', 'Data Analyst'],
  'validation': ['Super Administrator', 'Super Admin', 'Platform Administrator', 'Partner Administrator', 'Partner Admin', 'Customer Administrator', 'Migration Consultant', 'Data Engineer', 'Functional Consultant', 'Data Analyst'],
  'data-anonymization': ['Super Administrator', 'Super Admin', 'Platform Administrator', 'Partner Administrator', 'Partner Admin', 'Customer Administrator', 'Data Engineer', 'Migration Consultant', 'Auditor'],
  'export-management': ['Super Administrator', 'Super Admin', 'Platform Administrator', 'Partner Administrator', 'Partner Admin', 'Customer Administrator', 'Data Engineer', 'Migration Consultant', 'Project Manager'],
  'wizard': ['Super Administrator', 'Super Admin', 'Platform Administrator', 'Partner Administrator', 'Partner Admin', 'Customer Administrator', 'Data Engineer', 'Migration Consultant', 'Project Manager'],
  'simulation': ['Super Administrator', 'Super Admin', 'Platform Administrator', 'Partner Administrator', 'Partner Admin', 'Customer Administrator', 'Data Engineer', 'Migration Consultant'],
  'migration-replay': ['Super Administrator', 'Super Admin', 'Platform Administrator', 'Partner Administrator', 'Partner Admin', 'Customer Administrator', 'Data Engineer', 'Migration Consultant'],
  'error-center': ['Super Administrator', 'Super Admin', 'Platform Administrator', 'Partner Administrator', 'Partner Admin', 'Customer Administrator', 'Migration Consultant', 'Data Engineer', 'Project Manager', 'Auditor', 'Data Analyst'],
  'notifications': ['Super Administrator', 'Super Admin', 'Platform Administrator', 'Partner Administrator', 'Partner Admin', 'Customer Administrator', 'Project Manager', 'Migration Consultant', 'Data Engineer', 'Functional Consultant', 'Auditor', 'Business User', 'Data Analyst', 'Read Only'],
  'batch-processing': ['Super Administrator', 'Super Admin', 'Platform Administrator', 'Partner Administrator', 'Partner Admin', 'Customer Administrator', 'Data Engineer'],
  'global-load-balancer': ['Super Administrator', 'Super Admin', 'Platform Administrator', 'Partner Administrator', 'Partner Admin', 'Data Engineer'],
  'load-balancer-audit': ['Super Administrator', 'Super Admin', 'Platform Administrator', 'Partner Administrator', 'Partner Admin', 'Data Engineer', 'Auditor'],
  'decision-log-explorer': ['Super Administrator', 'Super Admin', 'Platform Administrator', 'Partner Administrator', 'Partner Admin', 'Customer Administrator', 'Migration Consultant', 'Data Engineer', 'Auditor'],
  'job-comparison': ['Super Administrator', 'Super Admin', 'Platform Administrator', 'Partner Administrator', 'Partner Admin', 'Customer Administrator', 'Migration Consultant', 'Data Engineer', 'Project Manager'],
  'real-time-sync': ['Super Administrator', 'Super Admin', 'Platform Administrator', 'Partner Administrator', 'Partner Admin', 'Customer Administrator', 'Data Engineer'],
  'partner-portal': ['Super Administrator', 'Super Admin', 'Platform Administrator', 'Partner Administrator', 'Partner Admin'],
  'billing-management': ['Super Administrator', 'Super Admin', 'Platform Administrator', 'Partner Administrator', 'Partner Admin'],
  'license-compliance': ['Super Administrator', 'Super Admin', 'Platform Administrator', 'Partner Administrator', 'Partner Admin', 'Auditor'],
  'customer-projects': ['Super Administrator', 'Super Admin', 'Platform Administrator', 'Partner Administrator', 'Partner Admin', 'Customer Administrator', 'Project Manager'],
  'tenant-management': ['Super Administrator', 'Super Admin', 'Platform Administrator', 'Partner Administrator', 'Partner Admin'],
  'user-management': ['Super Administrator', 'Super Admin', 'Platform Administrator', 'Partner Administrator', 'Partner Admin', 'Customer Administrator'],
  'ai-assistant': ['Super Administrator', 'Super Admin', 'Platform Administrator', 'Partner Administrator', 'Partner Admin', 'Customer Administrator', 'Migration Consultant', 'Data Engineer', 'Functional Consultant', 'Project Manager', 'Business User', 'Data Analyst'],
  'connector-sdk': ['Super Administrator', 'Super Admin', 'Platform Administrator', 'Data Engineer'],
  'rest-api-platform': ['Super Administrator', 'Super Admin', 'Platform Administrator', 'Data Engineer'],
  'settings': ['Super Administrator', 'Super Admin', 'Platform Administrator', 'Partner Administrator', 'Partner Admin', 'Customer Administrator'],
  'admin-hub': ['Super Administrator', 'Super Admin', 'Platform Administrator', 'Partner Administrator', 'Partner Admin', 'Customer Administrator'],
  'audit': ['Super Administrator', 'Super Admin', 'Platform Administrator', 'Partner Administrator', 'Partner Admin', 'Customer Administrator', 'Auditor', 'Project Manager'],
  'audit-reporting': ['Super Administrator', 'Super Admin', 'Platform Administrator', 'Partner Administrator', 'Partner Admin', 'Customer Administrator', 'Auditor', 'Project Manager', 'Data Analyst'],
  'compliance-dashboard': ['Super Administrator', 'Super Admin', 'Platform Administrator', 'Partner Administrator', 'Partner Admin', 'Customer Administrator', 'Auditor'],
  'system-health': ['Super Administrator', 'Super Admin', 'Platform Administrator', 'Partner Administrator', 'Partner Admin', 'Data Engineer'],
  'resource-allocation': ['Super Administrator', 'Super Admin', 'Platform Administrator', 'Partner Administrator', 'Partner Admin', 'Data Engineer', 'Project Manager'],
  'connection-health': ['Super Administrator', 'Super Admin', 'Platform Administrator', 'Partner Administrator', 'Partner Admin', 'Customer Administrator', 'Data Engineer', 'Migration Consultant'],
};

/**
 * Check if a role is permitted to access a specific tab/module
 */
export function isRoleAllowedForTab(tabId: string, role: UserRole): boolean {
  if (
    role === 'Super Administrator' ||
    role === 'Super Admin' ||
    role === 'Platform Administrator' ||
    role === 'Admin'
  ) {
    return true;
  }

  const allowedRoles = TAB_PERMISSIONS[tabId];
  if (!allowedRoles) return true; // Default fallback to open if tab not explicitly mapped

  return allowedRoles.includes(role);
}

/**
 * Check if user possesses mutating write permission for specific component actions
 */
export function hasActionPermission(user: UserIdentity | undefined, action: 'CREATE' | 'EDIT' | 'DELETE' | 'EXECUTE' | 'ADMIN' | 'BILLING'): boolean {
  if (!user) return false;
  const role = user.role;

  if (
    role === 'Super Administrator' ||
    role === 'Super Admin' ||
    role === 'Platform Administrator' ||
    role === 'Admin'
  ) {
    return true;
  }

  if (role === 'Read Only') {
    return false;
  }

  switch (action) {
    case 'ADMIN':
      return ['Partner Administrator', 'Partner Admin', 'Customer Administrator'].includes(role);
    case 'BILLING':
      return ['Partner Administrator', 'Partner Admin'].includes(role);
    case 'DELETE':
      return ['Partner Administrator', 'Partner Admin', 'Customer Administrator', 'Data Engineer'].includes(role);
    case 'CREATE':
    case 'EDIT':
      return !['Auditor', 'Business User', 'Read Only'].includes(role);
    case 'EXECUTE':
      return ['Partner Administrator', 'Customer Administrator', 'Migration Consultant', 'Data Engineer', 'Project Manager'].includes(role);
    default:
      return true;
  }
}
