'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { DocumentRegion, SourceDocument } from '@/lib/types';

/* ==================================================================
   Ch.01 — the document half of traceability
   ------------------------------------------------------------------
   The documents are rendered, not scanned. Every box you see is drawn
   from the same `DocumentRegion[]` that the return fields cite, so a
   highlight cannot drift out of alignment with the box it is pointing
   at — there are no hand-tuned pixel offsets to go stale.

   That also means the "source document" is real text: selectable,
   searchable, readable by a screen reader, and legible at any zoom.
   A scanned JPEG with a coloured rectangle on top would have looked
   more authentic in a screenshot and been worse in every other way.
   ================================================================== */

const FORM_META: Record<
  NonNullable<SourceDocument['facsimile']>,
  { formNo: string; title: string; year: string; omb: string }
> = {
  w2: { formNo: 'W-2', title: 'Wage and Tax Statement', year: '2025', omb: '1545-0008' },
  '1099nec': {
    formNo: '1099-NEC',
    title: 'Nonemployee Compensation',
    year: '2025',
    omb: '1545-0116',
  },
  '1099int': { formNo: '1099-INT', title: 'Interest Income', year: '2025', omb: '1545-0112' },
  '1099div': {
    formNo: '1099-DIV',
    title: 'Dividends and Distributions',
    year: '2025',
    omb: '1545-0110',
  },
  '1099b': {
    formNo: '1099-B',
    title: 'Proceeds From Broker Transactions',
    year: '2025',
    omb: '1545-0715',
  },
  '1098': { formNo: '1098', title: 'Mortgage Interest Statement', year: '2025', omb: '1545-1380' },
  '1098t': { formNo: '1098-T', title: 'Tuition Statement', year: '2025', omb: '1545-1574' },
  '1095a': {
    formNo: '1095-A',
    title: 'Health Insurance Marketplace Statement',
    year: '2025',
    omb: '1545-2232',
  },
  '5498sa': {
    formNo: '5498-SA',
    title: 'HSA, Archer MSA Information',
    year: '2025',
    omb: '1545-1518',
  },
  k1: {
    formNo: 'Schedule K-1',
    title: "Shareholder's Share of Income, Deductions, Credits",
    year: '2025',
    omb: '1545-0123',
  },
};

export function DocumentFacsimile({
  document: doc,
  page = 1,
  highlightRegionId,
  secondaryRegionIds = [],
  onRegionClick,
  className,
}: {
  document: SourceDocument;
  page?: number;
  /** The region being traced. Gets the strong treatment. */
  highlightRegionId?: string;
  /** Other regions that also feed the figure — shown, but quieter. */
  secondaryRegionIds?: string[];
  onRegionClick?: (region: DocumentRegion) => void;
  className?: string;
}) {
  const meta = doc.facsimile ? FORM_META[doc.facsimile] : null;
  const regions = doc.regions.filter((r) => r.page === page);
  const highlightRef = useRef<HTMLDivElement>(null);

  // Bring the traced box into view whenever the target changes. Without this,
  // "trace this figure" can technically work and still leave the user hunting.
  useEffect(() => {
    if (highlightRegionId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [highlightRegionId]);

  return (
    <div
      className={cn(
        'relative mx-auto w-full max-w-2xl bg-white shadow-panel ring-1 ring-ink-300',
        className,
      )}
      style={{ aspectRatio: '8.5 / 11' }}
    >
      {/* --- form chrome --- */}
      <div className="absolute inset-x-0 top-0 flex items-start justify-between border-b-2 border-ink-900 px-[2%] py-[1.2%]">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-ink-900">
            {meta ? `Form ${meta.formNo}` : doc.kind}
          </p>
          <p className="text-[9px] text-ink-600">{meta?.title ?? doc.name}</p>
        </div>
        <div className="text-right">
          <p className="text-[13px] font-bold tabular text-ink-900">{meta?.year ?? '2025'}</p>
          {meta ? <p className="text-[8px] text-ink-500">OMB No. {meta.omb}</p> : null}
        </div>
      </div>

      {/* --- the boxes --- */}
      <div className="absolute inset-x-0 bottom-0 top-[7%]">
        {regions.map((r) => {
          const isPrimary = r.id === highlightRegionId;
          const isSecondary = secondaryRegionIds.includes(r.id);
          return (
            <div
              key={r.id}
              ref={isPrimary ? highlightRef : undefined}
              onClick={onRegionClick ? () => onRegionClick(r) : undefined}
              className={cn(
                'absolute overflow-hidden border transition-all duration-300',
                onRegionClick && 'cursor-pointer',
                isPrimary
                  ? 'z-10 border-ai-500 bg-ai-50 ring-2 ring-ai-500 ring-offset-1'
                  : isSecondary
                    ? 'border-ai-300 bg-ai-50/40'
                    : 'border-ink-300 bg-white hover:border-ink-400',
              )}
              style={{
                left: `${r.bbox.x}%`,
                top: `${r.bbox.y}%`,
                width: `${r.bbox.w}%`,
                height: `${r.bbox.h}%`,
              }}
            >
              <div className="flex h-full flex-col px-[3%] py-[2%]">
                <p
                  className={cn(
                    'flex items-baseline gap-1 text-[7.5px] leading-tight',
                    isPrimary ? 'text-ai-800' : 'text-ink-500',
                  )}
                >
                  {r.boxNo ? (
                    <span className="font-bold">{r.boxNo}</span>
                  ) : null}
                  <span className="truncate">{r.label}</span>
                </p>
                <p
                  className={cn(
                    'mt-auto whitespace-pre-line leading-tight',
                    r.kind === 'money'
                      ? 'tabular text-right text-[11px] font-semibold'
                      : r.kind === 'id'
                        ? 'tabular text-[9.5px]'
                        : 'text-[8.5px]',
                    isPrimary ? 'text-ai-900' : 'text-ink-900',
                  )}
                >
                  {r.rawText}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* --- footer --- */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-ink-300 px-[2%] py-[0.8%]">
        <p className="text-[7px] text-ink-400">
          {doc.issuer} · uploaded {new Date(doc.uploadedAt).toLocaleDateString('en-US', { timeZone: 'UTC' })}
        </p>
        <p className="text-[7px] text-ink-400">
          Page {page} of {doc.pages}
        </p>
      </div>
    </div>
  );
}

/**
 * Fallback for documents without a modelled form layout — the bulk library
 * and free-form uploads. Deliberately looks like a page rather than an error:
 * a document you have not modelled should still open.
 */
export function GenericDocumentPage({
  document: doc,
  page = 1,
  highlightRegionId,
  className,
}: {
  document: SourceDocument;
  page?: number;
  highlightRegionId?: string;
  className?: string;
}) {
  const regions = doc.regions.filter((r) => r.page === page);
  const highlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlightRegionId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [highlightRegionId]);

  return (
    <div
      className={cn(
        'relative mx-auto w-full max-w-2xl bg-white p-[5%] shadow-panel ring-1 ring-ink-300',
        className,
      )}
      style={{ aspectRatio: '8.5 / 11' }}
    >
      <div className="flex items-start justify-between border-b border-ink-900 pb-[2%]">
        <div>
          <p className="text-[11px] font-semibold text-ink-900">{doc.issuer}</p>
          <p className="text-[9px] text-ink-500">{doc.name}</p>
        </div>
        <p className="text-[8px] uppercase tracking-wide text-ink-400">{doc.kind}</p>
      </div>

      {regions.length ? (
        // A structured statement: label on the left, amount right-aligned, one
        // ruled row each — so a P&L or receipt reads like a real document, not
        // a few boxes floating on a blank page.
        <div className="mt-[4%] border-y border-ink-200">
          {regions.map((r) => {
            const isHi = r.id === highlightRegionId;
            const isAmount = r.kind === 'money' || r.kind === 'id';
            return (
              <div
                key={r.id}
                ref={isHi ? highlightRef : undefined}
                className={cn(
                  'flex items-baseline justify-between gap-4 border-b border-ink-100 px-[2%] py-[1.5%] transition last:border-0',
                  isHi && 'bg-ai-50 ring-1 ring-inset ring-ai-400',
                )}
              >
                <span
                  className={cn(
                    'text-[10px] leading-tight',
                    isHi ? 'font-medium text-ai-900' : 'text-ink-600',
                  )}
                >
                  {r.boxNo ? <span className="mr-1 font-semibold">{r.boxNo}</span> : null}
                  {r.label}
                </span>
                <span
                  className={cn(
                    'shrink-0 whitespace-pre-line text-right text-[11px] font-semibold leading-tight',
                    isAmount && 'tabular',
                    isHi ? 'text-ai-900' : 'text-ink-900',
                  )}
                >
                  {r.rawText}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        // Placeholder ruled lines: enough to read as "a document" without
        // pretending we have content we never modelled.
        <div className="mt-[4%] space-y-[1.6%]" aria-label="Document body">
          {Array.from({ length: 22 }).map((_, i) => (
            <div
              key={i}
              className="h-[6px] rounded-full bg-ink-100"
              style={{ width: `${[97, 88, 93, 72, 96, 84][i % 6]}%` }}
            />
          ))}
        </div>
      )}

      <p className="absolute inset-x-0 bottom-[2%] text-center text-[7px] text-ink-400">
        Page {page} of {doc.pages}
      </p>
    </div>
  );
}

/** Picks the right renderer. Callers should use this, not the two above. */
export function DocumentPage(props: {
  document: SourceDocument;
  page?: number;
  highlightRegionId?: string;
  secondaryRegionIds?: string[];
  onRegionClick?: (region: DocumentRegion) => void;
  className?: string;
}) {
  return props.document.facsimile ? (
    <DocumentFacsimile {...props} />
  ) : (
    <GenericDocumentPage {...props} />
  );
}
