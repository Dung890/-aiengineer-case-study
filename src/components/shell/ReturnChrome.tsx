'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { TriangleAlert } from 'lucide-react';
import { returnTabsFor, isActive } from '@/lib/nav';
import { ROLES } from '@/lib/permissions';
import { useDemo, useFields } from '@/lib/store';
import { getReturn, getTasks, getThreads, getInsights, HERO_RETURN_ID } from '@/lib/mock';
import { STAGES } from '@/lib/stages';
import { cn, money } from '@/lib/utils';
import { Badge } from '@/components/ui/primitives';
import { PageHeader } from './PageHeader';

/**
 * The persistent frame around every return screen (Ch.04).
 *
 * Identity, stage and the tab bar never move as you go between Review,
 * Documents, Messages and Tasks — so switching context inside a return never
 * feels like leaving it. The breadcrumb above adapts to the audience: a client
 * has one return and no queue to go back to, so showing them "All returns"
 * would be a link to a page they cannot see.
 */
export function ReturnChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useParams<{ id: string }>();
  const role = useDemo((s) => s.activeRole);
  const insightStatus = useDemo((s) => s.insightStatus);
  const taskStatus = useDemo((s) => s.taskStatus);

  const returnId = params.id;
  const ret = getReturn(returnId);
  const audience = ROLES[role].audience;

  // The headline figure has to track live edits. Reading the static record
  // here would leave the header quietly contradicting the return it sits on
  // top of the moment anyone corrects a figure.
  const liveFields = useFields(returnId);
  const liveBalance =
    returnId === HERO_RETURN_ID
      ? -(liveFields.find((f) => f.id === 'fld-balance-due')?.value ?? 0)
      : undefined;

  if (!ret) {
    return (
      <>
        <PageHeader title="Return not found" subtitle={`No return with id ${returnId}.`} />
        <div className="flex-1" />
      </>
    );
  }

  const tabs = returnTabsFor(role, returnId);
  const tasks = getTasks(returnId);
  const counts = {
    openFindings: getInsights(returnId).filter(
      (i) => (insightStatus[i.id] ?? i.status) === 'open',
    ).length,
    unreadMessages: getThreads(returnId).filter(
      (t) =>
        (audience === 'firm' || t.visibility === 'shared') &&
        t.nextActionOwner === audience &&
        t.status !== 'resolved',
    ).length,
    myTasks: tasks.filter(
      (t) => t.owner === audience && (taskStatus[t.id] ?? t.status) !== 'done',
    ).length,
    clientTasks: tasks.filter(
      (t) => t.owner === 'client' && (taskStatus[t.id] ?? t.status) !== 'done',
    ).length,
  };

  const stage = STAGES[ret.stage];
  const blocking = ret.blockers.filter((b) => b.severity === 'blocking');

  return (
    <>
      <PageHeader
        dense
        crumbs={
          audience === 'firm'
            ? [{ label: 'All returns', href: '/returns' }, { label: ret.clientName }]
            : [{ label: `${ret.taxYear} tax return` }]
        }
        title={audience === 'firm' ? ret.clientName : `Your ${ret.taxYear} tax return`}
        subtitle={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>{ret.formType}</span>
            <span className="text-ink-300">·</span>
            <span>{ret.taxYear}</span>
            <span className="text-ink-300">·</span>
            <span>{audience === 'client' ? stage.clientLabel : stage.firmLabel}</span>
            {blocking.length ? (
              <>
                <span className="text-ink-300">·</span>
                <Badge tone="danger" icon={TriangleAlert}>
                  {blocking.length} blocking
                </Badge>
              </>
            ) : null}
          </span>
        }
        actions={(() => {
          const amount = liveBalance ?? ret.refundOrDue;
          return (
            <div className="text-right">
              <p
                className={cn(
                  'tabular text-lg font-semibold',
                  amount >= 0 ? 'text-positive-700' : 'text-ink-900',
                )}
              >
                {money(Math.abs(amount))}
              </p>
              <p className="text-[11px] text-ink-500">
                {amount >= 0 ? 'Estimated refund' : 'Estimated balance due'}
              </p>
            </div>
          );
        })()}
        tabs={
          <nav className="-mb-px flex gap-1 overflow-x-auto">
            {tabs.map((t) => {
              const active = isActive(pathname, t.href, tabs);
              const badge = t.badgeKey ? counts[t.badgeKey] : 0;
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className={cn(
                    'flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm whitespace-nowrap transition',
                    active
                      ? 'border-brand-700 font-medium text-brand-800'
                      : 'border-transparent text-ink-500 hover:border-ink-300 hover:text-ink-800',
                  )}
                >
                  <t.icon className="size-4" />
                  {t.label}
                  {badge > 0 ? (
                    <span
                      className={cn(
                        'grid h-4.5 min-w-4.5 place-items-center rounded-full px-1 text-[10px] font-semibold',
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
        }
      />
      {children}
    </>
  );
}
