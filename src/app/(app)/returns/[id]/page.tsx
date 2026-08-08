'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Check,
  CircleDot,
  TriangleAlert,
  ArrowRight,
  UserRound,
  Building2,
} from 'lucide-react';
import type { Audience, ReturnStage } from '@/lib/types';
import { STAGES, STAGE_ORDER, headlineFor } from '@/lib/stages';
import { getReturn, getTasks, returnSummary, USER_BY_ID } from '@/lib/mock';
import { ROLES, can } from '@/lib/permissions';
import { useDemo } from '@/lib/store';
import { cn, money, relativeTime, dueLabel } from '@/lib/utils';
import { Badge, Button, Card, EmptyState, SectionLabel } from '@/components/ui/primitives';
import { Tooltip } from '@/components/ui/Tooltip';

export default function ReturnStatusPage() {
  const params = useParams<{ id: string }>();
  const returnId = params.id;
  const role = useDemo((s) => s.activeRole);
  const taskStatus = useDemo((s) => s.taskStatus);
  const audience = ROLES[role].audience;

  const ret = getReturn(returnId);
  if (!ret) return <div className="flex-1" />;

  const summary = returnSummary(returnId);
  const tasks = getTasks(returnId).filter((t) => (taskStatus[t.id] ?? t.status) !== 'done');
  const myTasks = tasks.filter((t) => t.owner === audience);
  const headline = headlineFor(ret.stage, ret.nextActionOwner, ret.nextActionLabel, audience);
  const due = dueLabel(ret.dueDate);

  // The client sees warnings folded into the story; staff see the operational
  // list. Same underlying blockers, different resolution of detail.
  const visibleBlockers =
    audience === 'client' ? ret.blockers.filter((b) => b.owner === 'client') : ret.blockers;

  return (
    <div className="scrollbar-slim flex-1 overflow-y-auto px-6 py-5">
      <div className="mx-auto max-w-3xl space-y-5">
        {/* ---------- the one sentence that matters ---------- */}
        <Card
          className={cn(
            'p-5',
            headline.actionable ? 'border-brand-300 ring-1 ring-brand-200' : '',
          )}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                {headline.actionable ? 'Your next step' : 'Where things stand'}
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-ink-900">
                {headline.primary}
              </h2>
              <p className="mt-1 text-sm text-ink-600">{headline.secondary}</p>
            </div>
            {headline.actionable ? (
              <Link href={`/returns/${returnId}/tasks`} className="shrink-0">
                <Button variant="primary" icon={ArrowRight}>
                  {audience === 'client' ? 'See what to do' : 'Open my tasks'}
                </Button>
              </Link>
            ) : null}
          </div>
        </Card>

        {/* ---------- the ladder ---------- */}
        <Card>
          <div className="flex items-center justify-between border-b border-ink-200 px-5 py-3">
            <h3 className="text-sm font-semibold text-ink-900">Progress</h3>
            <Tooltip
              width="w-80"
              content="Clients and staff see different words for each step, but the same position on the same ladder — and hovering any step shows both audiences the identical definition."
            >
              <span className="cursor-help text-[11px] text-ink-400">
                Shown as {audience === 'client' ? 'you' : 'firm staff'} see it
              </span>
            </Tooltip>
          </div>
          <div className="px-5 py-4">
            <StageLadder current={ret.stage} audience={audience} owner={ret.nextActionOwner} />
          </div>
        </Card>

        {/* ---------- blockers ---------- */}
        {visibleBlockers.length ? (
          <Card>
            <div className="border-b border-ink-200 px-5 py-3">
              <h3 className="text-sm font-semibold text-ink-900">
                {audience === 'client' ? 'What’s holding things up' : 'Blockers'}
              </h3>
            </div>
            <div className="divide-y divide-ink-100">
              {visibleBlockers.map((b) => (
                <div key={b.id} className="flex items-start gap-3 px-5 py-3">
                  <span
                    className={cn(
                      'mt-0.5 grid size-5 shrink-0 place-items-center rounded-full',
                      b.severity === 'blocking'
                        ? 'bg-danger-50 text-danger-600'
                        : 'bg-caution-50 text-caution-700',
                    )}
                  >
                    <TriangleAlert className="size-3" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-ink-800">{b.label}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink-500">
                      {b.owner === 'client' ? (
                        <UserRound className="size-3" />
                      ) : (
                        <Building2 className="size-3" />
                      )}
                      {b.owner === 'client'
                        ? audience === 'client'
                          ? 'Needs you'
                          : 'Waiting on the client'
                        : audience === 'firm'
                          ? 'Needs the firm'
                          : 'We’re handling this'}
                    </p>
                  </div>
                  {b.href ? (
                    <Link href={b.href}>
                      <Button size="sm" variant="secondary">
                        Open
                      </Button>
                    </Link>
                  ) : null}
                </div>
              ))}
            </div>
          </Card>
        ) : null}

        {/* ---------- what's next for me ---------- */}
        <Card>
          <div className="flex items-center justify-between border-b border-ink-200 px-5 py-3">
            <h3 className="text-sm font-semibold text-ink-900">
              {audience === 'client' ? 'Your to-do list' : 'My tasks on this return'}
            </h3>
            <Link
              href={`/returns/${returnId}/tasks`}
              className="text-xs font-medium text-brand-700 hover:underline"
            >
              See all
            </Link>
          </div>
          {myTasks.length ? (
            <div className="divide-y divide-ink-100">
              {myTasks.slice(0, 4).map((t) => (
                <Link
                  key={t.id}
                  href={`/returns/${returnId}/tasks?task=${t.id}`}
                  className="flex items-center gap-3 px-5 py-3 transition hover:bg-ink-50"
                >
                  <CircleDot
                    className={cn(
                      'size-4 shrink-0',
                      t.priority === 'urgent' ? 'text-danger-500' : 'text-ink-300',
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-ink-800">{t.title}</span>
                    {t.dueDate ? (
                      <span className="text-[11px] text-ink-500">{dueLabel(t.dueDate).text}</span>
                    ) : null}
                  </span>
                  <ArrowRight className="size-3.5 shrink-0 text-ink-300" />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Check}
              title={audience === 'client' ? 'Nothing to do right now' : 'No open tasks'}
              body={
                audience === 'client'
                  ? 'We’ll let you know the moment we need something.'
                  : 'Everything assigned to you on this return is done.'
              }
            />
          )}
        </Card>

        {/* ---------- firm-only operational detail ---------- */}
        {audience === 'firm' ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Card className="p-4">
              <SectionLabel className="mb-2">Return health</SectionLabel>
              <dl className="space-y-1.5 text-xs">
                <Row label="Open AI findings" value={String(summary.openInsights)} tone="ai" />
                <Row label="Figures needing attention" value={String(summary.unresolvedFields)} />
                <Row label="Documents to review" value={String(summary.documentsNeedingReview)} />
                <Row label="Waiting on client" value={String(summary.openClientTasks)} />
              </dl>
            </Card>
            <Card className="p-4">
              <SectionLabel className="mb-2">Engagement</SectionLabel>
              <dl className="space-y-1.5 text-xs">
                <Row
                  label="Preparer"
                  value={USER_BY_ID[ret.preparerId]?.name ?? '—'}
                />
                <Row
                  label="Reviewer"
                  value={ret.reviewerId ? USER_BY_ID[ret.reviewerId]!.name : 'Not assigned'}
                />
                <Row label="In this stage" value={relativeTime(ret.stageSince)} />
                {can(role, 'view_fees') ? <Row label="Fee" value={money(ret.fee)} /> : null}
              </dl>
            </Card>
          </div>
        ) : (
          /* ---------- client-facing plain-English summary ---------- */
          <Card className="p-5">
            <SectionLabel className="mb-3">Your return at a glance</SectionLabel>
            <div className="flex flex-wrap items-baseline gap-x-8 gap-y-3">
              <div>
                <p
                  className={cn(
                    'tabular text-2xl font-semibold',
                    ret.refundOrDue >= 0 ? 'text-positive-700' : 'text-ink-900',
                  )}
                >
                  {money(Math.abs(ret.refundOrDue))}
                </p>
                <p className="text-xs text-ink-500">
                  {ret.refundOrDue >= 0 ? 'Estimated refund' : 'Estimated amount you owe'}
                </p>
              </div>
              <div>
                <p className="tabular text-2xl font-semibold text-ink-900">{ret.documentCount}</p>
                <p className="text-xs text-ink-500">Documents received</p>
              </div>
              <div>
                <p className={cn('text-2xl font-semibold', due.tone === 'danger' ? 'text-danger-700' : 'text-ink-900')}>
                  {due.text.replace('Due ', '')}
                </p>
                <p className="text-xs text-ink-500">Filing deadline</p>
              </div>
            </div>
            <p className="mt-4 border-t border-ink-200 pt-3 text-xs leading-relaxed text-ink-500">
              These figures are still a draft — your CPA has not finished reviewing them. Nothing is
              filed until you approve it.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: 'ai' }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-ink-500">{label}</dt>
      <dd className={cn('tabular font-medium', tone === 'ai' ? 'text-ai-700' : 'text-ink-900')}>
        {value}
      </dd>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function StageLadder({
  current,
  audience,
  owner,
}: {
  current: ReturnStage;
  audience: Audience;
  owner: Audience;
}) {
  const currentOrder = STAGES[current].order;

  return (
    <ol className="space-y-0">
      {STAGE_ORDER.map((s, i) => {
        const p = STAGES[s];
        const done = p.order < currentOrder;
        const active = s === current;
        const last = i === STAGE_ORDER.length - 1;

        return (
          <li key={s} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'grid size-6 shrink-0 place-items-center rounded-full border-2 transition',
                  done
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : active
                      ? 'border-brand-600 bg-white text-brand-700'
                      : 'border-ink-200 bg-white text-ink-300',
                )}
              >
                {done ? (
                  <Check className="size-3" />
                ) : active ? (
                  <span className="size-2 rounded-full bg-brand-600" />
                ) : (
                  <span className="size-1.5 rounded-full bg-ink-300" />
                )}
              </span>
              {!last ? (
                <span
                  className={cn('w-0.5 flex-1', done ? 'bg-brand-600' : 'bg-ink-200')}
                  style={{ minHeight: 28 }}
                />
              ) : null}
            </div>

            <div className={cn('min-w-0 flex-1', last ? 'pb-0' : 'pb-4')}>
              <Tooltip
                width="w-80"
                side="right"
                content={
                  <div className="space-y-1">
                    <p className="font-semibold">{p.meaning}</p>
                    <p className="text-ink-400">
                      Clients see “{p.clientLabel}” · staff see “{p.firmLabel}”. Same step.
                    </p>
                  </div>
                }
              >
                <span
                  className={cn(
                    'inline-flex cursor-help items-center gap-2 text-sm',
                    active ? 'font-semibold text-ink-900' : done ? 'text-ink-600' : 'text-ink-400',
                  )}
                >
                  {audience === 'client' ? p.clientLabel : p.firmLabel}
                  {active ? (
                    <Badge tone={owner === audience ? 'caution' : 'neutral'} dot>
                      {owner === audience
                        ? audience === 'client'
                          ? 'Needs you'
                          : 'Your move'
                        : owner === 'client'
                          ? 'With the client'
                          : 'With your CPA'}
                    </Badge>
                  ) : null}
                </span>
              </Tooltip>
              {active ? (
                <p className="mt-1 text-xs leading-relaxed text-ink-500">{p.meaning}</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
