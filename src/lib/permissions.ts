import {
  UserRound,
  Briefcase,
  Sparkles,
  BadgeCheck,
  Landmark,
  Clock,
  type LucideIcon,
} from 'lucide-react';
import type { Capability, Role, RoleProfile, User } from './types';
import { ROLE_AUDIENCE } from './types';

/* ==================================================================
   Ch.05 — Role-aware experiences
   ------------------------------------------------------------------
   Six roles, one product. The trick to not splintering into six apps is
   that roles do NOT get different screens — they get the same screens
   with different capabilities. Navigation is filtered from one list,
   and every restricted control still renders, disabled, with the reason
   attached. A permission you cannot see teaches you nothing; a
   permission you can see but not use teaches you how the firm works.
   ================================================================== */

export const ROLES: Record<Role, RoleProfile & { icon: LucideIcon; accent: string }> = {
  individual: {
    role: 'individual',
    label: 'Individual client',
    blurb: 'Files a personal return. Sees only their own return, in plain English.',
    audience: 'client',
    capabilities: ['view_return'],
    icon: UserRound,
    accent: 'bg-brand-600',
  },
  business_owner: {
    role: 'business_owner',
    label: 'Business owner',
    blurb: 'Files personally and for an entity. Needs to move between the two.',
    audience: 'client',
    capabilities: ['view_return'],
    icon: Briefcase,
    accent: 'bg-brand-700',
  },
  preparer: {
    role: 'preparer',
    label: 'Tax concierge',
    blurb:
      'Owns the client relationship. Gathers facts, runs the AI workflow, reviews its explanations, escalates what needs a credential.',
    audience: 'firm',
    capabilities: ['view_return', 'view_internal_notes', 'edit_field', 'verify_field'],
    icon: Sparkles,
    accent: 'bg-ai-600',
  },
  reviewer: {
    role: 'reviewer',
    label: 'Credentialed reviewer',
    blurb: 'CPA or EA. The only role that can approve positions and file.',
    audience: 'firm',
    capabilities: [
      'view_return',
      'view_internal_notes',
      'edit_field',
      'verify_field',
      'approve_return',
      'file_return',
      'view_all_returns',
    ],
    icon: BadgeCheck,
    accent: 'bg-info-600',
  },
  admin: {
    role: 'admin',
    label: 'Firm administrator',
    blurb: 'Runs the practice. Sees every return and the money, but does not touch tax figures.',
    audience: 'firm',
    capabilities: ['view_return', 'view_all_returns', 'manage_staff', 'view_fees'],
    icon: Landmark,
    accent: 'bg-ink-700',
  },
  seasonal: {
    role: 'seasonal',
    label: 'Seasonal staff',
    blurb:
      'Temporary capacity during filing season. Can prepare, but deliberately cannot verify, approve or see internal strategy notes.',
    audience: 'firm',
    capabilities: ['view_return', 'edit_field'],
    icon: Clock,
    accent: 'bg-ink-500',
  },
};

export const ROLE_ORDER: Role[] = [
  'individual',
  'business_owner',
  'preparer',
  'reviewer',
  'admin',
  'seasonal',
];

export function can(role: Role, capability: Capability): boolean {
  return ROLES[role].capabilities.includes(capability);
}

export function audienceOf(role: Role) {
  return ROLE_AUDIENCE[role];
}

export function isFirm(role: Role) {
  return ROLE_AUDIENCE[role] === 'firm';
}

/**
 * Why a capability is unavailable. Every disabled control in the product
 * pulls its tooltip from here — a restriction should always be able to
 * explain itself, and explain it the same way everywhere.
 */
const DENIAL_REASONS: Partial<Record<Capability, Partial<Record<Role, string>>>> = {
  verify_field: {
    seasonal:
      'Verifying a figure is a sign-off. Seasonal staff can prepare and edit, but a permanent team member has to confirm.',
    individual: 'Only your preparer verifies figures against source documents.',
    business_owner: 'Only your preparer verifies figures against source documents.',
    admin: 'Administrators manage the practice, not the tax figures on a return.',
  },
  approve_return: {
    preparer:
      'Approval requires an active CPA or EA credential. Send it to your reviewer instead — one click, keeps your notes attached.',
    seasonal: 'Approval requires an active CPA or EA credential.',
    admin: 'Approval requires an active CPA or EA credential.',
    individual: 'Your CPA approves the tax positions; you approve the finished return for filing.',
    business_owner:
      'Your CPA approves the tax positions; you approve the finished return for filing.',
  },
  view_internal_notes: {
    seasonal: 'Internal strategy notes are limited to permanent staff.',
    individual: 'These are your firm’s working notes.',
    business_owner: 'These are your firm’s working notes.',
    admin: 'Internal tax notes are limited to the engagement team.',
  },
  view_fees: {
    preparer: 'Billing is handled by the firm administrator.',
    reviewer: 'Billing is handled by the firm administrator.',
    seasonal: 'Billing is handled by the firm administrator.',
  },
  edit_field: {
    individual: 'Your preparer maintains the figures. Reply in the thread to request a change.',
    business_owner:
      'Your preparer maintains the figures. Reply in the thread to request a change.',
    admin: 'Administrators do not edit tax figures.',
  },
};

export function denialReason(role: Role, capability: Capability): string {
  return (
    DENIAL_REASONS[capability]?.[role] ??
    `Your role (${ROLES[role].label}) does not include this permission.`
  );
}

/**
 * Ch.05 — communicating permissions. The same nine capabilities, described in
 * plain language and in a fixed order, so "who can do what" reads the same on
 * the sign-in screen, in the access panel, and in every denial tooltip. One
 * catalog means the story never contradicts itself across the product.
 */
export const CAPABILITY_CATALOG: Array<{ capability: Capability; label: string }> = [
  { capability: 'view_return', label: 'See a return' },
  { capability: 'view_all_returns', label: 'See every return in the firm' },
  { capability: 'edit_field', label: 'Edit figures on a return' },
  { capability: 'verify_field', label: 'Verify a figure as checked' },
  { capability: 'approve_return', label: 'Approve the tax positions' },
  { capability: 'file_return', label: 'File the return with the IRS' },
  { capability: 'view_internal_notes', label: 'Read internal firm notes' },
  { capability: 'view_fees', label: 'See billing and fees' },
  { capability: 'manage_staff', label: 'Manage staff' },
];

export interface AccessLine {
  capability: Capability;
  label: string;
  granted: boolean;
  /** Present only when denied — the same wording used on disabled controls. */
  reason?: string;
}

/** What a given role can and cannot do, with a reason attached to every "no". */
export function accessSummary(role: Role): AccessLine[] {
  return CAPABILITY_CATALOG.map(({ capability, label }) => {
    const granted = can(role, capability);
    return {
      capability,
      label,
      granted,
      reason: granted ? undefined : denialReason(role, capability),
    };
  });
}

/**
 * Ch.05's stated edge case: a firm employee who also has a personal return
 * in the system. We do not model that as a second account — the same user
 * simply holds a client role alongside their staff role, and switching to
 * it swaps the entire shell. Keeping it one identity is what stops the
 * product splintering.
 */
export function personalReturnRole(user: User): Role | null {
  if (!user.personalReturnId) return null;
  return user.roles.find((r) => ROLE_AUDIENCE[r] === 'client') ?? null;
}
