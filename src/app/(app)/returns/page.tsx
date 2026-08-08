'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Funnel, Sparkles, TriangleAlert, ScrollText, X } from 'lucide-react';
import type { ReturnStage } from '@/lib/types';
import { getReturns, USER_BY_ID } from '@/lib/mock';
import { STAGES, STAGE_ORDER } from '@/lib/stages';
import { bucketOf, matchesStat, STAT_FILTER_LABEL, type StatFilter } from '@/lib/ranking';
import { can } from '@/lib/permissions';
import { useDemo } from '@/lib/store';
import { useUrlState } from '@/lib/useUrlState';
import { cn, dueLabel, money, pluralize } from '@/lib/utils';
import { Badge, Card, EmptyState } from '@/components/ui/primitives';
import { PageHeader } from '@/components/shell/PageHeader';

const STAT_FILTERS: StatFilter[] = [
  'actionable',
  'waiting',
  'at-risk',
  'blocked-client',
  'ai',
  'in-review',
  'active',
  'filed',
];

/** The firm-wide queue. Same filtering vocabulary as the document library. */
export default function ReturnsPage() {
  const role = useDemo((s) => s.activeRole);
  const userId = useDemo((s) => s.activeUserId);
  const seesAll = can(role, 'view_all_returns');

  // Query, scope and the dashboard drill-down `filter` all live in the URL, so
  // a filtered view (e.g. the "Deadline within 3 weeks" tile) is a shareable
  // link, not throwaway local state.
  const [url, setUrl] = useUrlState({
    q: '',
    scope: seesAll ? 'all' : 'mine',
    filter: '',
  });
  const query = url.q ?? '';
  const scope = seesAll ? ((url.scope as 'mine' | 'all') || 'all') : 'mine';
  const statFilter = STAT_FILTERS.includes(url.filter as StatFilter)
    ? (url.filter as StatFilter)
    : '';

  const [stage, setStage] = useState<ReturnStage | ''>('');
  const [limit, setLimit] = useState(50);

  const all = getReturns();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((r) => {
      if (scope === 'mine' && r.preparerId !== userId) return false;
      if (statFilter && !matchesStat(r, statFilter)) return false;
      if (stage && r.stage !== stage) return false;
      if (!q) return true;
      return r.clientName.toLowerCase().includes(q) || r.formType.toLowerCase().includes(q);
    });
  }, [all, query, stage, scope, statFilter, userId]);

  const stageCounts = useMemo(() => {
    const m = new Map<ReturnStage, number>();
    for (const r of all) {
      if (scope === 'mine' && r.preparerId !== userId) continue;
      m.set(r.stage, (m.get(r.stage) ?? 0) + 1);
    }
    return m;
  }, [all, scope, userId]);

  return (
    <>
      <PageHeader
        title="All returns"
        subtitle={`${pluralize(filtered.length, 'return')} · ${scope === 'mine' ? 'assigned to you' : 'across the firm'}`}
        actions={
          seesAll ? (
            <div className="flex rounded-lg border border-ink-300 bg-white p-0.5">
              {(['mine', 'all'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setUrl({ scope: s })}
                  className={cn(
                    'rounded-md px-3 py-1 text-xs font-medium transition',
                    scope === s ? 'bg-brand-700 text-white' : 'text-ink-600 hover:text-ink-900',
                  )}
                >
                  {s === 'mine' ? 'Mine' : 'Firm'}
                </button>
              ))}
            </div>
          ) : null
        }
      />

      <div className="scrollbar-slim flex-1 overflow-y-auto px-6 py-4">
        <div className="mx-auto max-w-5xl space-y-3">
          {statFilter ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2">
              <p className="text-xs text-brand-900">
                Filtered from the dashboard:{' '}
                <span className="font-semibold">{STAT_FILTER_LABEL[statFilter]}</span>
                {' · '}
                {pluralize(filtered.length, 'return')}
              </p>
              <button
                onClick={() => setUrl({ filter: '' })}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-brand-700 transition hover:bg-brand-100"
              >
                <X className="size-3" />
                Clear
              </button>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-56 flex-1">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
              <input
                value={query}
                onChange={(e) => setUrl({ q: e.target.value })}
                placeholder="Search clients…"
                className="h-9 w-full rounded-lg border border-ink-300 bg-white pl-8 pr-3 text-sm outline-none placeholder:text-ink-400 focus:border-brand-600"
              />
            </div>
            <Funnel className="size-3.5 text-ink-400" />
            <button
              onClick={() => setStage('')}
              className={cn(
                'rounded-full px-2.5 py-1 text-[11px] font-medium transition',
                !stage ? 'bg-brand-700 text-white' : 'bg-ink-200 text-ink-600 hover:bg-ink-300',
              )}
            >
              All
            </button>
            {STAGE_ORDER.filter((s) => stageCounts.get(s)).map((s) => (
              <button
                key={s}
                onClick={() => setStage(stage === s ? '' : s)}
                className={cn(
                  'rounded-full px-2.5 py-1 text-[11px] font-medium transition',
                  stage === s ? 'bg-brand-700 text-white' : 'bg-ink-200 text-ink-600 hover:bg-ink-300',
                )}
              >
                {STAGES[s].firmLabel}{' '}
                <span className="tabular opacity-60">{stageCounts.get(s)}</span>
              </button>
            ))}
          </div>

          <Card className="overflow-hidden">
            {filtered.length ? (
              <div className="divide-y divide-ink-100">
                {filtered.slice(0, limit).map((r) => {
                  const due = dueLabel(r.dueDate);
                  const bucket = bucketOf(r);
                  return (
                    <Link
                      key={r.id}
                      href={`/returns/${r.id}`}
                      className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-ink-50"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium text-ink-900">
                            {r.clientName}
                          </span>
                          <span className="shrink-0 text-[11px] text-ink-400">{r.formType}</span>
                        </span>
                        <span className="block truncate text-[11px] text-ink-500">
                          {STAGES[r.stage].firmLabel} ·{' '}
                          {USER_BY_ID[r.preparerId]?.name.split(' ')[0] ?? '—'}
                        </span>
                      </span>

                      {r.aiFlagsOpen > 0 ? (
                        <Badge tone="ai" icon={Sparkles}>
                          {r.aiFlagsOpen}
                        </Badge>
                      ) : null}
                      {r.blockers.length ? (
                        <Badge tone={bucket === 'act' ? 'danger' : 'neutral'} icon={TriangleAlert}>
                          {r.blockers.length}
                        </Badge>
                      ) : null}

                      <span
                        className={cn(
                          'tabular hidden w-24 shrink-0 text-right text-xs sm:block',
                          r.refundOrDue >= 0 ? 'text-positive-700' : 'text-ink-700',
                        )}
                      >
                        {money(Math.abs(r.refundOrDue))}
                      </span>

                      <span
                        className={cn(
                          'w-28 shrink-0 text-right text-[11px]',
                          due.tone === 'danger'
                            ? 'font-medium text-danger-700'
                            : due.tone === 'caution'
                              ? 'text-caution-700'
                              : 'text-ink-500',
                        )}
                      >
                        {due.text}
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={ScrollText}
                title="No returns match"
                body="Try a different search or clear the stage filter."
              />
            )}
          </Card>

          {filtered.length > limit ? (
            <p className="text-center">
              <button
                onClick={() => setLimit((l) => l + 60)}
                className="text-xs font-medium text-brand-700 hover:underline"
              >
                Show 60 more · {filtered.length - limit} remaining
              </button>
            </p>
          ) : null}
        </div>
      </div>
    </>
  );
}
