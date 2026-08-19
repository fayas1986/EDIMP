import React, { useState } from "react";
import {
  Shield,
  UserPlus,
  Users,
  KeyRound,
  Lock,
  Search,
  Filter,
  Check,
  X,
  Mail,
  Globe,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Edit3,
  UserCheck,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Plus,
  ArrowRight,
  Info,
  ShieldAlert,
  Terminal,
  Database,
  Fingerprint,
  FileCheck2,
  Clock,
  Briefcase,
  Sliders,
  Sparkles,
  Activity,
  User,
  PlayCircle,
  Hourglass,
  Timer,
  Calendar,
  AlertTriangle,
  ShieldCheck,
  Share2,
  Send,
} from "lucide-react";
import { OverflowTableWrapper } from "./OverflowTableWrapper";

import { RoleOrgChart } from "./RoleOrgChart";
import { menuGroups, isRoleAllowed } from './Sidebar';
import { UserRole } from '../types';


export type ExtendedRole =
  | "Super Administrator"
  | "Platform Administrator"
  | "Partner Administrator"
  | "Customer Administrator"
  | "Project Manager"
  | "Migration Consultant"
  | "Data Engineer"
  | "Functional Consultant"
  | "Auditor"
  | "Business User"
  | "Read Only";

export type ExpirationPreset = "6h" | "1d" | "1w" | "1m" | "custom" | "permanent";

export interface UserItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: ExtendedRole;
  status: "Active" | "Inactive" | "Pending" | "Expired";
  ssoEnabled: boolean;
  mfaEnforced: boolean;
  lastLogin: string;
  createdDate: string;
  isCompliant: boolean;
  isTemporary?: boolean;
  expirationPreset?: ExpirationPreset;
  expiresAt?: string; // ISO String timestamp e.g. "2026-08-16T13:16:29.000Z"
  autoDisableOnExpire?: boolean;
  username?: string;
  tempPassword?: string;
}

export function generateSystemUsername(firstName: string, lastName: string, email: string): string {
  if (firstName && lastName) {
    const cleanFirst = firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanLast = lastName.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cleanFirst && cleanLast) {
      return `${cleanFirst}.${cleanLast}`;
    }
  }
  if (email && email.includes('@')) {
    const handle = email.split('@')[0].toLowerCase().replace(/[^a-z0-9.]/g, '');
    if (handle) return handle;
  }
  return `usr_${Math.floor(1000 + Math.random() * 9000)}`;
}

export function generateSecurePassword(): string {
  const charsUpper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const charsLower = "abcdefghijkmnpqrstuvwxyz";
  const charsNum = "23456789";
  const charsSpec = "!@#$%^&*";

  const getRandomChar = (str: string) => str[Math.floor(Math.random() * str.length)];

  let pwd = [
    getRandomChar(charsUpper),
    getRandomChar(charsUpper),
    getRandomChar(charsLower),
    getRandomChar(charsLower),
    getRandomChar(charsNum),
    getRandomChar(charsNum),
    getRandomChar(charsSpec),
    getRandomChar(charsSpec),
  ];

  const allChars = charsUpper + charsLower + charsNum + charsSpec;
  for (let i = 0; i < 6; i++) {
    pwd.push(getRandomChar(allChars));
  }

  return pwd.sort(() => 0.5 - Math.random()).join('');
}

export function calculateExpiresAt(preset: ExpirationPreset, customDays: number = 1): string | undefined {
  if (preset === "permanent") return undefined;
  const now = new Date();
  if (preset === "6h") {
    now.setHours(now.getHours() + 6);
  } else if (preset === "1d") {
    now.setDate(now.getDate() + 1);
  } else if (preset === "1w") {
    now.setDate(now.getDate() + 7);
  } else if (preset === "1m") {
    now.setMonth(now.getMonth() + 1);
  } else if (preset === "custom") {
    now.setDate(now.getDate() + Math.max(1, customDays));
  }
  return now.toISOString();
}

export function formatExpirationDetails(expiresAt?: string): {
  text: string;
  isExpired: boolean;
  statusBadge: string;
  badgeBg: string;
  fullFormatted: string;
} {
  if (!expiresAt) {
    return {
      text: "Permanent Access",
      isExpired: false,
      statusBadge: "Permanent",
      badgeBg: "bg-slate-100 text-slate-600 border-slate-200",
      fullFormatted: "No Expiration Date Set",
    };
  }

  const targetDate = new Date(expiresAt);
  const targetMs = targetDate.getTime();
  const nowMs = Date.now();
  const diffMs = targetMs - nowMs;

  const dateOptions: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  };
  const fullFormatted = targetDate.toLocaleString("en-US", dateOptions);

  if (diffMs <= 0) {
    return {
      text: "Expired",
      isExpired: true,
      statusBadge: "Expired",
      badgeBg: "bg-rose-50 text-rose-700 border-rose-200",
      fullFormatted: `Expired on ${fullFormatted}`,
    };
  }

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);
  const remainingHours = totalHours % 24;
  const remainingMins = totalMinutes % 60;

  if (days >= 1) {
    return {
      text: `Expires in ${days}d ${remainingHours}h`,
      isExpired: false,
      statusBadge: `Temp (${days}d ${remainingHours}h)`,
      badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
      fullFormatted: `Expires on ${fullFormatted}`,
    };
  } else if (totalHours >= 1) {
    return {
      text: `Expires in ${totalHours}h ${remainingMins}m`,
      isExpired: false,
      statusBadge: `Temp (${totalHours}h ${remainingMins}m)`,
      badgeBg: "bg-amber-50 text-amber-700 border-amber-200 font-bold",
      fullFormatted: `Expires on ${fullFormatted}`,
    };
  } else {
    return {
      text: `Expires in ${remainingMins}m`,
      isExpired: false,
      statusBadge: `Temp (${remainingMins}m left)`,
      badgeBg: "bg-rose-50 text-rose-700 border-rose-200 font-bold animate-pulse",
      fullFormatted: `Expires on ${fullFormatted}`,
    };
  }
}

export function getUserEffectiveStatus(user: UserItem): "Active" | "Inactive" | "Pending" | "Expired" {
  if (user.isTemporary && user.expiresAt) {
    if (new Date(user.expiresAt).getTime() <= Date.now()) {
      return "Expired";
    }
  }
  return user.status;
}

// Initial Mock Users (13 total, including temporary accounts)
const INITIAL_USERS: UserItem[] = [
  {
    id: "usr-101",
    firstName: "Sarah",
    lastName: "Jenkins",
    email: "sarah.jenkins@enterprise.com",
    role: "Super Administrator",
    status: "Active",
    ssoEnabled: true,
    mfaEnforced: false,
    lastLogin: "2026-08-07 09:12 UTC",
    createdDate: "2026-01-15",
    isCompliant: true,
  },
  {
    id: "usr-102",
    firstName: "David",
    lastName: "Vance",
    email: "david.vance@platform.io",
    role: "Platform Administrator",
    status: "Active",
    ssoEnabled: true,
    mfaEnforced: false,
    lastLogin: "2026-08-07 08:34 UTC",
    createdDate: "2026-02-10",
    isCompliant: true,
  },
  {
    id: "usr-103",
    firstName: "Elena",
    lastName: "Rostova",
    email: "elena.rostova@partner.net",
    role: "Partner Administrator",
    status: "Active",
    ssoEnabled: true,
    mfaEnforced: false,
    lastLogin: "2026-08-06 17:42 UTC",
    createdDate: "2026-03-05",
    isCompliant: true,
  },
  {
    id: "usr-104",
    firstName: "Marcus",
    lastName: "Aurelius",
    email: "marcus@acme-corp.com",
    role: "Customer Administrator",
    status: "Active",
    ssoEnabled: false,
    mfaEnforced: false,
    lastLogin: "2026-08-07 05:11 UTC",
    createdDate: "2026-04-12",
    isCompliant: true,
  },
  {
    id: "usr-105",
    firstName: "Frank",
    lastName: "Miller",
    email: "frank.m@globex.org",
    role: "Project Manager",
    status: "Active",
    ssoEnabled: false,
    mfaEnforced: false,
    lastLogin: "2026-08-05 11:23 UTC",
    createdDate: "2026-05-01",
    isCompliant: true,
  },
  {
    id: "usr-106",
    firstName: "Alice",
    lastName: "Cooper",
    email: "alice.cooper@initech.com",
    role: "Migration Consultant",
    status: "Pending",
    ssoEnabled: false,
    mfaEnforced: false,
    lastLogin: "Never (Invited)",
    createdDate: "2026-08-06",
    isCompliant: true,
  },
  {
    id: "usr-107",
    firstName: "Bob",
    lastName: "Ross",
    email: "bob.ross@weyland-yutani.co",
    role: "Data Engineer",
    status: "Active",
    ssoEnabled: true,
    mfaEnforced: false,
    lastLogin: "2026-08-07 09:44 UTC",
    createdDate: "2026-05-20",
    isCompliant: true,
  },
  {
    id: "usr-108",
    firstName: "Clara",
    lastName: "Oswald",
    email: "clara.oswald@enterprise.com",
    role: "Functional Consultant",
    status: "Active",
    ssoEnabled: true,
    mfaEnforced: false,
    lastLogin: "2026-08-03 14:02 UTC",
    createdDate: "2026-06-02",
    isCompliant: true,
  },
  {
    id: "usr-109",
    firstName: "Arthur",
    lastName: "Dent",
    email: "arthur.dent@galaxy-auditors.org",
    role: "Auditor",
    status: "Active",
    ssoEnabled: false,
    mfaEnforced: false,
    lastLogin: "2026-08-07 01:15 UTC",
    createdDate: "2026-06-18",
    isCompliant: true,
  },
  {
    id: "usr-110",
    firstName: "Ford",
    lastName: "Prefect",
    email: "ford.prefect@hitchhiker.net",
    role: "Business User",
    status: "Inactive",
    ssoEnabled: false,
    mfaEnforced: false,
    lastLogin: "2026-07-20 18:30 UTC",
    createdDate: "2026-03-30",
    isCompliant: true,
  },
  {
    id: "usr-111",
    firstName: "Tricia",
    lastName: "McMillan",
    email: "trillian@galaxy-co.org",
    role: "Read Only",
    status: "Active",
    ssoEnabled: false,
    mfaEnforced: false,
    lastLogin: "2026-08-07 03:45 UTC",
    createdDate: "2026-07-01",
    isCompliant: true,
  },
  {
    id: "usr-112",
    firstName: "Michael",
    lastName: "Vance (Auditor Contractor)",
    email: "michael.vance@external-auditors.org",
    role: "Auditor",
    status: "Active",
    ssoEnabled: false,
    mfaEnforced: false,
    lastLogin: "2026-08-16 06:12 UTC",
    createdDate: "2026-08-16",
    isCompliant: true,
    isTemporary: true,
    expirationPreset: "6h",
    expiresAt: new Date(Date.now() + 5.5 * 3600 * 1000).toISOString(), // ~5.5 hours remaining
    autoDisableOnExpire: true,
  },
  {
    id: "usr-113",
    firstName: "Siddharth",
    lastName: "Roy (Vendor)",
    email: "siddharth.roy@vendor-consulting.co",
    role: "Functional Consultant",
    status: "Expired",
    ssoEnabled: false,
    mfaEnforced: false,
    lastLogin: "2026-08-15 14:20 UTC",
    createdDate: "2026-08-14",
    isCompliant: false,
    isTemporary: true,
    expirationPreset: "1d",
    expiresAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), // Expired 2 hours ago
    autoDisableOnExpire: true,
  },
];

// 10 Permission Rows
const PERMISSIONS = [
  "Create Migration",
  "Execute Migration",
  "Stop Migration",
  "View Reports",
  "Export Reports",
  "Manage Connectors",
  "Manage Pipelines",
  "Manage AI Models",
  "Approve Migration",
  "Delete Projects",
];

// Initial default permission matrix setup for each of the 11 roles
const INITIAL_PERMISSION_MATRIX: Record<
  ExtendedRole,
  Record<string, boolean>
> = {
  "Super Administrator": {
    "Create Migration": true,
    "Execute Migration": true,
    "Stop Migration": true,
    "View Reports": true,
    "Export Reports": true,
    "Manage Connectors": true,
    "Manage Pipelines": true,
    "Manage AI Models": true,
    "Approve Migration": true,
    "Delete Projects": true,
  },
  "Platform Administrator": {
    "Create Migration": true,
    "Execute Migration": true,
    "Stop Migration": true,
    "View Reports": true,
    "Export Reports": true,
    "Manage Connectors": true,
    "Manage Pipelines": true,
    "Manage AI Models": true,
    "Approve Migration": true,
    "Delete Projects": false,
  },
  "Partner Administrator": {
    "Create Migration": true,
    "Execute Migration": true,
    "Stop Migration": true,
    "View Reports": true,
    "Export Reports": true,
    "Manage Connectors": true,
    "Manage Pipelines": true,
    "Manage AI Models": true,
    "Approve Migration": true,
    "Delete Projects": false,
  },
  "Customer Administrator": {
    "Create Migration": true,
    "Execute Migration": true,
    "Stop Migration": true,
    "View Reports": true,
    "Export Reports": true,
    "Manage Connectors": true,
    "Manage Pipelines": true,
    "Manage AI Models": false,
    "Approve Migration": true,
    "Delete Projects": false,
  },
  "Project Manager": {
    "Create Migration": true,
    "Execute Migration": false,
    "Stop Migration": true,
    "View Reports": true,
    "Export Reports": true,
    "Manage Connectors": false,
    "Manage Pipelines": true,
    "Manage AI Models": false,
    "Approve Migration": true,
    "Delete Projects": false,
  },
  "Migration Consultant": {
    "Create Migration": true,
    "Execute Migration": true,
    "Stop Migration": true,
    "View Reports": true,
    "Export Reports": true,
    "Manage Connectors": true,
    "Manage Pipelines": true,
    "Manage AI Models": false,
    "Approve Migration": false,
    "Delete Projects": false,
  },
  "Data Engineer": {
    "Create Migration": true,
    "Execute Migration": true,
    "Stop Migration": true,
    "View Reports": true,
    "Export Reports": true,
    "Manage Connectors": true,
    "Manage Pipelines": true,
    "Manage AI Models": true,
    "Approve Migration": false,
    "Delete Projects": false,
  },
  "Functional Consultant": {
    "Create Migration": true,
    "Execute Migration": false,
    "Stop Migration": false,
    "View Reports": true,
    "Export Reports": true,
    "Manage Connectors": false,
    "Manage Pipelines": true,
    "Manage AI Models": false,
    "Approve Migration": false,
    "Delete Projects": false,
  },
  Auditor: {
    "Create Migration": false,
    "Execute Migration": false,
    "Stop Migration": false,
    "View Reports": true,
    "Export Reports": true,
    "Manage Connectors": false,
    "Manage Pipelines": false,
    "Manage AI Models": false,
    "Approve Migration": false,
    "Delete Projects": false,
  },
  "Business User": {
    "Create Migration": false,
    "Execute Migration": false,
    "Stop Migration": false,
    "View Reports": true,
    "Export Reports": false,
    "Manage Connectors": false,
    "Manage Pipelines": false,
    "Manage AI Models": false,
    "Approve Migration": false,
    "Delete Projects": false,
  },
  "Read Only": {
    "Create Migration": false,
    "Execute Migration": false,
    "Stop Migration": false,
    "View Reports": true,
    "Export Reports": false,
    "Manage Connectors": false,
    "Manage Pipelines": false,
    "Manage AI Models": false,
    "Approve Migration": false,
    "Delete Projects": false,
  },
};

// Roles description metadata
const ROLE_DESCRIPTIONS: Record<
  ExtendedRole,
  { desc: string; scope: string; level: string; color: string }
> = {
  "Super Administrator": {
    desc: "Unrestricted administrative access to the entire multi-tenant system. Can manage cross-tenant settings, billing configurations, and system-wide resources.",
    scope: "System-wide / Cross-Tenant",
    level: "L5 Global Scope",
    color: "from-purple-600 to-indigo-700",
  },
  "Platform Administrator": {
    desc: "Configures cloud clusters, migration pipelines, and connector libraries. Focuses on overall hardware scaling, container limits, and data ingestion services.",
    scope: "Platform / Infrastructure",
    level: "L4 Operations Scope",
    color: "from-blue-600 to-indigo-600",
  },
  "Partner Administrator": {
    desc: "Manages user accounts, projects, and custom mapping definitions across assigned client tenants. Represents the implementation or consulting partner.",
    scope: "Partner Organization",
    level: "L4 Partner Scope",
    color: "from-indigo-600 to-sky-600",
  },
  "Customer Administrator": {
    desc: "Controls configuration and localized user assignments for a single specific customer organization workspace.",
    scope: "Single Client Tenant",
    level: "L3 Customer Scope",
    color: "from-emerald-600 to-teal-600",
  },
  "Project Manager": {
    desc: "Oversees migration schedules, coordinates approvals, reads progress reports, and ensures milestones are met without modifying database topologies directly.",
    scope: "Migration Project Scope",
    level: "L3 Coordination Scope",
    color: "from-amber-600 to-orange-600",
  },
  "Migration Consultant": {
    desc: "Bridges target system configurations and mapping dictionaries. Designs custom workflow structures, resolves data quality validation flags, and maps fields.",
    scope: "Functional & Design",
    level: "L2 Consultant Scope",
    color: "from-cyan-600 to-blue-600",
  },
  "Data Engineer": {
    desc: "Writes and optimizes transformation scripts, cleanses records, configures pipeline throughput throttling, and maps raw storage endpoints.",
    scope: "Technical Pipeline & DBs",
    level: "L2 Engineering Scope",
    color: "from-red-600 to-pink-600",
  },
  "Functional Consultant": {
    desc: "Configures business rules, general ledger codes, and validation limits. Translates business guidelines into system mapping triggers.",
    scope: "Business Rules Scope",
    level: "L2 Advisory Scope",
    color: "from-sky-600 to-teal-600",
  },
  Auditor: {
    desc: "Independent read-only verification of pipeline logs, SOC2 checksum audit feeds, historical runs, database write approvals, and HIPAA records.",
    scope: "Compliance & Logs Only",
    level: "L2 Audit Scope",
    color: "from-slate-600 to-slate-800",
  },
  "Business User": {
    desc: "Monitors client dashboards, submits ad-hoc queries, downloads spreadsheet analytics reports, and logs feedback inside project runs.",
    scope: "Enterprise Analytics",
    level: "L1 Interactive Scope",
    color: "from-slate-500 to-zinc-600",
  },
  "Read Only": {
    desc: "Restricted to basic view-only permissions on active migration metrics, and dashboard charts. No capability to execute or download.",
    scope: "Dashboard View-Only",
    level: "L1 Restricted Scope",
    color: "from-slate-400 to-slate-500",
  },
};

export interface AccessChangeLog {
  id: string;
  timestamp: string;
  adminIdentity: string;
  action: string;
  targetUser: string;
  details: string;
}

export const UserRoleManagementView: React.FC<{ currentUser?: any }> = ({ currentUser }) => {
  const [activeSubTab, setActiveSubTab] = useState<
    "users" | "permissions" | "sso" | "orgchart" | "simulation"
  >("users");
  const [users, setUsers] = useState<UserItem[]>(INITIAL_USERS);
  const [searchQuery, setSearchQuery] = useState("");
  const availableRoles = Object.keys(ROLE_DESCRIPTIONS).filter(r => r !== 'Super Administrator' || currentUser?.role === 'Super Administrator');
  const [roleFilter, setRoleFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // Change Log State
  const [accessLogs, setAccessLogs] = useState<AccessChangeLog[]>([]);

  // Permission matrix state
  const [permissionMatrix, setPermissionMatrix] = useState<
    Record<ExtendedRole, Record<string, boolean>>
  >(INITIAL_PERMISSION_MATRIX);
  const [selectedRoleForMatrix, setSelectedRoleForMatrix] =
    useState<ExtendedRole>("Super Administrator");
  const [simulatedRole, setSimulatedRole] =
    useState<ExtendedRole>("Data Engineer");
  const [isImpactModalOpen, setIsImpactModalOpen] = useState(false);

  // SSO and Security Policies State
  const [passwordMinLength, setPasswordMinLength] = useState<number>(14);
  const [requireNumbers, setRequireNumbers] = useState<boolean>(true);
  const [requireSpecial, setRequireSpecial] = useState<boolean>(true);
  const [requireUppercase, setRequireUppercase] = useState<boolean>(true);
  const [passwordExpiryDays, setPasswordExpiryDays] = useState<number>(90);
  const [mfaEnforcedGlobal, setMfaEnforcedGlobal] = useState<boolean>(false);

  const [ssoEnabled, setSsoEnabled] = useState<boolean>(true);
  const [ssoProvider, setSsoProvider] = useState<string>("EntraID");
  const [ssoIssuerUrl, setSsoIssuerUrl] = useState<string>(
    "https://sts.windows.net/3b2cd2ef-8899-4d6d-98e3/",
  );
  const [ssoTargetUrl, setSsoTargetUrl] = useState<string>(
    "https://login.microsoftonline.com/3b2cd2ef/saml2",
  );
  const [ssoDomainLockdown, setSsoDomainLockdown] = useState<string>(
    "enterprise.com, platform.io, partner.net",
  );
  const [isSsoSaved, setIsSsoSaved] = useState<boolean>(false);

  const [ssoAttributeMappings, setSsoAttributeMappings] = useState<
    { claimName: string; claimValue: string; internalRole: ExtendedRole }[]
  >([
    {
      claimName: "groups",
      claimValue: "EDIMP_Admins_Global",
      internalRole: "Super Administrator",
    },
    {
      claimName: "department",
      claimValue: "Data Engineering",
      internalRole: "Data Engineer",
    },
  ]);
  const [newMappingClaimName, setNewMappingClaimName] =
    useState<string>("groups");
  const [newMappingClaimValue, setNewMappingClaimValue] = useState<string>("");
  const [newMappingRole, setNewMappingRole] =
    useState<ExtendedRole>("Business User");

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [userToExtend, setUserToExtend] = useState<UserItem | null>(null);

  // Create user form state
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<ExtendedRole>("Data Engineer");
  const [newMfa, setNewMfa] = useState(false);
  const [newSso, setNewSso] = useState(false);
  // Temporary account creation parameters
  const [newIsTemporary, setNewIsTemporary] = useState(true);
  const [newExpirationPreset, setNewExpirationPreset] = useState<ExpirationPreset>("6h");
  const [newCustomDays, setNewCustomDays] = useState(1);
  const [newAutoDisableOnExpire, setNewAutoDisableOnExpire] = useState(true);

  // Extend expiration form state
  const [extendPreset, setExtendPreset] = useState<ExpirationPreset>("1d");
  const [extendCustomDays, setExtendCustomDays] = useState(1);

  // Invite user form state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<ExtendedRole>("Project Manager");
  const [inviteExpiry, setInviteExpiry] = useState<string>("7 days");
  const [inviteMessage, setInviteMessage] = useState(
    "Welcome to the enterprise migration portal. Click below to register.",
  );
  const [latestInvitationLink, setLatestInvitationLink] = useState<
    string | null
  >(null);

  // Edit user form state
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<ExtendedRole>("Data Engineer");
  const [editStatus, setEditStatus] = useState<
    "Active" | "Inactive" | "Pending" | "Expired"
  >("Active");
  const [editMfa, setEditMfa] = useState(true);
  const [editSso, setEditSso] = useState(true);
  const [editIsTemporary, setEditIsTemporary] = useState(false);
  const [editExpirationPreset, setEditExpirationPreset] = useState<ExpirationPreset>("1d");
  const [editCustomDays, setEditCustomDays] = useState(1);
  const [editAutoDisableOnExpire, setEditAutoDisableOnExpire] = useState(true);

  // Generated Credentials & Sharing Modal State
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  const [selectedCredentialsUser, setSelectedCredentialsUser] = useState<UserItem | null>(null);
  const [credentialsUsername, setCredentialsUsername] = useState("");
  const [credentialsPassword, setCredentialsPassword] = useState("");
  const [showPasswordInModal, setShowPasswordInModal] = useState(false);
  const [copiedCredentials, setCopiedCredentials] = useState(false);

  // New user credentials form preview state
  const [newUsername, setNewUsername] = useState("");
  const [newTempPassword, setNewTempPassword] = useState("");

  // UI notifications
  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "info" | "warning";
    text: string;
  } | null>(null);

  const showToast = (
    text: string,
    type: "success" | "info" | "warning" = "success",
  ) => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const logAccessChange = (
    action: string,
    targetUser: string,
    details: string,
  ) => {
    const newLog: AccessChangeLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      adminIdentity: "fayasamd@gmail.com (Super Admin)",
      action,
      targetUser,
      details,
    };
    setAccessLogs((prev) => [newLog, ...prev]);
  };

  // Open Credentials Modal
  const openCredentialsModal = (user: UserItem) => {
    setSelectedCredentialsUser(user);
    const uName = user.username || generateSystemUsername(user.firstName, user.lastName, user.email);
    const uPwd = user.tempPassword || generateSecurePassword();
    setCredentialsUsername(uName);
    setCredentialsPassword(uPwd);
    setShowPasswordInModal(false);
    setCopiedCredentials(false);
    setIsCredentialsModalOpen(true);
  };

  // Regenerate Password in Credentials Modal
  const handleRegeneratePasswordInModal = () => {
    if (!selectedCredentialsUser) return;
    const newPwd = generateSecurePassword();
    setCredentialsPassword(newPwd);
    setCopiedCredentials(false);

    setUsers((prev) =>
      prev.map((u) =>
        u.id === selectedCredentialsUser.id
          ? { ...u, username: credentialsUsername, tempPassword: newPwd }
          : u
      )
    );
    logAccessChange(
      "Regenerated Password",
      selectedCredentialsUser.email,
      `Generated new security credentials for username @${credentialsUsername}`
    );
    showToast(`Generated new secure password for @${credentialsUsername}.`);
  };

  // Copy Full Credentials Summary Payload
  const handleCopyCredentialsPayload = () => {
    if (!selectedCredentialsUser) return;

    const expText = selectedCredentialsUser.isTemporary && selectedCredentialsUser.expiresAt
      ? formatExpirationDetails(selectedCredentialsUser.expiresAt).fullFormatted
      : "Permanent Access";

    const payload = `==================================================
ENTERPRISE MIGRATION STUDIO - USER ACCESS CREDENTIALS
==================================================
User: ${selectedCredentialsUser.firstName} ${selectedCredentialsUser.lastName}
Corporate Email: ${selectedCredentialsUser.email}
System Username: ${credentialsUsername}
Temporary Password: ${credentialsPassword}
Security Role: ${selectedCredentialsUser.role}
Access Duration: ${expText}
Portal Login URL: ${window.location.origin || 'https://ais-pre-7qswlcoicd6wixwwrjtf25-82286736551.europe-west3.run.app'}
==================================================
Instruction: Please log in using the assigned username/password and update your password upon initial sign-in.`;

    navigator.clipboard.writeText(payload);
    setCopiedCredentials(true);
    showToast(`Credentials payload for ${selectedCredentialsUser.firstName} copied to clipboard! Ready to share.`);
    setTimeout(() => setCopiedCredentials(false), 3000);
  };

  // Simulate Send Onboarding Email with Credentials
  const handleSimulateSendEmail = () => {
    if (!selectedCredentialsUser) return;
    logAccessChange(
      "Dispatched Credentials Email",
      selectedCredentialsUser.email,
      `Sent encrypted onboarding notification containing username @${credentialsUsername}`
    );
    showToast(`Encrypted onboarding login details dispatched to ${selectedCredentialsUser.email}.`);
  };

  // Create User Handler
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirstName || !newLastName || !newEmail) {
      showToast("Please fill out all required fields.", "warning");
      return;
    }

    const calculatedExpiresAt = newIsTemporary
      ? calculateExpiresAt(newExpirationPreset, newCustomDays)
      : undefined;

    const generatedUsername = newUsername || generateSystemUsername(newFirstName, newLastName, newEmail);
    const generatedPassword = newTempPassword || generateSecurePassword();

    const created: UserItem = {
      id: `usr-${Date.now().toString().slice(-3)}`,
      firstName: newFirstName,
      lastName: newLastName,
      email: newEmail,
      username: generatedUsername,
      tempPassword: generatedPassword,
      role: newRole,
      status: "Active",
      ssoEnabled: newSso,
      mfaEnforced: newMfa,
      lastLogin: "Never",
      createdDate: new Date().toISOString().split("T")[0],
      isCompliant: !newMfa ? false : true,
      isTemporary: newIsTemporary,
      expirationPreset: newIsTemporary ? newExpirationPreset : "permanent",
      expiresAt: calculatedExpiresAt,
      autoDisableOnExpire: newAutoDisableOnExpire,
    };

    setUsers([created, ...users]);
    setIsCreateModalOpen(false);

    const expiryDesc = newIsTemporary
      ? `Temporary account expiring via [${newExpirationPreset}] preset`
      : "Permanent account created";

    logAccessChange(
      "Provisioned User",
      created.email,
      `Assigned role: ${newRole}. Username: @${generatedUsername}. ${expiryDesc}`,
    );

    // Reset form
    setNewFirstName("");
    setNewLastName("");
    setNewEmail("");
    setNewUsername("");
    setNewTempPassword("");
    setNewRole("Data Engineer");
    setNewMfa(true);
    setNewSso(false);
    setNewIsTemporary(true);
    setNewExpirationPreset("6h");
    setNewCustomDays(1);

    showToast(
      `User ${created.firstName} ${created.lastName} provisioned successfully. Opening credentials sharing modal...`,
    );

    // Automatically present the Credentials Share modal for Super Admin!
    openCredentialsModal(created);
  };

  // Extend Expiration Modal Helper
  const openExtendModal = (user: UserItem) => {
    setUserToExtend(user);
    setExtendPreset(user.expirationPreset && user.expirationPreset !== "permanent" ? user.expirationPreset : "1d");
    setExtendCustomDays(1);
    setIsExtendModalOpen(true);
  };

  // Handle Extend Expiration Action
  const handleExtendExpiration = (presetChoice: ExpirationPreset) => {
    if (!userToExtend) return;

    if (presetChoice === "permanent") {
      setUsers(prev =>
        prev.map(u =>
          u.id === userToExtend.id
            ? {
                ...u,
                isTemporary: false,
                expirationPreset: "permanent",
                expiresAt: undefined,
                status: u.status === "Expired" ? "Active" : u.status,
              }
            : u,
        ),
      );
      logAccessChange("Converted to Permanent", userToExtend.email, "Removed access expiration deadline.");
      showToast(`User ${userToExtend.firstName} converted to Permanent Account.`);
      setIsExtendModalOpen(false);
      return;
    }

    const newExpiresAt = calculateExpiresAt(presetChoice, extendCustomDays);

    setUsers(prev =>
      prev.map(u =>
        u.id === userToExtend.id
          ? {
              ...u,
              isTemporary: true,
              expirationPreset: presetChoice,
              expiresAt: newExpiresAt,
              status: "Active", // Reactivate if it was expired
            }
          : u,
      ),
    );

    const formatted = formatExpirationDetails(newExpiresAt);
    logAccessChange("Extended Expiration", userToExtend.email, `Set new expiration preset [${presetChoice}]. ${formatted.fullFormatted}`);
    showToast(`Updated expiration for ${userToExtend.firstName}: ${formatted.text}.`);
    setIsExtendModalOpen(false);
  };

  // Edit User Handler
  const handleEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    let roleChanged = false;
    if (selectedUser.role !== editRole) {
      roleChanged = true;
    }

    const newExpiresAt = editIsTemporary
      ? calculateExpiresAt(editExpirationPreset, editCustomDays)
      : undefined;

    const updatedUsers = users.map((u) => {
      if (u.id === selectedUser.id) {
        return {
          ...u,
          firstName: editFirstName,
          lastName: editLastName,
          email: editEmail,
          role: editRole,
          status: editStatus,
          mfaEnforced: editMfa,
          ssoEnabled: editSso,
          isCompliant: editMfa,
          isTemporary: editIsTemporary,
          expirationPreset: editIsTemporary ? editExpirationPreset : "permanent",
          expiresAt: editIsTemporary ? newExpiresAt : undefined,
          autoDisableOnExpire: editAutoDisableOnExpire,
        };
      }
      return u;
    });

    setUsers(updatedUsers);
    setIsEditModalOpen(false);

    if (roleChanged) {
      logAccessChange(
        "Modified Role",
        selectedUser.email,
        `Changed role from ${selectedUser.role} to ${editRole}`,
      );
    } else {
      logAccessChange(
        "Updated Profile",
        selectedUser.email,
        `Updated user attributes and expiration policy`,
      );
    }

    showToast(`User security profile for ${editFirstName} has been updated.`);
  };

  // Open edit modal helper
  const openEditModal = (user: UserItem) => {
    setSelectedUser(user);
    setEditFirstName(user.firstName);
    setEditLastName(user.lastName);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditStatus(getUserEffectiveStatus(user));
    setEditMfa(user.mfaEnforced);
    setEditSso(user.ssoEnabled);
    setEditIsTemporary(!!user.isTemporary);
    setEditExpirationPreset(user.expirationPreset || "1d");
    setEditCustomDays(1);
    setEditAutoDisableOnExpire(user.autoDisableOnExpire ?? true);
    setIsEditModalOpen(true);
  };

  // Delete User Handler
  const handleDeleteUser = (userId: string) => {
    const userToDelete = users.find((u) => u.id === userId);
    if (!userToDelete) return;

    if (
      window.confirm(
        `Are you sure you want to permanently revoke access for ${userToDelete.firstName} ${userToDelete.lastName}?`,
      )
    ) {
      setUsers(users.filter((u) => u.id !== userId));
      logAccessChange(
        "Revoked Access",
        userToDelete.email,
        `Permanently removed user access.`,
      );
      showToast(
        `Access revoked for ${userToDelete.firstName} ${userToDelete.lastName}.`,
        "warning",
      );
    }
  };

  // Password Reset simulation
  const handleResetPasswordSim = (user: UserItem) => {
    const tempToken = `RST-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
    navigator.clipboard.writeText(tempToken);
    showToast(
      `Generated secure token for ${user.firstName}: "${tempToken}" (copied to clipboard)`,
    );
  };

  // Invite User Handler
  const handleInviteUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) {
      showToast("Please enter a valid recipient email address.", "warning");
      return;
    }

    const simulatedLink = `https://ais-pre-7qswlcoicd6wixwwrjtf25.europe-west3.run.app/invite-register?token=${Math.random().toString(36).substring(2, 10)}&role=${encodeURIComponent(inviteRole)}&email=${encodeURIComponent(inviteEmail)}`;
    setLatestInvitationLink(simulatedLink);

    // Create a pending user in the table as well
    const namePart = inviteEmail.split("@")[0];
    const generatedFirst = namePart.charAt(0).toUpperCase() + namePart.slice(1);

    const invitedUser: UserItem = {
      id: `usr-inv-${Math.floor(Math.random() * 900 + 100)}`,
      firstName: generatedFirst,
      lastName: "(Pending Invite)",
      email: inviteEmail,
      role: inviteRole,
      status: "Pending",
      ssoEnabled:
        ssoEnabled &&
        ssoDomainLockdown
          .split(",")
          .some((d) => inviteEmail.includes(d.trim())),
      mfaEnforced: mfaEnforcedGlobal,
      lastLogin: "Never (Invited)",
      createdDate: new Date().toISOString().split("T")[0],
      isCompliant: true,
    };

    setUsers([invitedUser, ...users]);
    logAccessChange(
      "Invited User",
      inviteEmail,
      `Assigned initial role: ${inviteRole}`,
    );
    showToast(`Simulated enrollment email dispatched to ${inviteEmail}.`);
  };

  // Permission Toggle Matrix Handler
  const handleTogglePermission = (role: ExtendedRole, permission: string) => {
    const isNowAuthorized = !permissionMatrix[role][permission];
    setPermissionMatrix((prev) => {
      const currentRolePermissions = { ...prev[role] };
      currentRolePermissions[permission] = !currentRolePermissions[permission];
      return {
        ...prev,
        [role]: currentRolePermissions,
      };
    });
    logAccessChange(
      "Modified Role Scope",
      `Role: ${role}`,
      `Permission [${permission}] is now ${isNowAuthorized ? "AUTHORIZED" : "RESTRICTED"}`,
    );
    showToast(
      `Updated access rule: [${role}] -> [${permission}] is now ${isNowAuthorized ? "AUTHORIZED" : "RESTRICTED"}`,
    );
  };

  // Restore Defaults for Selected Role
  const handleRestoreDefaultMatrix = (role: ExtendedRole) => {
    setPermissionMatrix((prev) => ({
      ...prev,
      [role]: { ...INITIAL_PERMISSION_MATRIX[role] },
    }));
    logAccessChange(
      "Restored Role Defaults",
      `Role: ${role}`,
      `Restored baseline security schema.`,
    );
    showToast(`Restored baseline security schema for role: ${role}`);
  };

  // Select all permissions for Selected Role
  const handleSelectAllPermissions = (role: ExtendedRole) => {
    setPermissionMatrix((prev) => {
      const updated: Record<string, boolean> = {};
      PERMISSIONS.forEach((p) => {
        updated[p] = true;
      });
      return {
        ...prev,
        [role]: updated,
      };
    });
    logAccessChange(
      "Granted Full Scope",
      `Role: ${role}`,
      `Granted full administrative pipeline access.`,
    );
    showToast(`Granted full administrative pipeline access to role: ${role}`);
  };

  // Filtered Users List
  const filteredUsers = users.filter((u) => {
    const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === "All" || u.role === roleFilter;
    const effectiveStatus = getUserEffectiveStatus(u);
    const matchesStatus =
      statusFilter === "All" ||
      (statusFilter === "Temporary" && u.isTemporary && effectiveStatus !== "Expired") ||
      (statusFilter === "Expired" && effectiveStatus === "Expired") ||
      effectiveStatus === statusFilter;

    const isAllowedToSee = currentUser?.role === 'Super Administrator' || u.role !== 'Super Administrator';
    return matchesSearch && matchesRole && matchesStatus && isAllowedToSee;
  });

  // Calculate stats for directory overview
  const totalUserCount = users.length;
  const activeUserCount = users.filter((u) => getUserEffectiveStatus(u) === "Active").length;
  const pendingUserCount = users.filter((u) => getUserEffectiveStatus(u) === "Pending").length;
  const tempUserCount = users.filter((u) => u.isTemporary && getUserEffectiveStatus(u) !== "Expired").length;
  const expiredUserCount = users.filter((u) => getUserEffectiveStatus(u) === "Expired").length;
  const complianceScorePercent = Math.round(
    (users.filter((u) => u.isCompliant).length / totalUserCount) * 100,
  );

  return (
    <div id="user-role-mgmt-workspace" className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Workspace Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg">
              <Shield className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Identity & Role Access Studio
            </h1>
          </div>
          <p className="text-xs text-slate-600 max-w-2xl font-mono leading-relaxed">
            Configure fine-grained Role-Based Access Control (RBAC), provision
            temporary user identities with automatic expiration (6h, 1d, 1w, 1m), enforce cryptographic policies,
            and federate SSO providers.
          </p>
        </div>

        {/* Global Stats indicators */}
        <div className="flex items-center gap-4 shrink-0 bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-mono overflow-x-auto">
          <div className="text-center px-2">
            <span className="text-[10px] text-slate-500 uppercase block font-black">
              Active Dir
            </span>
            <span className="text-base font-black text-slate-900">
              {activeUserCount}/{totalUserCount}
            </span>
          </div>
          <div className="h-8 w-[1px] bg-slate-200" />
          <div className="text-center px-2">
            <span className="text-[10px] text-slate-500 uppercase block font-black">
              Temporary
            </span>
            <span className="text-base font-black text-amber-600">
              {tempUserCount}
            </span>
          </div>
          <div className="h-8 w-[1px] bg-slate-200" />
          <div className="text-center px-2">
            <span className="text-[10px] text-slate-500 uppercase block font-black">
              Expired
            </span>
            <span className="text-base font-black text-rose-600">
              {expiredUserCount}
            </span>
          </div>
          <div className="h-8 w-[1px] bg-slate-200" />
          <div className="text-center px-2">
            <span className="text-[10px] text-slate-500 uppercase block font-black">
              MFA Compliance
            </span>
            <span
              className={`text-base font-black ${complianceScorePercent > 80 ? "text-emerald-600" : "text-amber-600"}`}
            >
              {complianceScorePercent}%
            </span>
          </div>
        </div>
      </div>

      {/* UI Toast Alert Panel */}
      {toastMessage && (
        <div
          className={`flex items-center gap-3 p-3.5 border rounded-xl shadow-lg animate-in fade-in slide-in-from-top-3 duration-300 font-mono text-xs ${
            toastMessage.type === "warning"
              ? "bg-rose-50 border-rose-200 text-rose-800"
              : toastMessage.type === "info"
                ? "bg-blue-50 border-blue-200 text-blue-800"
                : "bg-emerald-50 border-emerald-200 text-emerald-800"
          }`}
        >
          {toastMessage.type === "warning" ? (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : toastMessage.type === "info" ? (
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span className="flex-1 font-semibold">{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex flex-col xl:flex-row gap-6 items-start">
        <div className="flex-1 space-y-6 min-w-0 w-full">
          {/* Tab Switcher */}
          <div className="flex border-b border-slate-200 bg-white p-1 rounded-xl border max-w-3xl shadow-2xs overflow-x-auto">
            <button
              onClick={() => setActiveSubTab("users")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 min-w-max text-xs font-black uppercase rounded-lg transition-all cursor-pointer ${
                activeSubTab === "users"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>User Directory</span>
            </button>
            <button
              onClick={() => setActiveSubTab("permissions")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 min-w-max text-xs font-black uppercase rounded-lg transition-all cursor-pointer ${
                activeSubTab === "permissions"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <Sliders className="w-4 h-4 shrink-0" />
              <span>Permission Matrix</span>
            </button>
            <button
              onClick={() => setActiveSubTab("orgchart")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 min-w-max text-xs font-black uppercase rounded-lg transition-all cursor-pointer ${
                activeSubTab === "orgchart"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <Briefcase className="w-4 h-4 shrink-0" />
              <span>RBAC Hierarchy</span>
            </button>
            <button
              onClick={() => setActiveSubTab("sso")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 min-w-max text-xs font-black uppercase rounded-lg transition-all cursor-pointer ${
                activeSubTab === "sso"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <Globe className="w-4 h-4 shrink-0" />
              <span>SSO & Password Policy</span>
            </button>
            <button
              onClick={() => setActiveSubTab("simulation")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 min-w-max text-xs font-black uppercase rounded-lg transition-all cursor-pointer ${
                activeSubTab === "simulation"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <PlayCircle className="w-4 h-4 shrink-0" />
              <span>Role Simulation</span>
            </button>
          </div>

          {/* SUB-VIEW 1: USER DIRECTORY & MANAGEMENT */}
          {activeSubTab === "users" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Controls Bar */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="flex flex-1 flex-wrap items-center gap-3 w-full sm:w-auto">
                  {/* Search */}
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search name, email, role..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/40 text-slate-800"
                    />
                  </div>

                  {/* Role filter */}
                  <div className="relative w-full sm:w-48">
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-xs font-bold text-slate-700 outline-none cursor-pointer"
                    >
                      <option value="All">All Roles</option>
                      {availableRoles.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status filter */}
                  <div className="relative w-full sm:w-44">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-xs font-bold text-slate-700 outline-none cursor-pointer"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Active">Active</option>
                      <option value="Temporary">Temporary Accounts</option>
                      <option value="Expired">Expired Accounts</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 w-full sm:w-auto shrink-0 justify-end">
                  <button
                    onClick={() => setIsInviteModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-lg text-[10px] font-black uppercase cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Invite User</span>
                  </button>

                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-[10px] font-black uppercase cursor-pointer shadow-xs"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Create User</span>
                  </button>
                </div>
              </div>

              {/* Directory Users Table */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <span className="text-[11px] font-black text-slate-800 uppercase tracking-wide">
                    Enterprise User Directory
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Total Records: {filteredUsers.length} matched
                  </span>
                </div>

                <OverflowTableWrapper>
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-wider font-mono">
                        <th className="py-3 px-4">User Profile</th>
                        <th className="py-3 px-4">Workspace Role</th>
                        <th className="py-3 px-4 text-center">
                          Federation (SSO)
                        </th>
                        <th className="py-3 px-4 text-center">
                          Multi-Factor (MFA)
                        </th>
                        <th className="py-3 px-4">Expiration Policy</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4">Last Auth</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => {
                          const effStatus = getUserEffectiveStatus(user);
                          const expInfo = formatExpirationDetails(user.expiresAt);
                          return (
                            <tr
                              key={user.id}
                              className="hover:bg-slate-50/70 transition-colors font-medium text-slate-700"
                            >
                              {/* Profile Info */}
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-black text-indigo-700 border border-slate-200 shrink-0">
                                    {user.firstName[0]}
                                    {user.lastName[0] !== "("
                                      ? user.lastName[0]
                                      : ""}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                                      <span>{user.firstName} {user.lastName}</span>
                                      {user.isTemporary && (
                                        <span className="bg-amber-50 text-amber-700 text-[8px] font-mono font-bold px-1.5 py-0.2 rounded border border-amber-200 uppercase flex items-center gap-0.5">
                                          <Clock className="w-2.5 h-2.5" /> Temp
                                        </span>
                                      )}
                                      {user.id.startsWith("usr-inv") && (
                                        <span className="bg-amber-50 text-amber-700 text-[8px] font-mono font-bold px-1 py-0.2 rounded border border-amber-200 uppercase">
                                          Invited
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 flex-wrap">
                                      <span>{user.email}</span>
                                      <span className="text-[9px] font-mono text-indigo-700 bg-indigo-50/80 px-1.5 py-0.2 rounded border border-indigo-150 font-bold" title="Generated System Username for Super Admin sharing">
                                        @{user.username || generateSystemUsername(user.firstName, user.lastName, user.email)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Role Badge */}
                              <td className="py-3.5 px-4">
                                <div className="flex flex-col">
                                  <span className="font-bold text-slate-800 text-[11px]">
                                    {user.role}
                                  </span>
                                  <span className="text-[9px] text-slate-400 font-mono">
                                    {ROLE_DESCRIPTIONS[user.role]?.scope ||
                                      "Localized"}
                                  </span>
                                </div>
                              </td>

                              {/* SSO Enabled */}
                              <td className="py-3.5 px-4 text-center">
                                {user.ssoEnabled ? (
                                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-150">
                                    <Globe className="w-3 h-3 text-emerald-600" />
                                    Federated
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 bg-slate-50 text-slate-400 text-[10px] font-mono px-2 py-0.5 rounded-full border border-slate-200">
                                    <KeyRound className="w-3 h-3 text-slate-350" />
                                    Database Auth
                                  </span>
                                )}
                              </td>

                              {/* MFA Enforced */}
                              <td className="py-3.5 px-4 text-center">
                                {user.mfaEnforced ? (
                                  <span
                                    className="inline-flex items-center gap-0.5 text-emerald-600 font-bold"
                                    title="MFA active and verified"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span className="text-[10px] font-mono">
                                      Active
                                    </span>
                                  </span>
                                ) : (
                                  <span
                                    className="inline-flex items-center gap-0.5 text-rose-500 font-bold"
                                    title="Enforcement override active"
                                  >
                                    <AlertCircle className="w-4 h-4" />
                                    <span className="text-[10px] font-mono">
                                      Bypassed
                                    </span>
                                  </span>
                                )}
                              </td>

                              {/* Expiration Policy */}
                              <td className="py-3.5 px-4">
                                {user.isTemporary && user.expiresAt ? (
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-1">
                                      <span
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono font-bold rounded-md border ${expInfo.badgeBg}`}
                                        title={expInfo.fullFormatted}
                                      >
                                        <Clock className="w-3 h-3 shrink-0" />
                                        {expInfo.statusBadge}
                                      </span>
                                    </div>
                                    <div className="text-[9px] text-slate-400 font-mono truncate max-w-[140px]">
                                      {expInfo.fullFormatted}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                                    Permanent
                                  </span>
                                )}
                              </td>

                              {/* Status Badge */}
                              <td className="py-3.5 px-4 text-center">
                                <span
                                  className={`inline-block px-2.5 py-0.5 text-[9px] font-mono font-bold uppercase rounded-full ${
                                    effStatus === "Active"
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                      : effStatus === "Expired"
                                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                                        : effStatus === "Pending"
                                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                                          : "bg-slate-100 text-slate-500 border border-slate-200"
                                  }`}
                                >
                                  {effStatus}
                                </span>
                              </td>

                              {/* Last Login */}
                              <td className="py-3.5 px-4 text-slate-500 font-mono text-[10px]">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  <span>{user.lastLogin}</span>
                                </div>
                              </td>

                              {/* Action buttons */}
                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    title="Extend or Modify Temporary Expiration"
                                    onClick={() => openExtendModal(user)}
                                    className="p-1 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                                  >
                                    <Hourglass className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    title="View & Share Generated Credentials (Username & Password)"
                                    onClick={() => openCredentialsModal(user)}
                                    className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                                  >
                                    <KeyRound className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    title="Edit User Profile"
                                    onClick={() => openEditModal(user)}
                                    className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    title="Revoke System Access"
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                          <tr>
                            <td
                              colSpan={8}
                              className="py-8 text-center text-slate-400 font-mono text-xs"
                            >
                              No user accounts matched the query criteria.
                            </td>
                          </tr>
                      )}
                    </tbody>
                  </table>
                </OverflowTableWrapper>
              </div>

              {/* Directory Footnote */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-start gap-3">
                <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div className="text-[11px] text-slate-500 font-mono leading-relaxed space-y-1">
                  <span className="font-bold text-slate-700 uppercase block">
                    Directory Policy Advisory
                  </span>
                  <p>
                    Enterprise users linked to Federated domains (
                    <span className="text-indigo-600 font-bold">
                      {ssoDomainLockdown}
                    </span>
                    ) are automatically synchronized via external IdPs. Manual
                    passwords for these accounts are locked out. Any user
                    lacking MFA enforcements is flagged as{" "}
                    <span className="text-rose-600 font-black">
                      Non-Compliant
                    </span>{" "}
                    in general audit checklists.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SUB-VIEW 2: ROLE PERMISSION MATRIX */}
          {activeSubTab === "permissions" && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 animate-in fade-in duration-200">
              {/* Left: Role Selection & Description (4 cols) */}
              <div className="xl:col-span-4 space-y-4">
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wide block">
                    Select Role Context
                  </span>

                  <div className="space-y-1.5">
                    {availableRoles.map((roleName) => {
                      const role = roleName as ExtendedRole;
                      const isActive = selectedRoleForMatrix === role;
                      const isSuper = role === "Super Administrator";

                      return (
                        <button
                          key={role}
                          onClick={() => setSelectedRoleForMatrix(role)}
                          className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all border cursor-pointer ${
                            isActive
                              ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                              : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <div
                              className={`w-2.5 h-2.5 rounded-full ${
                                isSuper
                                  ? "bg-purple-500"
                                  : role.includes("Admin")
                                    ? "bg-indigo-500"
                                    : "bg-slate-400"
                              }`}
                            />
                            <span className="text-xs font-bold truncate leading-tight">
                              {role}
                            </span>
                          </div>
                          <span
                            className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded shrink-0 ${
                              isActive
                                ? "bg-slate-800 text-slate-300"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {users.filter((u) => u.role === role).length} Users
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Role Details Panel */}
                {selectedRoleForMatrix && (
                  <div className="bg-white text-slate-900 border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="bg-indigo-50 text-indigo-700 text-[9px] font-mono font-bold px-2 py-0.5 rounded border border-indigo-200 uppercase">
                          {ROLE_DESCRIPTIONS[selectedRoleForMatrix].level}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono font-bold">
                          {ROLE_DESCRIPTIONS[selectedRoleForMatrix].scope}
                        </span>
                      </div>
                      <h3 className="text-base font-black tracking-tight text-slate-900">
                        {selectedRoleForMatrix}
                      </h3>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                      {ROLE_DESCRIPTIONS[selectedRoleForMatrix].desc}
                    </p>

                    {/* Quick actions for selected role matrix */}
                    <div className="space-y-2 border-t border-slate-200 pt-3.5">
                      <span className="text-[10px] font-mono uppercase text-slate-500 block font-bold">
                        Matrix Operations
                      </span>

                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            handleSelectAllPermissions(selectedRoleForMatrix)
                          }
                          className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-colors rounded-lg text-[9px] font-bold uppercase tracking-wide cursor-pointer"
                        >
                          Grant All Access
                        </button>
                        <button
                          onClick={() =>
                            handleRestoreDefaultMatrix(selectedRoleForMatrix)
                          }
                          className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-colors rounded-lg text-[9px] font-bold uppercase tracking-wide cursor-pointer"
                        >
                          Reset Defaults
                        </button>
                      </div>
                    </div>

                    {/* Users with this role inside system */}
                    <div className="space-y-2 border-t border-slate-200 pt-3.5 text-xs font-mono">
                      <span className="text-[10px] font-mono uppercase text-slate-500 block font-bold">
                        Assigned Profiles
                      </span>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto">
                        {users.filter((u) => u.role === selectedRoleForMatrix)
                          .length > 0 ? (
                          users
                            .filter((u) => u.role === selectedRoleForMatrix)
                            .map((u) => (
                              <div
                                key={u.id}
                                className="flex items-center justify-between text-[11px] text-slate-800 font-bold"
                              >
                                <span className="truncate pr-1">
                                  • {u.firstName} {u.lastName}
                                </span>
                                <span className="text-[9px] text-slate-500 font-medium">
                                  ({u.status})
                                </span>
                              </div>
                            ))
                        ) : (
                          <span className="text-[10px] text-slate-500 italic block">
                            No users assigned to this role context.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Permission Matrix Table (8 cols) */}
              <div className="xl:col-span-8 space-y-4">
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="space-y-0.5">
                      <span className="text-xs font-black text-slate-800 uppercase tracking-wide block">
                        Fine-Grained Permission Mapping
                      </span>
                      <p className="text-[10px] text-slate-500 font-mono">
                        Directly authorize or restrict system capabilities by
                        toggle check-boxes. Changes apply immediately.
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-150 p-1.5 rounded-lg flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">
                        Currently Configuring:
                      </span>
                      <span className="bg-indigo-50 text-indigo-700 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-indigo-150">
                        {selectedRoleForMatrix}
                      </span>
                    </div>
                  </div>

                  {/* Grid of actions with sliders/toggles */}
                  <div className="space-y-2.5">
                    {PERMISSIONS.map((permission) => {
                      const isAuthorized =
                        permissionMatrix[selectedRoleForMatrix]?.[permission] ||
                        false;

                      return (
                        <div
                          key={permission}
                          onClick={() =>
                            handleTogglePermission(
                              selectedRoleForMatrix,
                              permission,
                            )
                          }
                          className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-all ${
                            isAuthorized
                              ? "bg-indigo-50/40 border-indigo-150 hover:bg-indigo-50/60"
                              : "bg-white border-slate-200 hover:bg-slate-50/80"
                          }`}
                        >
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-slate-800 block">
                              {permission}
                            </span>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {permission === "Create Migration" &&
                                "Initiate and configuration-wire standard database mappings"}
                              {permission === "Execute Migration" &&
                                "Authorize high-throughput transfer jobs to raw target environments"}
                              {permission === "Stop Migration" &&
                                "Immediately abort and rollback active cluster execution jobs"}
                              {permission === "View Reports" &&
                                "Read system-wide CDC synchronizations, dry-run profiles, and analytics"}
                              {permission === "Export Reports" &&
                                "Trigger background export of compliance reports to CSV/PDF"}
                              {permission === "Manage Connectors" &&
                                "Configure and test enterprise SAP, Dynamics, or SQL credentials"}
                              {permission === "Manage Pipelines" &&
                                "Architect visual multi-stage data mappings and workflow processes"}
                              {permission === "Manage AI Models" &&
                                "Tune or override Gemini Co-Pilot prompts and schema classifications"}
                              {permission === "Approve Migration" &&
                                "Approve migration sign-off workflows as an independent validation agent"}
                              {permission === "Delete Projects" &&
                                "Permanently erase workspace history logs and backup records"}
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <span
                              className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                                isAuthorized
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-150"
                                  : "bg-rose-50 text-rose-700 border-rose-150"
                              }`}
                            >
                              {isAuthorized ? "Authorized" : "Restricted"}
                            </span>

                            <div
                              className={`w-8 h-4 rounded-full p-0.5 transition-colors cursor-pointer ${
                                isAuthorized ? "bg-indigo-600" : "bg-slate-250"
                              }`}
                            >
                              <div
                                className={`w-3 h-3 rounded-full bg-white transition-transform ${
                                  isAuthorized
                                    ? "translate-x-4"
                                    : "translate-x-0"
                                }`}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Advanced Comparison Matrix visual */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4.5 space-y-3.5">
                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-wide block">
                      Cross-Role Matrix Map Reference
                    </span>

                    <OverflowTableWrapper>
                      <table className="w-full border-collapse text-left text-[10px] font-mono">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                            <th className="py-2 px-2">Access Capabilities</th>
                            <th className="py-2 px-1 text-center">
                              Super Admin
                            </th>
                            <th className="py-2 px-1 text-center">
                              Plat Admin
                            </th>
                            <th className="py-2 px-1 text-center">Proj Mgr</th>
                            <th className="py-2 px-1 text-center">Data Eng</th>
                            <th className="py-2 px-1 text-center font-bold text-slate-700 bg-indigo-50/50 border border-indigo-100">
                              {selectedRoleForMatrix.substring(0, 8)}..
                            </th>
                            <th className="py-2 px-1 text-center">Auditor</th>
                            <th className="py-2 px-1 text-center">Read Only</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150">
                          {PERMISSIONS.slice(0, 6).map((perm) => (
                            <tr key={perm} className="hover:bg-slate-100/50">
                              <td className="py-2 px-2 font-bold text-slate-600">
                                {perm}
                              </td>
                              <td className="py-2 px-1 text-center text-emerald-600 font-bold">
                                ✔
                              </td>
                              <td className="py-2 px-1 text-center text-emerald-600 font-bold">
                                {permissionMatrix["Platform Administrator"]?.[
                                  perm
                                ]
                                  ? "✔"
                                  : "✖"}
                              </td>
                              <td className="py-2 px-1 text-center text-slate-400">
                                {permissionMatrix["Project Manager"]?.[perm]
                                  ? "✔"
                                  : "✖"}
                              </td>
                              <td className="py-2 px-1 text-center text-slate-400">
                                {permissionMatrix["Data Engineer"]?.[perm]
                                  ? "✔"
                                  : "✖"}
                              </td>
                              {/* Current selected role highlight column */}
                              <td className="py-2 px-1 text-center font-bold bg-indigo-50/30 border-l border-r border-indigo-100 text-indigo-700">
                                {permissionMatrix[selectedRoleForMatrix]?.[perm]
                                  ? "✔"
                                  : "✖"}
                              </td>
                              <td className="py-2 px-1 text-center">
                                {permissionMatrix["Auditor"]?.[perm]
                                  ? "✔"
                                  : "✖"}
                              </td>
                              <td className="py-2 px-1 text-center">
                                {permissionMatrix["Read Only"]?.[perm]
                                  ? "✔"
                                  : "✖"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </OverflowTableWrapper>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUB-VIEW: ORG CHART */}
          {activeSubTab === "orgchart" && (
            <div className="animate-in fade-in duration-200">
              <RoleOrgChart />
            </div>
          )}

          {/* SUB-VIEW 3: SSO & PASSWORD POLICIES */}
          {activeSubTab === "sso" && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-in fade-in duration-200">
              {/* Left Panel: Passwords policies */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-5">
                <div className="border-b border-slate-100 pb-3">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wide block flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-slate-700" />
                    Enterprise Password Cryptographic Policy
                  </span>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Enforce stringent password policies to meet SOC2 Type II
                    compliance controls for non-federated accounts.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* 1. Min length */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label
                        htmlFor="min-length-input"
                        className="text-xs font-black text-slate-600 uppercase"
                      >
                        Minimum Character Length
                      </label>
                      <span className="bg-indigo-50 text-indigo-700 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border border-indigo-100">
                        {passwordMinLength} characters
                      </span>
                    </div>
                    <input
                      id="min-length-input"
                      type="range"
                      min="8"
                      max="32"
                      value={passwordMinLength}
                      onChange={(e) => {
                        setPasswordMinLength(parseInt(e.target.value));
                        showToast(
                          `Updated minimum password length rule to ${e.target.value} chars.`,
                          "info",
                        );
                      }}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>

                  {/* Toggles */}
                  <div className="space-y-3 pt-2">
                    {/* Require numbers */}
                    <div
                      onClick={() => setRequireNumbers(!requireNumbers)}
                      className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer border border-slate-150 transition-colors"
                    >
                      <span className="text-xs font-bold text-slate-700">
                        Require Alphanumeric Digits (0-9)
                      </span>
                      <div
                        className={`w-8 h-4 rounded-full p-0.5 transition-colors ${requireNumbers ? "bg-indigo-600" : "bg-slate-250"}`}
                      >
                        <div
                          className={`w-3 h-3 rounded-full bg-white transition-transform ${requireNumbers ? "translate-x-4" : "translate-x-0"}`}
                        />
                      </div>
                    </div>

                    {/* Require Special */}
                    <div
                      onClick={() => setRequireSpecial(!requireSpecial)}
                      className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer border border-slate-150 transition-colors"
                    >
                      <span className="text-xs font-bold text-slate-700">
                        Require Cryptographic Special Characters (!@#$)
                      </span>
                      <div
                        className={`w-8 h-4 rounded-full p-0.5 transition-colors ${requireSpecial ? "bg-indigo-600" : "bg-slate-250"}`}
                      >
                        <div
                          className={`w-3 h-3 rounded-full bg-white transition-transform ${requireSpecial ? "translate-x-4" : "translate-x-0"}`}
                        />
                      </div>
                    </div>

                    {/* Require Uppercase */}
                    <div
                      onClick={() => setRequireUppercase(!requireUppercase)}
                      className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer border border-slate-150 transition-colors"
                    >
                      <span className="text-xs font-bold text-slate-700">
                        Require Mixed Case Uppercase-Lowercase (a-Z)
                      </span>
                      <div
                        className={`w-8 h-4 rounded-full p-0.5 transition-colors ${requireUppercase ? "bg-indigo-600" : "bg-slate-250"}`}
                      >
                        <div
                          className={`w-3 h-3 rounded-full bg-white transition-transform ${requireUppercase ? "translate-x-4" : "translate-x-0"}`}
                          stroke-width={0}
                        />
                      </div>
                    </div>

                    {/* MFA Enforced Global */}
                    <div
                      onClick={() => {
                        setMfaEnforcedGlobal(!mfaEnforcedGlobal);
                        // Dynamically flag users
                        setUsers((prev) =>
                          prev.map((u) => ({
                            ...u,
                            isCompliant: !mfaEnforcedGlobal
                              ? true
                              : u.ssoEnabled,
                          })),
                        );
                        showToast(
                          `Global Multi-Factor Authentication (MFA) enforcement toggled ${!mfaEnforcedGlobal ? "ON" : "OFF"}. Compliance checklists updated.`,
                          "warning",
                        );
                      }}
                      className="flex items-center justify-between p-3.5 bg-white text-slate-900 rounded-xl cursor-pointer transition-colors border border-slate-200 hover:bg-slate-50 shadow-2xs"
                    >
                      <div className="space-y-0.5">
                        <span className="text-xs font-black uppercase tracking-wider block text-slate-900">
                          Enforce Multi-Factor (MFA) Globally
                        </span>
                        <p className="text-[10px] text-slate-500 font-mono">
                          Required for all non-federated email registrations
                        </p>
                      </div>
                      <div
                        className={`w-8 h-4 rounded-full p-0.5 transition-colors ${mfaEnforcedGlobal ? "bg-indigo-600" : "bg-slate-300"}`}
                      >
                        <div
                          className={`w-3 h-3 rounded-full bg-white transition-transform ${mfaEnforcedGlobal ? "translate-x-4" : "translate-x-0"}`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Password Age */}
                  <div className="space-y-1.5 pt-2">
                    <label
                      htmlFor="password-expiry-input"
                      className="text-[10px] font-black text-slate-500 uppercase tracking-wider block"
                    >
                      Max Password Age Key Expiration
                    </label>
                    <div className="relative rounded-lg shadow-2xs max-w-xs">
                      <input
                        id="password-expiry-input"
                        type="number"
                        value={passwordExpiryDays}
                        onChange={(e) =>
                          setPasswordExpiryDays(
                            Math.max(30, parseInt(e.target.value) || 30),
                          )
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-xs font-bold font-mono outline-none focus:ring-2 focus:ring-indigo-500/40 text-slate-800"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 text-[10px] font-mono">
                        Days
                      </div>
                    </div>
                  </div>

                  {/* Audit compliance score card */}
                  <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-4 flex gap-3 items-start">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-emerald-950 space-y-1">
                      <span className="font-black uppercase tracking-wider block">
                        SOC2 Compliance Index Optimal
                      </span>
                      <p className="leading-relaxed font-semibold">
                        Current rules enforce high-entropy 256-bit password
                        configurations. Platform is fully compliant with
                        ISO27001 guidelines for database accounts.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Panel: SSO Integration Settings */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-5">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wide block flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-slate-700" />
                      SSO Federated Identity Provider (IdP)
                    </span>
                    <p className="text-[10px] text-slate-500 font-mono">
                      Map and authenticate users directly through company Azure
                      AD / Microsoft Entra ID or Okta domains.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSsoEnabled(!ssoEnabled);
                        showToast(
                          `Single Sign-On Integration ${!ssoEnabled ? "ENABLED" : "DISABLED"}.`,
                          "warning",
                        );
                      }}
                      className="focus:outline-none cursor-pointer"
                    >
                      <div
                        className={`w-10 h-5.5 rounded-full p-0.5 transition-colors ${ssoEnabled ? "bg-indigo-600" : "bg-slate-250"}`}
                      >
                        <div
                          className={`w-4.5 h-4.5 rounded-full bg-white transition-transform shadow-xs ${ssoEnabled ? "translate-x-4.5" : "translate-x-0"}`}
                        />
                      </div>
                    </button>
                  </div>
                </div>

                {ssoEnabled ? (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    {/* Provider select */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="sso-provider-select"
                        className="text-[10px] font-black text-slate-500 uppercase tracking-wider block"
                      >
                        SSO Federation Provider
                      </label>
                      <select
                        id="sso-provider-select"
                        value={ssoProvider}
                        onChange={(e) => setSsoProvider(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-xs font-bold text-slate-700 outline-none cursor-pointer"
                      >
                        <option value="EntraID">
                          Microsoft Entra ID (Azure AD)
                        </option>
                        <option value="Okta">Okta Enterprise Auth Hub</option>
                        <option value="Ping">
                          Ping Identity Federation Suite
                        </option>
                        <option value="Google">
                          Google Workspace Directory API
                        </option>
                        <option value="Custom">Custom SAML 2.0 / OIDC</option>
                      </select>
                    </div>

                    {/* Issuer URI */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="sso-issuer-input"
                        className="text-[10px] font-black text-slate-500 uppercase tracking-wider block"
                      >
                        Identity Provider Issuer (Entity ID)
                      </label>
                      <input
                        id="sso-issuer-input"
                        type="text"
                        value={ssoIssuerUrl}
                        onChange={(e) => setSsoIssuerUrl(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-xs font-bold font-mono outline-none focus:ring-2 focus:ring-indigo-500/40 text-slate-800"
                      />
                    </div>

                    {/* Target URL */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="sso-target-input"
                        className="text-[10px] font-black text-slate-500 uppercase tracking-wider block"
                      >
                        SAML 2.0 Single Sign-On Service URL
                      </label>
                      <input
                        id="sso-target-input"
                        type="text"
                        value={ssoTargetUrl}
                        onChange={(e) => setSsoTargetUrl(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-xs font-bold font-mono outline-none focus:ring-2 focus:ring-indigo-500/40 text-slate-800"
                      />
                    </div>

                    {/* Allowed Domain Lockdown */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label
                          htmlFor="sso-domain-input"
                          className="text-[10px] font-black text-slate-500 uppercase tracking-wider block"
                        >
                          Domain White-List Lockdown
                        </label>
                        <span className="text-[9px] text-rose-500 font-mono uppercase font-black">
                          STRICT LOCKDOWN ACTIVE
                        </span>
                      </div>
                      <input
                        id="sso-domain-input"
                        type="text"
                        value={ssoDomainLockdown}
                        onChange={(e) => setSsoDomainLockdown(e.target.value)}
                        placeholder="example.com, company.net"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-xs font-bold font-mono outline-none focus:ring-2 focus:ring-indigo-500/40 text-slate-800"
                      />
                      <p className="text-[9px] text-slate-400 font-mono">
                        Only users with emails originating from these domains
                        can bypass manual passwords and use single sign-on.
                      </p>
                    </div>

                    {/* Metadata XML File section */}
                    <div className="border border-dashed border-slate-200 rounded-xl p-4 bg-slate-50 text-center space-y-1.5">
                      <Fingerprint className="w-6 h-6 text-indigo-600 mx-auto animate-pulse" />
                      <span className="text-xs font-bold text-slate-700 block">
                        SAML 2.0 Signing Certificate Metadata
                      </span>
                      <p className="text-[9px] text-slate-400 font-mono max-w-sm mx-auto">
                        Cert Thumbprint:{" "}
                        <span className="font-bold text-slate-600">
                          8E:D2:C3:FF:11:AB:65:E9...
                        </span>{" "}
                        (Expires June 2029)
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          showToast(
                            "IdP Signing metadata certificate parsed successfully.",
                            "info",
                          )
                        }
                        className="text-[10px] text-indigo-600 font-black uppercase tracking-wider block mx-auto hover:underline cursor-pointer"
                      >
                        Replace Certificate / Metadata XML
                      </button>
                    </div>

                    {/* Attribute Mapping Section */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                          IdP Attribute to RBAC Role Mapping
                        </label>
                        <span className="bg-indigo-50 text-indigo-700 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-indigo-100">
                          {ssoAttributeMappings.length} Active Mappings
                        </span>
                      </div>

                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {ssoAttributeMappings.map((mapping, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-2"
                          >
                            <div className="flex-1 space-y-0.5">
                              <div className="text-[10px] font-mono text-slate-500 uppercase">
                                IdP Claim
                              </div>
                              <div className="text-xs font-bold text-slate-800">
                                {mapping.claimName}
                              </div>
                            </div>
                            <div className="text-slate-400">
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M5 12h14" />
                                <path d="m12 5 7 7-7 7" />
                              </svg>
                            </div>
                            <div className="flex-1 space-y-0.5">
                              <div className="text-[10px] font-mono text-slate-500 uppercase">
                                Expected Value
                              </div>
                              <div className="text-xs font-bold text-slate-800">
                                {mapping.claimValue}
                              </div>
                            </div>
                            <div className="text-slate-400">
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M5 12h14" />
                                <path d="m12 5 7 7-7 7" />
                              </svg>
                            </div>
                            <div className="flex-1 space-y-0.5">
                              <div className="text-[10px] font-mono text-slate-500 uppercase">
                                EDIMP Role
                              </div>
                              <div className="text-xs font-bold text-slate-800">
                                {mapping.internalRole}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setSsoAttributeMappings((prev) =>
                                  prev.filter((_, i) => i !== idx),
                                );
                                showToast(
                                  `Removed mapping for ${mapping.claimName}=${mapping.claimValue}`,
                                  "info",
                                );
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                            >
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M3 6h18" />
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                <line x1="10" x2="10" y1="11" y2="17" />
                                <line x1="14" x2="14" y1="11" y2="17" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-col gap-2 bg-white border border-slate-200 rounded-lg p-2">
                        <div className="flex items-end gap-2">
                          <div className="flex-1 space-y-1.5">
                            <label className="text-[9px] font-bold text-slate-500 uppercase">
                              Claim Name
                            </label>
                            <input
                              type="text"
                              value={newMappingClaimName}
                              onChange={(e) =>
                                setNewMappingClaimName(e.target.value)
                              }
                              placeholder="e.g. department"
                              className="w-full bg-slate-50 border border-slate-200 rounded-md py-1 px-2 text-[11px] font-mono outline-none focus:ring-2 focus:ring-indigo-500/40 text-slate-800"
                            />
                          </div>
                          <div className="flex-1 space-y-1.5">
                            <label className="text-[9px] font-bold text-slate-500 uppercase">
                              Claim Value
                            </label>
                            <input
                              type="text"
                              value={newMappingClaimValue}
                              onChange={(e) =>
                                setNewMappingClaimValue(e.target.value)
                              }
                              placeholder="e.g. Finance_Admins"
                              className="w-full bg-slate-50 border border-slate-200 rounded-md py-1 px-2 text-[11px] font-mono outline-none focus:ring-2 focus:ring-indigo-500/40 text-slate-800"
                            />
                          </div>
                        </div>
                        <div className="flex items-end gap-2">
                          <div className="flex-[2] space-y-1.5">
                            <label className="text-[9px] font-bold text-slate-500 uppercase">
                              Map to Role
                            </label>
                            <select
                              value={newMappingRole}
                              onChange={(e) =>
                                setNewMappingRole(
                                  e.target.value as ExtendedRole,
                                )
                              }
                              className="w-full bg-slate-50 border border-slate-200 rounded-md py-1 px-2 text-[11px] font-bold text-slate-700 outline-none cursor-pointer"
                            >
                              {availableRoles.map((r) => (
                                <option key={r} value={r}>
                                  {r}
                                </option>
                              ))}
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                !newMappingClaimName.trim() ||
                                !newMappingClaimValue.trim()
                              )
                                return showToast(
                                  "Please enter both claim name and value.",
                                  "warning",
                                );
                              setSsoAttributeMappings((prev) => [
                                ...prev,
                                {
                                  claimName: newMappingClaimName.trim(),
                                  claimValue: newMappingClaimValue.trim(),
                                  internalRole: newMappingRole,
                                },
                              ]);
                              setNewMappingClaimValue("");
                              showToast(
                                `Added mapping: ${newMappingClaimName.trim()}=${newMappingClaimValue.trim()} -> ${newMappingRole}`,
                                "success",
                              );
                            }}
                            className="flex-1 py-1 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-[11px] font-black uppercase tracking-wider transition-colors h-[26px] cursor-pointer"
                          >
                            Add Rule
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Save & test */}
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsSsoSaved(true);
                          setTimeout(() => {
                            setIsSsoSaved(false);
                            showToast(
                              "Federated Identity configuration validated and persisted globally.",
                            );
                          }, 1200);
                        }}
                        disabled={isSsoSaved}
                        className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white transition-colors rounded-lg text-xs font-black uppercase tracking-wide cursor-pointer disabled:opacity-50 text-center flex items-center justify-center gap-1"
                      >
                        {isSsoSaved && (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        )}
                        <span>
                          {isSsoSaved
                            ? "Persisting Config..."
                            : "Save Configuration"}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          showToast(
                            `Initiating federation loop test to Azure AD: Connected successfully.`,
                            "success",
                          )
                        }
                        className="py-2 px-3 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors rounded-lg text-xs font-bold uppercase cursor-pointer"
                      >
                        Test Integration Loop
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border border-slate-150 bg-slate-50 p-6 rounded-xl text-center space-y-2">
                    <ShieldAlert className="w-8 h-8 text-slate-350 mx-auto" />
                    <span className="text-xs font-bold text-slate-600 block">
                      Single Sign-On (SSO) is Disabled
                    </span>
                    <p className="text-[10px] text-slate-400 font-mono max-w-sm mx-auto leading-relaxed">
                      Toggle the switch on the top right to enable SAML 2.0 /
                      OIDC integrations. When disabled, all users must log in
                      via credentials stored securely in the database.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SUB-VIEW 5: ROLE SIMULATION */}
          {activeSubTab === "simulation" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <PlayCircle className="w-5 h-5 text-indigo-500" />
                      Access Control Simulator
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Impersonate a role to verify real-time permission
                      boundaries across the application modules.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsImpactModalOpen(true)}
                      className="bg-slate-900 text-white hover:bg-slate-800 transition-colors py-1.5 px-3 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Impact Preview
                    </button>
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">
                      Simulate As:
                    </label>
                    <select
                      value={simulatedRole}
                      onChange={(e) =>
                        setSimulatedRole(e.target.value as ExtendedRole)
                      }
                      className="bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
                    >
                      {availableRoles.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {PERMISSIONS.map((permission, idx) => {
                    const isGranted =
                      permissionMatrix[simulatedRole]?.[permission] || false;

                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border transition-all ${isGranted ? "bg-white border-slate-200 shadow-xs" : "bg-slate-50/50 border-slate-200/50 grayscale opacity-70"}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <span
                            className={`text-[10px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded ${isGranted ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}
                          >
                            {isGranted ? "Allowed" : "Restricted"}
                          </span>
                          {isGranted ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Lock className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <div className="text-xs font-bold text-slate-800 mb-1">
                          {permission}
                        </div>

                        {/* Simulated Component Mock */}
                        <div className="mt-4 border-t border-slate-100 pt-3">
                          <button
                            disabled={!isGranted}
                            className={`w-full py-2 px-3 rounded-md text-[11px] font-bold uppercase transition-all ${
                              isGranted
                                ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 cursor-pointer"
                                : "bg-slate-100 text-slate-400 cursor-not-allowed"
                            }`}
                          >
                            {isGranted
                              ? `Execute: ${permission}`
                              : "Access Denied"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-start gap-3">
                  <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-indigo-900 mb-1">
                      Live RBAC Engine Enforcement
                    </h4>
                    <p className="text-[11px] text-indigo-700/80 leading-relaxed">
                      The visual changes demonstrated above map 1:1 to the
                      actual permission checks performed by the EDIMP pipeline
                      endpoints and rendering engines when a user with the{" "}
                      <span className="font-bold">{simulatedRole}</span> role
                      attempts to access these specific protected features.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Access Change History Sidebar */}
        <div className="w-full xl:w-80 shrink-0 xl:sticky xl:top-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs h-auto max-h-[800px] flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                Access Change History
              </h3>
              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                {accessLogs.length} Records
              </span>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-4 max-h-[600px]">
              {accessLogs.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-medium">
                    No recent access changes.
                  </p>
                </div>
              ) : (
                accessLogs.map((log) => (
                  <div
                    key={log.id}
                    className="relative pl-4 border-l-2 border-indigo-100 pb-4 last:pb-0"
                  >
                    <div className="absolute w-2.5 h-2.5 bg-indigo-500 rounded-full -left-[5.5px] top-1 ring-4 ring-white" />
                    <div className="text-[10px] font-mono text-slate-400 mb-1">
                      {new Date(log.timestamp).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </div>
                    <div className="text-xs font-bold text-slate-800 mb-0.5">
                      {log.action}
                    </div>
                    <div className="text-[11px] text-slate-600 mb-1">
                      Target:{" "}
                      <span className="font-mono text-slate-800 bg-slate-100 px-1 rounded">
                        {log.targetUser}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 mb-2 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
                      {log.details}
                    </div>
                    <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-100">
                      <User className="w-3 h-3 text-slate-400" />
                      <span className="text-[10px] text-slate-500">
                        By {log.adminIdentity}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: CREATE USER FORM */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 max-w-md w-full space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wide block">
                Provision New Workspace User
              </span>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleCreateUser}
              className="space-y-4 text-xs font-medium text-slate-700"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label
                    htmlFor="create-first-name"
                    className="text-[10px] font-black text-slate-500 uppercase tracking-wider block"
                  >
                    First Name *
                  </label>
                  <input
                    id="create-first-name"
                    type="text"
                    required
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    placeholder="Jane"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs outline-none focus:ring-2 focus:ring-indigo-500/40 text-slate-800 font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="create-last-name"
                    className="text-[10px] font-black text-slate-500 uppercase tracking-wider block"
                  >
                    Last Name *
                  </label>
                  <input
                    id="create-last-name"
                    type="text"
                    required
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    placeholder="Doe"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs outline-none focus:ring-2 focus:ring-indigo-500/40 text-slate-800 font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="create-email"
                  className="text-[10px] font-black text-slate-500 uppercase tracking-wider block"
                >
                  Corporate Email Address *
                </label>
                <input
                  id="create-email"
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="jane.doe@enterprise.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs outline-none focus:ring-2 focus:ring-indigo-500/40 text-slate-800 font-mono font-bold"
                />
              </div>

              {/* Generated Credentials Preview Card */}
              <div className="p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-indigo-900 tracking-wider flex items-center gap-1.5 font-mono">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Auto-Generated User Credentials
                  </span>
                  <button
                    type="button"
                    onClick={() => setNewTempPassword(generateSecurePassword())}
                    className="text-[9px] font-mono font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 cursor-pointer"
                    title="Generate fresh password"
                  >
                    <RefreshCw className="w-2.5 h-2.5" /> Regenerate Password
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[9px] text-indigo-600/80 font-mono font-bold block">Generated Username</span>
                    <span className="font-mono font-black text-indigo-950 bg-white/80 px-2 py-1 rounded border border-indigo-200 block truncate">
                      @{newUsername || generateSystemUsername(newFirstName, newLastName, newEmail)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-indigo-600/80 font-mono font-bold block">Temporary Password</span>
                    <span className="font-mono font-black text-indigo-950 bg-white/80 px-2 py-1 rounded border border-indigo-200 block truncate">
                      {newTempPassword || generateSecurePassword()}
                    </span>
                  </div>
                </div>
                <p className="text-[9px] text-indigo-700 font-mono leading-normal">
                  Super Admin will be presented with a copy/share credentials modal upon creation.
                </p>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="create-role-select"
                  className="text-[10px] font-black text-slate-500 uppercase tracking-wider block"
                >
                  Assigned Security Role *
                </label>
                <select
                  id="create-role-select"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as ExtendedRole)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs outline-none cursor-pointer text-slate-700 font-bold"
                >
                  {availableRoles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <p className="text-[9px] text-slate-400 leading-normal font-mono">
                  {ROLE_DESCRIPTIONS[newRole]?.desc}
                </p>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-100">
                {/* Temporary User Account Switch */}
                <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-amber-950 block text-xs flex items-center gap-1.5">
                        <Timer className="w-3.5 h-3.5 text-amber-600" />
                        Temporary Account Expiration
                      </span>
                      <span className="text-[9px] font-mono text-amber-800/80">
                        Auto-expires access after a preset time duration
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNewIsTemporary(!newIsTemporary)}
                      className={`w-8 h-4 rounded-full p-0.5 transition-colors cursor-pointer ${newIsTemporary ? "bg-amber-600" : "bg-slate-200"}`}
                    >
                      <div
                        className={`w-3 h-3 rounded-full bg-white transition-transform ${newIsTemporary ? "translate-x-4" : "translate-x-0"}`}
                      />
                    </button>
                  </div>

                  {newIsTemporary && (
                    <div className="space-y-2 pt-1 border-t border-amber-200/50">
                      <label className="text-[10px] font-black text-amber-900 uppercase tracking-wider block">
                        Expiration Duration *
                      </label>
                      <div className="grid grid-cols-5 gap-1">
                        {(["6h", "1d", "1w", "1m", "custom"] as ExpirationPreset[]).map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setNewExpirationPreset(preset)}
                            className={`py-1 px-1.5 text-[9px] font-mono font-bold uppercase rounded-lg border transition-all cursor-pointer text-center ${
                              newExpirationPreset === preset
                                ? "bg-amber-600 text-white border-amber-700 shadow-2xs"
                                : "bg-white text-slate-700 border-amber-200 hover:bg-amber-100/50"
                            }`}
                          >
                            {preset === "6h" ? "6 hrs" : preset === "1d" ? "1 day" : preset === "1w" ? "1 wk" : preset === "1m" ? "1 mo" : "Custom"}
                          </button>
                        ))}
                      </div>

                      {newExpirationPreset === "custom" && (
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="number"
                            min={1}
                            max={365}
                            value={newCustomDays}
                            onChange={(e) => setNewCustomDays(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-20 bg-white border border-amber-300 rounded-lg py-1 px-2 text-xs font-mono font-bold text-slate-800"
                          />
                          <span className="text-[10px] font-mono text-amber-900 font-bold">Days until expiration</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">
                      Force Multi-Factor Authentication (MFA)
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">
                      Forces setup on next logging session
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewMfa(!newMfa)}
                    className={`w-8 h-4 rounded-full p-0.5 transition-colors cursor-pointer ${newMfa ? "bg-indigo-600" : "bg-slate-200"}`}
                  >
                    <div
                      className={`w-3 h-3 rounded-full bg-white transition-transform ${newMfa ? "translate-x-4" : "translate-x-0"}`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">
                      Enable Federated SSO Authentication
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">
                      Bypasses internal cryptographic logins
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewSso(!newSso)}
                    className={`w-8 h-4 rounded-full p-0.5 transition-colors cursor-pointer ${newSso ? "bg-indigo-600" : "bg-slate-200"}`}
                  >
                    <div
                      className={`w-3 h-3 rounded-full bg-white transition-transform ${newSso ? "translate-x-4" : "translate-x-0"}`}
                    />
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-xs rounded-lg cursor-pointer transition-colors"
                >
                  Create Identity
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold uppercase text-xs rounded-lg cursor-pointer transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: INVITE USER FORM */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 max-w-md w-full space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wide block">
                Invite Enterprise User
              </span>
              <button
                onClick={() => {
                  setIsInviteModalOpen(false);
                  setLatestInvitationLink(null);
                }}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleInviteUser}
              className="space-y-4 text-xs font-medium text-slate-700"
            >
              <div className="space-y-1.5">
                <label
                  htmlFor="invite-email-input"
                  className="text-[10px] font-black text-slate-500 uppercase tracking-wider block"
                >
                  Recipient Corporate Email *
                </label>
                <input
                  id="invite-email-input"
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="collaborator@partner-corp.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs outline-none focus:ring-2 focus:ring-indigo-500/40 text-slate-800 font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label
                    htmlFor="invite-role-select"
                    className="text-[10px] font-black text-slate-500 uppercase tracking-wider block"
                  >
                    Invited Role *
                  </label>
                  <select
                    id="invite-role-select"
                    value={inviteRole}
                    onChange={(e) =>
                      setInviteRole(e.target.value as ExtendedRole)
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs outline-none cursor-pointer text-slate-700 font-bold"
                  >
                    {availableRoles.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="invite-expiry-select"
                    className="text-[10px] font-black text-slate-500 uppercase tracking-wider block"
                  >
                    Token Expiration *
                  </label>
                  <select
                    id="invite-expiry-select"
                    value={inviteExpiry}
                    onChange={(e) => setInviteExpiry(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs outline-none cursor-pointer text-slate-700 font-bold"
                  >
                    <option value="24 hours">24 Hours</option>
                    <option value="7 days">7 Days</option>
                    <option value="30 days">30 Days</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="invite-message-area"
                  className="text-[10px] font-black text-slate-500 uppercase tracking-wider block"
                >
                  Custom Enrollment Message
                </label>
                <textarea
                  id="invite-message-area"
                  rows={2}
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-xs outline-none focus:ring-2 focus:ring-indigo-500/40 text-slate-800 font-medium"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-xs rounded-lg cursor-pointer transition-colors text-center"
              >
                Dispatch Invitation
              </button>

              {/* Invitation link simulated feedback */}
              {latestInvitationLink && (
                <div className="bg-slate-50 border border-indigo-100 rounded-xl p-3.5 space-y-2 animate-in fade-in duration-200 font-mono text-[10px]">
                  <span className="font-extrabold uppercase text-slate-500 block">
                    SIMULATED INBOX PAYLOAD (LINK GENERATED):
                  </span>
                  <div className="bg-white border border-slate-200 p-2 rounded-md break-all font-mono text-[9px] text-slate-600 select-all select-none">
                    {latestInvitationLink}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(latestInvitationLink);
                        showToast("Secure sign-up link copied to clipboard.");
                      }}
                      className="flex-1 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[9px] font-bold uppercase transition-colors cursor-pointer text-slate-700"
                    >
                      Copy Link
                    </button>
                    <a
                      href={latestInvitationLink}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-150 rounded text-[9px] font-bold uppercase text-center transition-all"
                    >
                      Test Flow Link
                    </a>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EDIT USER FORM */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 max-w-md w-full space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wide block">
                Edit User Security Profile
              </span>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleEditUser}
              className="space-y-4 text-xs font-medium text-slate-700"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label
                    htmlFor="edit-first-name"
                    className="text-[10px] font-black text-slate-500 uppercase tracking-wider block"
                  >
                    First Name *
                  </label>
                  <input
                    id="edit-first-name"
                    type="text"
                    required
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs outline-none focus:ring-2 focus:ring-indigo-500/40 text-slate-800 font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="edit-last-name"
                    className="text-[10px] font-black text-slate-500 uppercase tracking-wider block"
                  >
                    Last Name *
                  </label>
                  <input
                    id="edit-last-name"
                    type="text"
                    required
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs outline-none focus:ring-2 focus:ring-indigo-500/40 text-slate-800 font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="edit-email"
                  className="text-[10px] font-black text-slate-500 uppercase tracking-wider block"
                >
                  Corporate Email Address *
                </label>
                <input
                  id="edit-email"
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs outline-none focus:ring-2 focus:ring-indigo-500/40 text-slate-800 font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label
                    htmlFor="edit-role-select"
                    className="text-[10px] font-black text-slate-500 uppercase tracking-wider block"
                  >
                    Assigned Role
                  </label>
                  <select
                    id="edit-role-select"
                    value={editRole}
                    onChange={(e) =>
                      setEditRole(e.target.value as ExtendedRole)
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs outline-none cursor-pointer text-slate-700 font-bold"
                  >
                    {availableRoles.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="edit-status-select"
                    className="text-[10px] font-black text-slate-500 uppercase tracking-wider block"
                  >
                    Access Status
                  </label>
                  <select
                    id="edit-status-select"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs outline-none cursor-pointer text-slate-700 font-bold"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Pending">Pending Invite</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">
                      MFA Enrollment Active
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">
                      User must login via multi-factor authentication
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditMfa(!editMfa)}
                    className={`w-8 h-4 rounded-full p-0.5 transition-colors cursor-pointer ${editMfa ? "bg-indigo-600" : "bg-slate-200"}`}
                  >
                    <div
                      className={`w-3 h-3 rounded-full bg-white transition-transform ${editMfa ? "translate-x-4" : "translate-x-0"}`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">
                      Single Sign-On Federated
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">
                      Authenticates through Azure AD / Microsoft Entra ID
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditSso(!editSso)}
                    className={`w-8 h-4 rounded-full p-0.5 transition-colors cursor-pointer ${editSso ? "bg-indigo-600" : "bg-slate-200"}`}
                  >
                    <div
                      className={`w-3 h-3 rounded-full bg-white transition-transform ${editSso ? "translate-x-4" : "translate-x-0"}`}
                    />
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-xs rounded-lg cursor-pointer transition-colors"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold uppercase text-xs rounded-lg cursor-pointer transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: EXTEND TEMPORARY EXPIRATION */}
      {isExtendModalOpen && userToExtend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 max-w-md w-full space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
                <Hourglass className="w-4 h-4 text-amber-600" />
                Manage Temporary Access Expiration
              </span>
              <button
                onClick={() => setIsExtendModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1">
              <div className="font-bold text-slate-900 text-xs">
                {userToExtend.firstName} {userToExtend.lastName} ({userToExtend.role})
              </div>
              <div className="text-[10px] font-mono text-slate-500">
                {userToExtend.email}
              </div>
              <div className="text-[10px] font-mono pt-1 text-slate-600">
                Current Status:{" "}
                <span className="font-bold text-slate-900">
                  {getUserEffectiveStatus(userToExtend)}
                </span>{" "}
                • {formatExpirationDetails(userToExtend.expiresAt).fullFormatted}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                Select Expiration Extension Window
              </label>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { preset: "6h", label: "+6 Hours" },
                  { preset: "1d", label: "+1 Day" },
                  { preset: "1w", label: "+1 Week" },
                  { preset: "1m", label: "+1 Month" },
                ].map(({ preset, label }) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleExtendExpiration(preset as ExpirationPreset)}
                    className="py-2.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl font-bold text-xs flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <span>{label}</span>
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleExtendExpiration("permanent")}
                  className="w-full py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Convert to Permanent Account (No Expiration)
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsExtendModalOpen(false)}
                className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold uppercase text-xs rounded-lg cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: IMPACT PREVIEW */}
      {isImpactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 max-w-2xl w-full max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4 shrink-0">
              <span className="text-sm font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
                <Eye className="w-5 h-5 text-indigo-500" />
                Impact Preview: {simulatedRole}
              </span>
              <button
                onClick={() => setIsImpactModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-6">
              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-start gap-3">
                <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-indigo-700/80 leading-relaxed">
                  This preview shows all system features and navigation tabs that will be <span className="font-bold uppercase">hidden</span> or <span className="font-bold uppercase">disabled</span> for the <span className="font-bold">{simulatedRole}</span> role based on the current configuration.
                </p>
              </div>

              <div>
                <h4 className="text-xs font-black uppercase text-slate-800 mb-3 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-rose-500" />
                  Restricted Features
                </h4>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  {(() => {
                    const disabledPermissions = PERMISSIONS.filter(p => !permissionMatrix[simulatedRole]?.[p]);
                    if (disabledPermissions.length === 0) {
                      return <p className="text-xs font-medium text-slate-500 italic">No features are restricted.</p>;
                    }
                    return (
                      <div className="flex flex-wrap gap-2">
                        {disabledPermissions.map(p => (
                          <span key={p} className="px-2 py-1 bg-white border border-rose-200 text-rose-700 rounded-md text-[10px] font-bold font-mono tracking-wide uppercase">
                            {p}
                          </span>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-black uppercase text-slate-800 mb-3 flex items-center gap-2">
                  <EyeOff className="w-4 h-4 text-amber-500" />
                  Hidden Navigation Tabs
                </h4>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  {(() => {
                    const hiddenTabs = menuGroups.flatMap(g => g.items).filter(item => !isRoleAllowed(item.permissions, simulatedRole as UserRole));
                    if (hiddenTabs.length === 0) {
                      return <p className="text-xs font-medium text-slate-500 italic">No tabs are hidden.</p>;
                    }
                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {hiddenTabs.map(tab => (
                          <div key={tab.id} className="flex items-center gap-2 bg-white border border-slate-200 p-2 rounded-lg opacity-70">
                            <tab.icon className="w-4 h-4 text-slate-400" />
                            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">{tab.label}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SHARE USER CREDENTIALS */}
      {isCredentialsModalOpen && selectedCredentialsUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 max-w-lg w-full space-y-4 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-indigo-600" />
                Share User Credentials & Access Payload
              </span>
              <button
                onClick={() => setIsCredentialsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target User Banner */}
            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span>{selectedCredentialsUser.firstName} {selectedCredentialsUser.lastName}</span>
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[9px] font-mono font-bold rounded">
                    {selectedCredentialsUser.role}
                  </span>
                </div>
                <div className="text-xs font-mono text-slate-500">{selectedCredentialsUser.email}</div>
              </div>
              <div className="text-right font-mono text-[10px]">
                {selectedCredentialsUser.isTemporary && selectedCredentialsUser.expiresAt ? (
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded font-bold">
                    Temp ({formatExpirationDetails(selectedCredentialsUser.expiresAt).statusBadge})
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded font-bold">
                    Permanent Access
                  </span>
                )}
              </div>
            </div>

            {/* Credentials Fields */}
            <div className="space-y-3">
              {/* System Username */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                  Assigned System Username *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-mono text-xs text-indigo-600 font-bold">@</span>
                  <input
                    type="text"
                    value={credentialsUsername}
                    onChange={(e) => setCredentialsUsername(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-7 pr-3 text-xs font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>
              </div>

              {/* Temporary Password */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                    Generated Temporary Password *
                  </label>
                  <button
                    type="button"
                    onClick={handleRegeneratePasswordInModal}
                    className="text-[10px] font-mono font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Regenerate Password
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPasswordInModal ? "text" : "password"}
                    value={credentialsPassword}
                    onChange={(e) => setCredentialsPassword(e.target.value)}
                    className="w-full bg-indigo-50/50 border border-indigo-200 rounded-lg py-2 pl-3 pr-10 text-xs font-mono font-black text-indigo-950 outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordInModal(!showPasswordInModal)}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showPasswordInModal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Structured Copy Payload Terminal Box */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block flex items-center justify-between">
                <span>Formatted Access Payload for Sharing</span>
                <span className="text-slate-400 font-normal">Ready for Slack / Email / Teams</span>
              </label>
              <div className="bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-[10px] space-y-1 leading-relaxed border border-slate-800 relative select-all">
                <div className="text-amber-400 font-bold">ENTERPRISE MIGRATION STUDIO - USER ACCESS CREDENTIALS</div>
                <div>User: <span className="text-white font-bold">{selectedCredentialsUser.firstName} {selectedCredentialsUser.lastName}</span></div>
                <div>Email: <span className="text-white">{selectedCredentialsUser.email}</span></div>
                <div>System Username: <span className="text-emerald-400 font-bold">@{credentialsUsername}</span></div>
                <div>Temporary Password: <span className="text-indigo-300 font-bold">{credentialsPassword}</span></div>
                <div>Security Role: <span className="text-slate-300">{selectedCredentialsUser.role}</span></div>
                <div>Access Policy: <span className="text-amber-300">{selectedCredentialsUser.isTemporary && selectedCredentialsUser.expiresAt ? formatExpirationDetails(selectedCredentialsUser.expiresAt).fullFormatted : 'Permanent Access'}</span></div>
                <div className="pt-1 text-slate-400">Portal Login URL: <span className="text-sky-300 underline">{window.location.origin || 'https://ais-pre-7qswlcoicd6wixwwrjtf25-82286736551.europe-west3.run.app'}</span></div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCopyCredentialsPayload}
                className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2"
              >
                {copiedCredentials ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    Copied to Clipboard!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Credentials Summary
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSimulateSendEmail}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5 text-indigo-400" />
                Dispatch Email
              </button>

              <button
                type="button"
                onClick={() => setIsCredentialsModalOpen(false)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold uppercase text-xs rounded-xl cursor-pointer transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
