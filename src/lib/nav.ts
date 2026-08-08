import {
  LayoutDashboard,
  FolderOpen,
  MessageSquare,
  ListChecks,
  ScrollText,
  Users,
  Sparkles,
  Banknote,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import type { Role } from './types';
import { HERO_RETURN_ID } from './mock/users';
import { can, isFirm } from './permissions';

/* ==================================================================
   Ch.05 + Ch.04 — one navigation, filtered
   ------------------------------------------------------------------
   There is a single nav definition. Roles do not get bespoke menus;
   they get this list with items removed. That is what stops six roles
   becoming six products — and it means a new screen is available to
   the right people by default instead of being wired up six times.
   ================================================================== */

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Shown as a count badge. Resolved by the shell at render time. */
  badgeKey?: 'openFindings' | 'unreadMessages' | 'myTasks' | 'clientTasks';
}

export function globalNavFor(role: Role, returnId = HERO_RETURN_ID): NavItem[] {
  if (isFirm(role)) {
    const items: NavItem[] = [
      { href: '/dashboard', label: 'My work', icon: LayoutDashboard, badgeKey: 'myTasks' },
      { href: '/returns', label: 'All returns', icon: ScrollText },
    ];
    if (can(role, 'manage_staff')) {
      items.push({ href: '/team', label: 'Team', icon: Users });
    }
    if (can(role, 'view_fees')) {
      items.push({ href: '/billing', label: 'Billing', icon: Banknote });
    }
    return items;
  }

  // Client-side navigation is deliberately tiny. A taxpayer has exactly one
  // return and four things they can do with it; a firm-style queue would be
  // noise.
  return [
    { href: '/account', label: 'Home', icon: UserRound },
    { href: `/returns/${returnId}`, label: 'My return', icon: ScrollText },
    { href: `/returns/${returnId}/tasks`, label: 'To do', icon: ListChecks, badgeKey: 'clientTasks' },
    { href: `/returns/${returnId}/documents`, label: 'Documents', icon: FolderOpen },
    {
      href: `/returns/${returnId}/messages`,
      label: 'Messages',
      icon: MessageSquare,
      badgeKey: 'unreadMessages',
    },
  ];
}

/* ------------------------------------------------------------------ */
/* Within a return                                                     */
/* ------------------------------------------------------------------ */

export function returnTabsFor(role: Role, returnId: string): NavItem[] {
  const base: NavItem[] = [
    { href: `/returns/${returnId}`, label: 'Status', icon: ScrollText },
  ];

  if (isFirm(role)) {
    base.push({
      href: `/returns/${returnId}/review`,
      label: 'Review',
      icon: Sparkles,
      badgeKey: 'openFindings',
    });
  }

  base.push(
    { href: `/returns/${returnId}/documents`, label: 'Documents', icon: FolderOpen },
    {
      href: `/returns/${returnId}/messages`,
      label: 'Messages',
      icon: MessageSquare,
      badgeKey: 'unreadMessages',
    },
    { href: `/returns/${returnId}/tasks`, label: 'Tasks', icon: ListChecks, badgeKey: 'myTasks' },
  );

  return base;
}

/** Longest-prefix match, so `/returns/x/review` highlights Review not Status. */
export function isActive(pathname: string, href: string, items: NavItem[]) {
  const matches = items
    .filter((i) => pathname === i.href || pathname.startsWith(i.href + '/'))
    .sort((a, b) => b.href.length - a.href.length);
  return matches[0]?.href === href;
}
