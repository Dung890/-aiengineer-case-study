import type { User } from '../types';

/**
 * A small, fixed cast. Every permission decision, message author and
 * assignment in the prototype resolves to one of these people.
 */
export const USERS: User[] = [
  /* ---------------- Clients ---------------- */
  {
    id: 'u-marcus',
    name: 'Marcus Delgado',
    initials: 'MD',
    email: 'marcus@delgadostudio.com',
    roles: ['business_owner', 'individual'],
    title: 'Founder, Delgado Studio Inc.',
    credential: null,
  },
  {
    id: 'u-priya',
    name: 'Priya Raghunathan',
    initials: 'PR',
    email: 'priya.r@example.com',
    roles: ['individual'],
    title: 'Client',
    credential: null,
  },

  /* ---------------- Firm ---------------- */
  {
    id: 'u-jordan',
    name: 'Jordan Avery',
    initials: 'JA',
    email: 'jordan.avery@greengrowth.com',
    roles: ['preparer'],
    title: 'AI Tax Concierge',
    credential: null,
  },
  {
    id: 'u-lin',
    name: 'Lin Nakamura',
    initials: 'LN',
    email: 'lin.nakamura@greengrowth.com',
    roles: ['reviewer', 'preparer'],
    title: 'Senior Reviewer',
    credential: 'CPA',
  },
  {
    id: 'u-dana',
    name: 'Dana Whitfield',
    initials: 'DW',
    email: 'dana.whitfield@greengrowth.com',
    roles: ['admin'],
    title: 'Firm Administrator',
    credential: null,
  },
  {
    id: 'u-sam',
    name: 'Sam Okonkwo',
    initials: 'SO',
    email: 'sam.okonkwo@greengrowth.com',
    roles: ['seasonal'],
    title: 'Seasonal Preparer',
    credential: null,
  },

  /**
   * Ch.05's explicit edge case, as one identity rather than two accounts:
   * Rosa is on staff AND is a client of the firm. Switching to her client
   * role swaps the entire shell — same login, same person, different
   * product. See `personalReturnRole()` in lib/permissions.ts.
   */
  {
    id: 'u-rosa',
    name: 'Rosa Iglesias',
    initials: 'RI',
    email: 'rosa.iglesias@greengrowth.com',
    roles: ['preparer', 'individual'],
    title: 'Tax Concierge · also a client',
    personalReturnId: 'ret-rosa-1040',
    credential: null,
  },
];

export const USER_BY_ID: Record<string, User> = Object.fromEntries(
  USERS.map((u) => [u.id, u]),
);

export function userName(id: string) {
  return USER_BY_ID[id]?.name ?? 'Unknown';
}

/** The account the prototype boots into. Jordan is the role the job is for. */
export const DEFAULT_USER_ID = 'u-jordan';

/** The client whose return is the demo's hero. */
export const HERO_CLIENT_ID = 'u-marcus';
export const HERO_RETURN_ID = 'ret-marcus-1040';
