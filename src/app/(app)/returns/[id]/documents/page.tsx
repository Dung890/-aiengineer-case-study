'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Search,
  Funnel,
  FileText,
  X,
  Sparkles,
  ShieldCheck,
  Clock,
  TriangleAlert,
  ChevronRight,
  FolderOpen,
} from 'lucide-react';
import type { DocumentCategory, DocumentStatus, SourceDocument } from '@/lib/types';
import { getDocuments, USER_BY_ID } from '@/lib/mock';
import { useUrlState } from '@/lib/useUrlState';
import { cn, formatDate, pluralize, relativeTime } from '@/lib/utils';
import { Badge, Button, Card, EmptyState } from '@/components/ui/primitives';
import { Tooltip } from '@/components/ui/Tooltip';
import { DocumentPage } from '@/components/document/DocumentFacsimile';
import { RelatedRail } from '@/components/shell/RelatedRail';

/* ==================================================================
   Ch.09 — Complexity made navigable
   ------------------------------------------------------------------
   328 documents on one return. The design bet is that at this volume
   people do not browse, they FILTER — so search and facets are the
   primary surface and the folder hierarchy is a secondary lens, not
   the main event.

   Progressive disclosure runs in three steps rather than two:
     summary counts → filtered list → one document open.
   You can always see the shape of the whole set (the category strip)
   even while looking at one page of one document, which is what stops
   deep work feeling like a maze.
   ================================================================== */

const STATUS_META: Record<
  DocumentStatus,
  { label: string; tone: 'ai' | 'neutral' | 'caution' | 'positive'; icon: typeof Sparkles }
> = {
  processing: { label: 'Reading…', tone: 'neutral', icon: Clock },
  extracted: { label: 'AI extracted', tone: 'ai', icon: Sparkles },
  needs_review: { label: 'Needs review', tone: 'caution', icon: TriangleAlert },
  verified: { label: 'Verified', tone: 'positive', icon: ShieldCheck },
};

const CATEGORIES: DocumentCategory[] = [
  'Income',
  'Business',
  'Investments',
  'Deductions',
  'Property',
  'Health',
  'Reference',
];

export default function DocumentsPage() {
  const params = useParams<{ id: string }>();
  const returnId = params.id;
  const all = getDocuments(returnId);

  const [urlState, setParams] = useUrlState({ q: '', cat: '', status: '' });
  const openDocId = urlState.doc as string | undefined;
  const highlightRegion = urlState.region as string | undefined;

  const [query, setQuery] = useState(urlState.q ?? '');
  const category = urlState.cat as DocumentCategory | '';
  const status = urlState.status as DocumentStatus | '';
  const [limit, setLimit] = useState(40);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((d) => {
      if (category && d.category !== category) return false;
      if (status && d.status !== status) return false;
      if (!q) return true;
      return (
        d.name.toLowerCase().includes(q) ||
        d.issuer.toLowerCase().includes(q) ||
        d.kind.toLowerCase().includes(q)
      );
    });
  }, [all, query, category, status]);

  const counts = useMemo(() => {
    const byCat = new Map<string, number>();
    const byStatus = new Map<string, number>();
    for (const d of all) {
      byCat.set(d.category, (byCat.get(d.category) ?? 0) + 1);
      byStatus.set(d.status, (byStatus.get(d.status) ?? 0) + 1);
    }
    return { byCat, byStatus };
  }, [all]);

  const openDoc = openDocId ? all.find((d) => d.id === openDocId) : undefined;
  const hasFilters = !!(query || category || status);

  if (!all.length) {
    return (
      <div className="flex-1 p-6">
        <Card>
          <EmptyState
            icon={FolderOpen}
            title="No documents yet"
            body="Documents uploaded for this return will appear here."
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1">
      {/* ================= list ================= */}
      <div
        className={cn(
          'scrollbar-slim flex min-w-0 flex-col overflow-y-auto',
          openDoc ? 'w-[42%] border-r border-ink-200' : 'flex-1',
        )}
      >
        {/* --- search + facets stay pinned: context you never lose --- */}
        <div className="sticky top-0 z-10 space-y-2.5 border-b border-ink-200 bg-white/95 px-4 py-3 backdrop-blur">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setParams({ q: e.target.value || undefined });
                setLimit(40);
              }}
              placeholder={`Search ${all.length} documents…`}
              className="h-9 w-full rounded-lg border border-ink-300 bg-white pl-8 pr-8 text-sm outline-none placeholder:text-ink-400 focus:border-brand-600"
            />
            {query ? (
              <button
                onClick={() => {
                  setQuery('');
                  setParams({ q: undefined });
                }}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-ink-400 hover:text-ink-700"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Funnel className="size-3.5 text-ink-400" />
            <FacetChip
              label="All"
              count={all.length}
              active={!category}
              onClick={() => setParams({ cat: undefined })}
            />
            {CATEGORIES.filter((c) => counts.byCat.get(c)).map((c) => (
              <FacetChip
                key={c}
                label={c}
                count={counts.byCat.get(c) ?? 0}
                active={category === c}
                onClick={() => setParams({ cat: category === c ? undefined : c })}
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(Object.keys(STATUS_META) as DocumentStatus[])
              .filter((s) => counts.byStatus.get(s))
              .map((s) => (
                <FacetChip
                  key={s}
                  label={STATUS_META[s].label}
                  count={counts.byStatus.get(s) ?? 0}
                  active={status === s}
                  tone={STATUS_META[s].tone}
                  onClick={() => setParams({ status: status === s ? undefined : s })}
                />
              ))}
            {hasFilters ? (
              <button
                onClick={() => {
                  setQuery('');
                  setParams({ q: undefined, cat: undefined, status: undefined });
                }}
                className="ml-1 text-[11px] font-medium text-brand-700 hover:underline"
              >
                Clear
              </button>
            ) : null}
          </div>

          <p className="text-[11px] text-ink-500">
            {hasFilters
              ? `${pluralize(filtered.length, 'match', 'matches')} of ${all.length}`
              : `${all.length} documents`}
          </p>
        </div>

        {/* --- the list --- */}
        {filtered.length ? (
          <>
            <div className="divide-y divide-ink-100">
              {filtered.slice(0, limit).map((d) => (
                <DocRow
                  key={d.id}
                  doc={d}
                  active={d.id === openDocId}
                  compact={!!openDoc}
                  onOpen={() => setParams({ doc: d.id, region: undefined })}
                />
              ))}
            </div>
            {filtered.length > limit ? (
              <div className="p-4 text-center">
                <Button variant="secondary" onClick={() => setLimit((l) => l + 60)}>
                  Show 60 more · {filtered.length - limit} remaining
                </Button>
              </div>
            ) : null}
          </>
        ) : (
          <EmptyState
            icon={Search}
            title="No documents match"
            body="Try a different search term, or clear the filters."
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setQuery('');
                  setParams({ q: undefined, cat: undefined, status: undefined });
                }}
              >
                Clear filters
              </Button>
            }
          />
        )}
      </div>

      {/* ================= detail ================= */}
      {openDoc ? (
        <div className="scrollbar-slim flex-1 overflow-y-auto bg-ink-100 p-4">
          <div className="mx-auto max-w-2xl space-y-4">
            <Card className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-ink-900">{openDoc.name}</h2>
                  <p className="mt-0.5 text-xs text-ink-500">
                    {openDoc.kind} · {openDoc.issuer} · {pluralize(openDoc.pages, 'page')}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge
                      tone={STATUS_META[openDoc.status].tone}
                      icon={STATUS_META[openDoc.status].icon}
                    >
                      {STATUS_META[openDoc.status].label}
                    </Badge>
                    <Badge tone="neutral">{openDoc.category}</Badge>
                  </div>
                </div>
                <button
                  onClick={() => setParams({ doc: undefined, region: undefined })}
                  aria-label="Close document"
                  className="rounded-md p-1 text-ink-400 transition hover:bg-ink-100 hover:text-ink-800"
                >
                  <X className="size-4" />
                </button>
              </div>
              <p className="mt-3 border-t border-ink-200 pt-3 text-xs text-ink-500">
                Uploaded by {USER_BY_ID[openDoc.uploadedBy]?.name ?? 'a client'}{' '}
                {relativeTime(openDoc.uploadedAt)} · {formatDate(openDoc.uploadedAt)} ·{' '}
                {(openDoc.sizeKb / 1024).toFixed(1)} MB
              </p>
            </Card>

            <DocumentPage
              document={openDoc}
              page={1}
              highlightRegionId={highlightRegion}
              onRegionClick={(r) => setParams({ region: r.id })}
            />

            {openDoc.regions.length ? (
              <Card>
                <div className="border-b border-ink-200 px-4 py-2.5">
                  <h3 className="text-xs font-semibold text-ink-900">What the AI read</h3>
                </div>
                <div className="divide-y divide-ink-100">
                  {openDoc.regions.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setParams({ region: r.id })}
                      className={cn(
                        'flex w-full items-center gap-3 px-4 py-2 text-left transition',
                        r.id === highlightRegion ? 'bg-ai-50' : 'hover:bg-ink-50',
                      )}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[11px] text-ink-500">
                          {r.boxNo ? `Box ${r.boxNo} · ` : ''}
                          {r.label}
                        </span>
                      </span>
                      <span
                        className={cn(
                          'shrink-0 text-xs font-medium text-ink-900',
                          r.kind === 'money' && 'tabular',
                        )}
                      >
                        {r.rawText.split('\n')[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </Card>
            ) : null}

            <RelatedRail
              refObject={{ type: 'document', id: openDoc.id, label: openDoc.name }}
              returnId={returnId}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function FacetChip({
  label,
  count,
  active,
  tone,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  tone?: 'ai' | 'neutral' | 'caution' | 'positive';
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition',
        active
          ? 'bg-brand-700 text-white'
          : 'bg-ink-100 text-ink-600 hover:bg-ink-200 hover:text-ink-900',
      )}
    >
      {tone && !active ? (
        <span
          className={cn(
            'size-1.5 rounded-full',
            tone === 'ai'
              ? 'bg-ai-500'
              : tone === 'caution'
                ? 'bg-caution-500'
                : tone === 'positive'
                  ? 'bg-positive-600'
                  : 'bg-ink-400',
          )}
        />
      ) : null}
      {label}
      <span className={cn('tabular', active ? 'text-white/70' : 'text-ink-400')}>{count}</span>
    </button>
  );
}

function DocRow({
  doc,
  active,
  compact,
  onOpen,
}: {
  doc: SourceDocument;
  active: boolean;
  compact: boolean;
  onOpen: () => void;
}) {
  const meta = STATUS_META[doc.status];
  return (
    <button
      onClick={onOpen}
      className={cn(
        'flex w-full items-center gap-3 px-4 py-2.5 text-left transition',
        active ? 'bg-brand-50 ring-1 ring-inset ring-brand-200' : 'hover:bg-ink-50',
      )}
    >
      <span
        className={cn(
          'grid size-8 shrink-0 place-items-center rounded-lg',
          doc.regions.length ? 'bg-ai-50 text-ai-600' : 'bg-ink-100 text-ink-400',
        )}
      >
        <FileText className="size-4" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-ink-900">{doc.name}</span>
        <span className="block truncate text-[11px] text-ink-500">
          {doc.kind} · {relativeTime(doc.uploadedAt)}
        </span>
      </span>

      {!compact ? (
        <Tooltip content={`${doc.pages} page${doc.pages > 1 ? 's' : ''}`}>
          <span className="shrink-0 text-[11px] text-ink-400">{doc.category}</span>
        </Tooltip>
      ) : null}

      <Badge tone={meta.tone} icon={meta.icon} className={compact ? 'hidden' : ''}>
        {meta.label}
      </Badge>

      <ChevronRight className="size-3.5 shrink-0 text-ink-300" />
    </button>
  );
}
