'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RotateCcw, Leaf, UserRound, Building2, LogOut } from 'lucide-react';
import { globalNavFor, isActive, type NavItem } from '@/lib/nav';
import { ROLES } from '@/lib/permissions';
import { useDemo } from '@/lib/store';
import { getTasks, getThreads, getInsights, getClientReturns, HERO_RETURN_ID } from '@/lib/mock';
import { useReturnIdFromPath } from '@/lib/useUrlState';
import type { TaxReturn } from '@/lib/types';
import { cn } from '@/lib/utils';
import { RoleSwitcher } from './RoleSwitcher';
import { AccessPanel } from './AccessPanel';
import { Tooltip } from '@/components/ui/Tooltip';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const role = useDemo((s) => s.activeRole);
  const activeUserId = useDemo((s) => s.activeUserId);
  const resetDemo = useDemo((s) => s.resetDemo);
  const insightStatus = useDemo((s) => s.insightStatus);
  const taskStatus = useDemo((s) => s.taskStatus);

  const audience = ROLES[role].audience;

  /* Ch.05 business-owner case: a client can own more than one return (a
     personal 1040 plus an entity). The sidebar follows whichever return is
     open, and offers a switcher to move between them without leaving the shell
     or changing identity. Firm roles keep the single hero context. */
  const clientReturns = audience === 'client' ? getClientReturns(activeUserId) : [];
  const pathReturnId = useReturnIdFromPath(pathname);
  const navReturnId =
    audience === 'client'
      ? clientReturns.find((r) => r.id === pathReturnId)?.id ??
        clientReturns[0]?.id ??
        HERO_RETURN_ID
      : HERO_RETURN_ID;

  const nav = globalNavFor(role, navReturnId);

  /* Badge counts read live state, so resolving a finding really does
     decrement the number in the sidebar. */
  const tasks = getTasks(navReturnId);
  const counts: Record<NonNullable<NavItem['badgeKey']>, number> = {
    openFindings: getInsights(navReturnId).filter(
      (i) => (insightStatus[i.id] ?? i.status) === 'open',
    ).length,
    unreadMessages: getThreads(navReturnId).filter(
      (t) =>
        (audience === 'firm' || t.visibility === 'shared') &&
        t.nextActionOwner === audience &&
        t.status !== 'resolved',
    ).length,
    myTasks: tasks.filter(
      (t) => t.owner === 'firm' && (taskStatus[t.id] ?? t.status) !== 'done',
    ).length,
    clientTasks: tasks.filter(
      (t) => t.owner === 'client' && (taskStatus[t.id] ?? t.status) !== 'done',
    ).length,
  };

  return (
    <div className="flex h-screen overflow-hidden bg-ink-100">
      {/* ---------------- Sidebar ---------------- */}
      <aside className="flex w-60 shrink-0 flex-col border-r border-ink-200 bg-white">
        <Link
          href="/"
          className="group flex items-center gap-2 px-4 py-4 transition hover:bg-ink-50"
          title="Back to the sign-in / role screen"
        >
          <span className="grid size-7 place-items-center rounded-lg bg-brand-700 text-white">
            <Leaf className="size-4" />
          </span>
          <span className="text-sm font-semibold tracking-tight text-ink-900">
            Green Growth
          </span>
        </Link>

        {clientReturns.length > 1 ? (
          <EntitySwitcher returns={clientReturns} activeId={navReturnId} />
        ) : null}

        <nav className="flex-1 space-y-0.5 px-2.5">
          {nav.map((item) => {
            const active = isActive(pathname, item.href, nav);
            const badge = item.badgeKey ? counts[item.badgeKey] : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition',
                  active
                    ? 'bg-brand-50 font-medium text-brand-800'
                    : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
                )}
              >
                <item.icon
                  className={cn('size-4 shrink-0', active ? 'text-brand-700' : 'text-ink-400')}
                />
                <span className="flex-1 truncate">{item.label}</span>
                {badge > 0 ? (
                  <span
                    className={cn(
                      'grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-semibold',
                      active ? 'bg-brand-700 text-white' : 'bg-ink-200 text-ink-700',
                    )}
                  >
                    {badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        {/* A visible reminder of which lens you're looking through. */}
        <div className="space-y-2 border-t border-ink-200 p-2.5">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-[11px] text-ink-400">
              {audience === 'firm' ? 'Firm view' : 'Client view'}
            </span>
            <Tooltip content="Reset every edit, resolved finding and reply back to the starting state.">
              <button
                onClick={resetDemo}
                className="inline-flex items-center gap-1 rounded px-1 py-0.5 text-[11px] text-ink-400 transition hover:text-ink-700"
              >
                <RotateCcw className="size-3" />
                Reset
              </button>
            </Tooltip>
          </div>
          <AccessPanel />
          <RoleSwitcher />
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] font-medium text-ink-500 transition hover:bg-ink-100 hover:text-ink-800"
          >
            <LogOut className="size-3.5 shrink-0 text-ink-400" />
            Exit to sign-in
          </Link>
        </div>
      </aside>

      {/* ---------------- Main ---------------- */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  );
}

/**
 * Ch.05 — moving between a personal return and an entity return. Not a role
 * switch (you are the same client, with the same permissions); just a change of
 * which of *your* filings you're looking at. Shown only when a client actually
 * has more than one.
 */
function EntitySwitcher({ returns, activeId }: { returns: TaxReturn[]; activeId: string }) {
  return (
    <div className="mx-2.5 mb-2 rounded-lg border border-ink-200 bg-ink-50 p-1.5">
      <p className="px-1.5 pb-1 pt-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink-400">
        Your filings
      </p>
      <div className="space-y-0.5">
        {returns.map((r) => {
          const personal = r.formType === '1040';
          const Icon = personal ? UserRound : Building2;
          const active = r.id === activeId;
          return (
            <Link
              key={r.id}
              href={`/returns/${r.id}`}
              className={cn(
                'flex items-center gap-2 rounded-md px-1.5 py-1.5 transition',
                active ? 'bg-white shadow-panel' : 'hover:bg-white/60',
              )}
            >
              <span
                className={cn(
                  'grid size-6 shrink-0 place-items-center rounded-md',
                  active ? 'bg-brand-700 text-white' : 'bg-ink-200 text-ink-500',
                )}
              >
                <Icon className="size-3.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    'block truncate text-xs font-medium',
                    active ? 'text-ink-900' : 'text-ink-700',
                  )}
                >
                  {r.clientName}
                </span>
                <span className="block truncate text-[10px] text-ink-400">
                  {personal ? 'Personal' : 'Business'} · {r.formType}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
