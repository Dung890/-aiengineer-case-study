'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Zap } from 'lucide-react';
import { getReturns, USER_BY_ID } from '@/lib/mock';
import { buildQueueView, practiceStats, type RankedReturn, type StatFilter } from '@/lib/ranking';
import type { TaxReturn } from '@/lib/types';
import { useDemo } from '@/lib/store';
import { can } from '@/lib/permissions';
import { STAGES } from '@/lib/stages';
import { cn, dueLabel, pluralize } from '@/lib/utils';
import { Badge, Button, Card, SectionLabel } from '@/components/ui/primitives';
import { PageHeader } from '@/components/shell/PageHeader';

export default function DashboardPage() {
  const role = useDemo((s) => s.activeRole);
  const userId = useDemo((s) => s.activeUserId);
  const user = USER_BY_ID[userId]!;

  const seesEverything = can(role, 'view_all_returns');
  const [scope, setScope] = useState<'mine' | 'firm'>(seesEverything ? 'firm' : 'mine');

  const returns = getReturns();
  const view = useMemo(
    () => buildQueueView(returns, scope === 'mine' ? userId : undefined),
    [returns, scope, userId],
  );
  const stats = useMemo(
    () => practiceStats(scope === 'mine' ? returns.filter((r) => r.preparerId === userId) : returns),
    [returns, scope, userId],
  );

  const top = view.act[0];

  // Each KPI is a doorway, not a readout: the number answers "how many", and
  // clicking routes to the exact filtered list behind it. Counts come straight
  // from the queue split and the practice roll-up, so a tile and the list it
  // opens are computed from the same predicates.
  const kpis: Array<{
    label: string;
    value: number;
    filter: StatFilter;
    tone: StatTone;
  }> = [
    { label: 'To do', value: view.act.length, filter: 'actionable', tone: 'brand' },
    { label: 'Waiting on clients', value: view.chase.length, filter: 'waiting', tone: 'neutral' },
    {
      label: 'Deadline within 3 weeks',
      value: stats.atRisk,
      filter: 'at-risk',
      tone: stats.atRisk > 0 ? 'caution' : 'neutral',
    },
    {
      label: 'Blocked on clients',
      value: stats.blockedOnClient,
      filter: 'blocked-client',
      tone: stats.blockedOnClient > 0 ? 'danger' : 'neutral',
    },
    { label: 'Open AI findings', value: stats.openFindings, filter: 'ai', tone: 'ai' },
    { label: 'In review', value: stats.awaitingReview, filter: 'in-review', tone: 'neutral' },
    { label: 'Active returns', value: stats.active, filter: 'active', tone: 'neutral' },
    { label: 'Filed', value: stats.filed, filter: 'filed', tone: 'positive' },
  ];

  return (
    <>
      <PageHeader
        title={`Good morning, ${user.name.split(' ')[0]}`}
        subtitle={
          view.act.length
            ? `${pluralize(view.act.length, 'return')} you can move forward today · ${view.chase.length} waiting on clients`
            : 'Nothing is waiting on you right now.'
        }
        actions={
          seesEverything ? (
            <div className="flex rounded-lg border border-ink-300 bg-white p-0.5">
              {(['mine', 'firm'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setScope(s)}
                  className={cn(
                    'rounded-md px-3 py-1 text-xs font-medium transition',
                    scope === s
                      ? 'bg-brand-700 text-white'
                      : 'text-ink-600 hover:text-ink-900',
                  )}
                >
                  {s === 'mine' ? 'My returns' : 'Whole firm'}
                </button>
              ))}
            </div>
          ) : null
        }
      />

      <div className="scrollbar-slim flex-1 overflow-y-auto px-6 pb-10">
        <div className="mx-auto max-w-5xl space-y-6">
          {/* ---------- The single next action ---------- */}
          {top ? (
            <section>
              <div className="mb-2 flex items-center gap-2">
                <Zap className="size-4 text-brand-700" />
                <SectionLabel>Start here</SectionLabel>
              </div>
              <TopCard ranked={top} />
            </section>
          ) : null}

          {/* ---------- KPI grid — every tile opens its filtered list ---------- */}
          <section>
            <div className="mb-2 flex items-center justify-between">
              <SectionLabel>Jump to a list</SectionLabel>
              <span className="text-[11px] text-ink-400">Tap a number to see those returns</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {kpis.map((k) => (
                <Stat
                  key={k.filter}
                  label={k.label}
                  value={String(k.value)}
                  tone={k.tone}
                  href={statHref(k.filter, scope)}
                />
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */

/**
 * Where a row takes you. The dashboard's job (Ch.07) is to move someone
 * from a summary straight into the work, so a row deep-links to the
 * screen where its next action actually happens — not a generic
 * overview. Routed by the return's stage, which is also what the
 * next-action label is derived from, so destination and label always
 * agree. Never parses the label text.
 */
function actionFor(ret: TaxReturn): { href: string; verb: string } {
  const base = `/returns/${ret.id}`;
  switch (ret.stage) {
    case 'intake':
      return { href: `${base}/documents`, verb: 'Open documents' };
    case 'questions':
    case 'client_approval':
      return { href: `${base}/messages`, verb: 'Open messages' };
    case 'preparing':
    case 'review':
      return { href: `${base}/review`, verb: 'Open review' };
    default:
      return { href: base, verb: 'Open return' };
  }
}

/** Deep link from a stat tile to the matching, pre-filtered returns list. */
function statHref(filter: StatFilter, scope: 'mine' | 'firm') {
  return `/returns?filter=${filter}&scope=${scope === 'mine' ? 'mine' : 'all'}`;
}

type StatTone = 'neutral' | 'brand' | 'caution' | 'danger' | 'ai' | 'positive';

function Stat({
  label,
  value,
  tone = 'neutral',
  href,
}: {
  label: string;
  value: string;
  tone?: StatTone;
  href?: string;
}) {
  const toneClass: Record<StatTone, string> = {
    neutral: 'text-ink-900',
    brand: 'text-brand-700',
    caution: 'text-caution-700',
    danger: 'text-danger-700',
    ai: 'text-ai-700',
    positive: 'text-positive-700',
  };

  const body = (
    <>
      <div className="flex items-center justify-between">
        <p className={cn('tabular text-2xl font-semibold', toneClass[tone])}>{value}</p>
        {href ? (
          <ArrowRight className="size-4 text-ink-300 transition group-hover:text-brand-700" />
        ) : null}
      </div>
      <p className="mt-0.5 text-[11px] leading-tight text-ink-500">{label}</p>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="group block rounded-card border border-ink-200 bg-white px-4 py-3 shadow-panel transition hover:border-ink-300 hover:shadow-pop"
      >
        {body}
      </Link>
    );
  }

  return <Card className="px-4 py-3">{body}</Card>;
}

function TopCard({ ranked }: { ranked: RankedReturn }) {
  const { ret, reasons } = ranked;
  const due = dueLabel(ret.dueDate);
  const action = actionFor(ret);

  return (
    <Card className="overflow-hidden border-brand-300 ring-1 ring-brand-200">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-ink-900">{ret.clientName}</h3>
            <Badge tone="neutral">{ret.formType}</Badge>
            <Badge tone={due.tone === 'danger' ? 'danger' : due.tone === 'caution' ? 'caution' : 'neutral'}>
              {due.text}
            </Badge>
          </div>

          <p className="mt-2 text-sm font-medium text-ink-800">{ret.nextActionLabel}</p>

          <ul className="mt-3 space-y-1">
            {reasons.slice(0, 3).map((r) => (
              <li key={r.label} className="flex items-start gap-2 text-xs text-ink-600">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-ink-400" />
                {r.label}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex shrink-0 flex-col items-stretch gap-2 sm:w-44">
          <Link href={action.href}>
            <Button variant="primary" className="w-full" icon={ArrowRight}>
              {action.verb}
            </Button>
          </Link>
          <Link href={`/returns/${ret.id}`}>
            <Button variant="secondary" className="w-full">
              Return overview
            </Button>
          </Link>
          <p className="text-center text-[11px] text-ink-500">
            {STAGES[ret.stage].firmLabel} · {pluralize(ret.documentCount, 'document')}
          </p>
        </div>
      </div>
    </Card>
  );
}

