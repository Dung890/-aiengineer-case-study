'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  FileText,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  BookOpen,
  Info,
  ListFilter,
} from 'lucide-react';
import type { FieldSection, ReturnField } from '@/lib/types';
import { DATA_STATE_ORDER, DATA_STATES, UNRESOLVED_STATES } from '@/lib/design';
import { getDocument, getInsights, getReturn, USER_BY_ID } from '@/lib/mock';
import { can, denialReason } from '@/lib/permissions';
import { useDemo, useFields } from '@/lib/store';
import { cn, money } from '@/lib/utils';
import { Badge, Button, Card, EmptyState, SectionLabel } from '@/components/ui/primitives';
import { Tooltip } from '@/components/ui/Tooltip';
import { FieldValue, StateChip } from '@/components/affordance/FieldValue';
import { DocumentPage } from '@/components/document/DocumentFacsimile';
import { InsightCard } from '@/components/ai/InsightCard';
import { ConfidenceChip } from '@/components/ai/Confidence';
import { RelatedRail } from '@/components/shell/RelatedRail';
import { useUrlState } from '@/lib/useUrlState';

const SECTIONS: FieldSection[] = ['Income', 'Adjustments', 'Deductions', 'Tax', 'Payments'];

export default function ReviewPage() {
  const params = useParams<{ id: string }>();
  const returnId = params.id;

  const fields = useFields(returnId);
  const ret = getReturn(returnId);
  const role = useDemo((s) => s.activeRole);
  const setFieldValue = useDemo((s) => s.setFieldValue);
  const verifyField = useDemo((s) => s.verifyField);
  const insightStatus = useDemo((s) => s.insightStatus);

  /* Deep-linkable selection (Ch.04): the URL describes the view, so any state
     you can reach is a state you can send to a colleague. */
  const [urlState, setParams] = useUrlState({
    field: 'fld-gross-receipts',
    pane: 'trace',
  });

  // The default only exists on the hero return; anywhere else fall through to
  // that return's first line rather than rendering nothing.
  const selectedId = urlState.field;
  const activeDocId = urlState.doc as string | undefined;
  const activeRegionId = urlState.region as string | undefined;
  const pane = urlState.pane as 'trace' | 'findings';
  const [onlyUnresolved, setOnlyUnresolved] = useState(false);

  const selected = fields.find((f) => f.id === selectedId) ?? fields[0]!;

  const allInsights = getInsights(returnId);
  const openFindings = allInsights.filter(
    (i) => (insightStatus[i.id] ?? i.status) === 'open',
  );

  const canEdit = can(role, 'edit_field');
  const canVerify = can(role, 'verify_field');

  /* Which document to show. An explicit ?doc wins; otherwise the first
     source behind the selected figure. */
  const traceDocId = activeDocId ?? selected.provenance.sources[0]?.documentId;
  const traceDoc = traceDocId ? getDocument(traceDocId) : undefined;
  const traceRegionId =
    activeRegionId ??
    selected.provenance.sources.find((s) => s.documentId === traceDocId)?.regionId;

  const secondaryRegions = selected.provenance.sources
    .filter((s) => s.documentId === traceDocId && s.regionId !== traceRegionId)
    .map((s) => s.regionId);

  const visibleFields = onlyUnresolved
    ? fields.filter((f) => UNRESOLVED_STATES.includes(f.state))
    : fields;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Always-visible orientation caption — says what this screen is for. */}
      <div className="flex shrink-0 items-center gap-2 border-b border-ink-200 bg-brand-50 px-4 py-2 text-xs text-brand-900">
        <Info className="size-3.5 shrink-0 text-brand-700" />
        <span>
          Click any figure to trace it to the exact box on its source document, or open{' '}
          <span className="font-medium">AI findings</span> to review the AI&apos;s confidence and
          reasoning. Coloured markers need attention; grey means resolved.
        </span>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* ================= LEFT: the return ================= */}
      <div className="scrollbar-slim flex w-[46%] min-w-0 flex-col overflow-y-auto border-r border-ink-200 bg-white">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink-200 bg-white/95 px-4 py-2.5 backdrop-blur">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-ink-400" />
            <span className="text-sm font-semibold text-ink-900">
              Form {ret?.formType ?? '1040'} · {ret?.taxYear ?? 2025}
            </span>
          </div>
          <button
            onClick={() => setOnlyUnresolved((v) => !v)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium transition',
              onlyUnresolved
                ? 'bg-brand-700 text-white'
                : 'text-ink-500 hover:bg-ink-100 hover:text-ink-800',
            )}
          >
            <ListFilter className="size-3" />
            Needs attention
          </button>
        </div>

        {SECTIONS.map((section) => {
          const sectionFields = visibleFields.filter((f) => f.section === section);
          if (!sectionFields.length) return null;
          return (
            <div key={section}>
              <div className="sticky top-[41px] z-[5] border-y border-ink-200 bg-ink-50 px-4 py-1.5">
                <SectionLabel>{section}</SectionLabel>
              </div>
              <div className="divide-y divide-ink-100">
                {sectionFields.map((f) => (
                  <FieldRow
                    key={f.id}
                    field={f}
                    selected={f.id === selected.id}
                    canEdit={canEdit && f.id !== 'fld-balance-due'}
                    denialReason={denialReason(role, 'edit_field')}
                    onSelect={() =>
                      setParams({ field: f.id, doc: undefined, region: undefined, pane: 'trace' })
                    }
                    onCommit={(v) => setFieldValue(f.id, v)}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {!visibleFields.length ? (
          <EmptyState
            icon={ShieldCheck}
            title="Everything is resolved"
            body="No figure on this return is unverified, uncertain or in dispute."
          />
        ) : null}

        {/* The legend, in-product. */}
        <div className="mt-auto border-t border-ink-200 bg-ink-50 px-4 py-3">
          <SectionLabel className="mb-2">What the markers mean</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {DATA_STATE_ORDER.map((s) => (
              <StateChip key={s} state={s} />
            ))}
          </div>
        </div>
      </div>

      {/* ================= RIGHT: trace / findings ================= */}
      <div className="flex min-w-0 flex-1 flex-col bg-ink-100">
        <div className="flex shrink-0 items-center gap-1 border-b border-ink-200 bg-white px-4">
          <PaneTab
            active={pane === 'trace'}
            onClick={() => setParams({ pane: 'trace' })}
            icon={BookOpen}
            label="Where it came from"
          />
          <PaneTab
            active={pane === 'findings'}
            onClick={() => setParams({ pane: 'findings' })}
            icon={Sparkles}
            label="AI findings"
            badge={openFindings.length}
          />
        </div>

        <div className="scrollbar-slim flex-1 overflow-y-auto p-4">
          {pane === 'trace' ? (
            <TracePane
              field={selected}
              traceDoc={traceDoc}
              traceRegionId={traceRegionId}
              secondaryRegionIds={secondaryRegions}
              canVerify={canVerify}
              denial={denialReason(role, 'verify_field')}
              onPickSource={(docId, regionId) => setParams({ doc: docId, region: regionId })}
              onVerify={() => verifyField(selected.id)}
              returnId={returnId}
            />
          ) : (
            <div className="mx-auto max-w-2xl space-y-3">
              {openFindings.length ? null : (
                <Card>
                  <EmptyState
                    icon={ShieldCheck}
                    title="No open findings"
                    body="Every AI finding on this return has been accepted, corrected, dismissed or escalated."
                  />
                </Card>
              )}
              {allInsights.map((i) => (
                <InsightCard
                  key={i.id}
                  insight={i}
                  onOpenEvidence={(docId, regionId) =>
                    setParams({
                      pane: 'trace',
                      doc: docId,
                      region: regionId,
                      field: i.targetFieldId ?? selectedId,
                    })
                  }
                  onApply={(value, note) => {
                    if (i.targetFieldId) setFieldValue(i.targetFieldId, value, { note });
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function PaneTab({
  active,
  onClick,
  icon: Icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm transition',
        active
          ? 'border-brand-700 font-medium text-brand-800'
          : 'border-transparent text-ink-500 hover:text-ink-800',
      )}
    >
      <Icon className="size-4" />
      {label}
      {badge ? (
        <span className="grid h-4.5 min-w-4.5 place-items-center rounded-full bg-ai-100 px-1 text-[10px] font-semibold text-ai-700">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function FieldRow({
  field,
  selected,
  canEdit,
  denialReason: denial,
  onSelect,
  onCommit,
}: {
  field: ReturnField;
  selected: boolean;
  canEdit: boolean;
  denialReason: string;
  onSelect: () => void;
  onCommit: (v: number) => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        'group/row flex cursor-pointer items-center gap-3 px-4 py-2 transition',
        selected ? 'bg-brand-50 ring-1 ring-inset ring-brand-200' : 'hover:bg-ink-50',
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-ink-800">{field.label}</p>
        <p className="truncate text-[11px] text-ink-400">{field.lineRef}</p>
      </div>
      <FieldValue
        field={field}
        canEdit={canEdit}
        denialReason={denial}
        onInspect={onSelect}
        onCommit={onCommit}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */

/** One line telling the reviewer what to check in this source document. */
function reviewHint(field: ReturnField): string {
  switch (field.state) {
    case 'flagged':
      return 'Discrepancy: the highlighted source doesn’t agree with the return — resolve this before filing.';
    case 'ai_low_confidence':
      return 'Low confidence: double-check the highlighted box matches this figure before you verify it.';
    case 'ai_suggested':
      return 'The AI read this figure from the highlighted box. Confirm it matches, then mark it verified.';
    case 'needs_approval':
      return 'Awaiting sign-off: confirm the highlighted figure is correct.';
    case 'verified':
      return 'Verified — this figure matches the highlighted box on the source.';
    default:
      return 'Check that the highlighted box on this document matches the figure on the return.';
  }
}

function TracePane({
  field,
  traceDoc,
  traceRegionId,
  secondaryRegionIds,
  canVerify,
  denial,
  onPickSource,
  onVerify,
  returnId,
}: {
  field: ReturnField;
  traceDoc: ReturnType<typeof getDocument>;
  traceRegionId?: string;
  secondaryRegionIds: string[];
  canVerify: boolean;
  denial: string;
  onPickSource: (docId: string, regionId: string) => void;
  onVerify: () => void;
  returnId: string;
}) {
  const visual = DATA_STATES[field.state];
  const p = field.provenance;
  const sourceDocs = useMemo(() => {
    const seen = new Set<string>();
    return p.sources.filter((s) => {
      if (seen.has(s.documentId)) return false;
      seen.add(s.documentId);
      return true;
    });
  }, [p.sources]);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* ---- what you're tracing ---- */}
      <Card className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] text-ink-400">{field.lineRef}</p>
            <h2 className="text-base font-semibold text-ink-900">{field.label}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StateChip state={field.state} />
              {field.confidence !== undefined && field.state !== 'verified' ? (
                <ConfidenceChip confidence={field.confidence} showNumber />
              ) : null}
            </div>
          </div>
          <div className="text-right">
            <p className={cn('tabular text-2xl font-semibold', visual.value)}>
              {money(field.value)}
            </p>
            {field.override ? (
              <p className="mt-0.5 text-[11px] text-ink-500">
                was {money(field.override.previousValue)}
              </p>
            ) : null}
          </div>
        </div>

        {p.verifiedBy ? (
          <p className="mt-3 flex items-center gap-1.5 border-t border-ink-200 pt-3 text-xs text-ink-500">
            <ShieldCheck className="size-3.5 text-positive-600" />
            Verified by {USER_BY_ID[p.verifiedBy]?.name ?? 'a preparer'} against the source document
          </p>
        ) : visual.editable && field.state !== 'verified' ? (
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-ink-200 pt-3">
            <p className="text-xs text-ink-500">Nobody has confirmed this figure yet.</p>
            {canVerify ? (
              <Button size="sm" variant="secondary" icon={ShieldCheck} onClick={onVerify}>
                Mark verified
              </Button>
            ) : (
              <Tooltip content={denial}>
                <span>
                  <Button size="sm" variant="secondary" icon={ShieldCheck} disabled>
                    Mark verified
                  </Button>
                </span>
              </Tooltip>
            )}
          </div>
        ) : null}
      </Card>

      {/* ---- the arithmetic ---- */}
      <Card>
        <div className="border-b border-ink-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-ink-900">How this number was built</h3>
          {p.rule ? <p className="mt-1 text-xs leading-relaxed text-ink-600">{p.rule}</p> : null}
          {p.citation ? (
            <Badge tone="info" className="mt-2" icon={BookOpen}>
              {p.citation}
            </Badge>
          ) : null}
        </div>

        <div className="divide-y divide-ink-100">
          {p.steps.map((s, i) => {
            const clickable = !!s.documentId && !!s.regionId;
            return (
              <button
                key={i}
                disabled={!clickable}
                onClick={() => clickable && onPickSource(s.documentId!, s.regionId!)}
                className={cn(
                  'flex w-full items-center gap-3 px-4 py-2.5 text-left transition',
                  clickable ? 'cursor-pointer hover:bg-ai-50' : 'cursor-default',
                )}
              >
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      'block text-xs leading-relaxed',
                      s.value === null ? 'text-ink-500 italic' : 'text-ink-700',
                    )}
                  >
                    {s.label}
                  </span>
                  {clickable ? (
                    <span className="mt-0.5 flex items-center gap-1 text-[10px] font-medium text-ai-600">
                      <ArrowRight className="size-2.5" />
                      Show me on the document
                    </span>
                  ) : null}
                </span>
                {s.value !== null ? (
                  <span
                    className={cn(
                      'tabular shrink-0 text-sm',
                      s.value < 0 ? 'text-danger-700' : 'text-ink-900',
                    )}
                  >
                    {s.value < 0 ? `(${money(Math.abs(s.value))})` : money(s.value)}
                  </span>
                ) : null}
              </button>
            );
          })}

          <div className="flex items-center gap-3 bg-ink-50 px-4 py-2.5">
            <span className="flex-1 text-xs font-semibold text-ink-900">{field.lineRef}</span>
            <span className="tabular shrink-0 text-sm font-semibold text-ink-900">
              {money(field.value)}
            </span>
          </div>
        </div>
      </Card>

      {/* ---- the source document ---- */}
      {traceDoc ? (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-ink-200 px-4 py-3">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-ink-900">{traceDoc.name}</h3>
              <p className="text-xs text-ink-500">
                {traceDoc.kind} · {traceDoc.issuer}
              </p>
            </div>
            <Badge tone="ai" icon={Sparkles}>
              Highlighted
            </Badge>
          </div>

          {/* One line: what to check in this document. */}
          <div className="flex items-start gap-2 border-b border-ink-200 bg-ink-50 px-4 py-2 text-[11px] leading-relaxed text-ink-600">
            <Info className="mt-0.5 size-3 shrink-0 text-brand-700" />
            <span>{reviewHint(field)}</span>
          </div>

          {/* When several documents feed one figure, they're all reachable. */}
          {sourceDocs.length > 1 ? (
            <div className="flex flex-wrap gap-1.5 border-b border-ink-200 bg-ink-50 px-4 py-2.5">
              {sourceDocs.map((s) => {
                const d = getDocument(s.documentId);
                const active = s.documentId === traceDoc.id;
                return (
                  <button
                    key={s.documentId}
                    onClick={() => onPickSource(s.documentId, s.regionId)}
                    className={cn(
                      'rounded-full px-2.5 py-1 text-[11px] font-medium transition',
                      active
                        ? 'bg-ai-600 text-white'
                        : 'bg-white text-ink-600 ring-1 ring-ink-300 hover:ring-ai-300',
                    )}
                  >
                    {d?.issuer ?? s.documentId}
                    {s.amount === 0 ? ' · excluded' : ''}
                  </button>
                );
              })}
            </div>
          ) : null}

          <div className="bg-ink-100 p-4">
            <DocumentPage
              document={traceDoc}
              page={1}
              highlightRegionId={traceRegionId}
              secondaryRegionIds={secondaryRegionIds}
              onRegionClick={(r) => onPickSource(traceDoc.id, r.id)}
            />
          </div>
        </Card>
      ) : (
        <Card>
          <EmptyState
            icon={Info}
            title="No source document"
            body="This figure is derived entirely from other lines on the return. The arithmetic above is its full history."
          />
        </Card>
      )}

      <RelatedRail refObject={{ type: 'field', id: field.id }} returnId={returnId} />
    </div>
  );
}
