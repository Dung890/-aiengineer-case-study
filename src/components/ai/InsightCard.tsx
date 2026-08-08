'use client';

import { useState } from 'react';
import {
  ChevronDown,
  TriangleAlert,
  Sparkles,
  FileQuestionMark,
  Lightbulb,
  ScanText,
  BadgeCheck,
  Send,
  Undo2,
  X,
  Check,
  ArrowUpRight,
} from 'lucide-react';
import type { AIInsight, AISuggestedAction, InsightKind, InsightStatus } from '@/lib/types';
import { cn, money } from '@/lib/utils';
import { Badge, Button } from '@/components/ui/primitives';
import { Tooltip } from '@/components/ui/Tooltip';
import { ConfidenceChip } from './Confidence';
import { getDocument, getRegion, USER_BY_ID } from '@/lib/mock';
import { can } from '@/lib/permissions';
import { useDemo } from '@/lib/store';

/* ==================================================================
   Ch.10 — the AI interaction model
   ------------------------------------------------------------------
   Each card answers the six questions the brief asks for, in the order
   a reviewer actually asks them:

     what did it do        → title + summary
     how sure is it        → confidence band
     why                   → reasoning, numbered
     what's the evidence   → quoted regions, each opening the document
     what's uncertain      → its own bordered block, never a footnote
     what should I do      → actions, primary first

   Two decisions worth defending:

   · UNCERTAINTY GETS ITS OWN BLOCK. Burying "I might be wrong" in body
     text is how transparency becomes theatre. It is bordered, it is
     amber, and it sits directly above the actions so it is read at the
     moment of deciding.

   · THE EXPLANATION IS COLLAPSED BY DEFAULT. "Transparency without
     overload" means the full chain is always one click away and never
     in the way. Showing every insight fully expanded is the failure
     mode the brief explicitly rules out.
   ================================================================== */

const KIND_META: Record<
  InsightKind,
  { icon: typeof Sparkles; label: string; tone: 'ai' | 'danger' | 'caution' | 'info' }
> = {
  extraction: { icon: ScanText, label: 'Extraction', tone: 'ai' },
  discrepancy: { icon: TriangleAlert, label: 'Discrepancy', tone: 'danger' },
  recommendation: { icon: Lightbulb, label: 'Recommendation', tone: 'info' },
  warning: { icon: TriangleAlert, label: 'Warning', tone: 'caution' },
  missing_document: { icon: FileQuestionMark, label: 'Missing document', tone: 'caution' },
};

const STATUS_META: Record<InsightStatus, { label: string; tone: 'positive' | 'neutral' | 'ai' }> = {
  open: { label: 'Open', tone: 'ai' },
  accepted: { label: 'Accepted', tone: 'positive' },
  corrected: { label: 'Corrected', tone: 'positive' },
  dismissed: { label: 'Dismissed', tone: 'neutral' },
  escalated: { label: 'With reviewer', tone: 'neutral' },
};

export function InsightCard({
  insight,
  defaultOpen = false,
  onOpenEvidence,
  onApply,
  compact = false,
}: {
  insight: AIInsight;
  defaultOpen?: boolean;
  /** Jump to a document region — the link from AI claim to source. */
  onOpenEvidence?: (documentId: string, regionId?: string) => void;
  /** Commit a value to the return. */
  onApply?: (value: number, note: string) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [correcting, setCorrecting] = useState(false);
  const [draft, setDraft] = useState('');

  const role = useDemo((s) => s.activeRole);
  const statusOverride = useDemo((s) => s.insightStatus[insight.id]);
  const setInsightStatus = useDemo((s) => s.setInsightStatus);

  const status = statusOverride ?? insight.status;
  const meta = KIND_META[insight.kind];
  const Icon = meta.icon;
  const resolved = status !== 'open';

  const canApprove = can(role, 'approve_return');
  const blockedByCredential = insight.requiresCredentialedReviewer && !canApprove;

  function runAction(action: AISuggestedAction) {
    if (action.kind === 'correct' && action.resultingValue === undefined) {
      setCorrecting(true);
      setDraft('');
      return;
    }
    if (action.resultingValue !== undefined && onApply) {
      onApply(action.resultingValue, action.label);
    }
    setInsightStatus(
      insight.id,
      action.kind === 'accept'
        ? 'accepted'
        : action.kind === 'dismiss'
          ? 'dismissed'
          : action.kind === 'escalate'
            ? 'escalated'
            : action.kind === 'ask_client'
              ? 'escalated'
              : 'corrected',
    );
  }

  return (
    <div
      className={cn(
        'rounded-card border bg-white transition',
        resolved ? 'border-ink-200 opacity-75' : 'border-ink-200 shadow-panel',
        !resolved && insight.kind === 'discrepancy' && 'border-danger-200',
      )}
    >
      {/* ---------------- header ---------------- */}
      <div className="flex items-start gap-3 p-4">
        <span
          className={cn(
            'mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg',
            meta.tone === 'danger'
              ? 'bg-danger-50 text-danger-600'
              : meta.tone === 'caution'
                ? 'bg-caution-50 text-caution-700'
                : meta.tone === 'info'
                  ? 'bg-info-50 text-info-600'
                  : 'bg-ai-50 text-ai-600',
          )}
        >
          <Icon className="size-4" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-ink-900">{insight.title}</h3>
            {resolved ? (
              <Badge tone={STATUS_META[status].tone}>{STATUS_META[status].label}</Badge>
            ) : (
              <ConfidenceChip confidence={insight.confidence} />
            )}
            {insight.requiresCredentialedReviewer ? (
              <Tooltip content="Only a CPA or EA can resolve this. A concierge's job is to spot it and route it — not to decide it.">
                <span>
                  <Badge tone="info" icon={BadgeCheck}>
                    Credential required
                  </Badge>
                </span>
              </Tooltip>
            ) : null}
          </div>

          <p className="mt-1 text-sm leading-relaxed text-ink-600">{insight.summary}</p>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            {insight.impact ? (
              <span className="tabular text-xs text-ink-500">
                {money(insight.impact)} at stake
              </span>
            ) : null}
            <button
              onClick={() => setOpen((o) => !o)}
              className="inline-flex items-center gap-1 text-xs font-medium text-ai-700 transition hover:text-ai-800"
              aria-expanded={open}
            >
              <ChevronDown className={cn('size-3.5 transition-transform', open && 'rotate-180')} />
              {open ? 'Hide reasoning' : 'Why does it think this?'}
            </button>
          </div>
        </div>
      </div>

      {/* ---------------- expanded explanation ---------------- */}
      {open ? (
        <div className="space-y-4 border-t border-ink-200 bg-ink-50 px-4 py-4">
          {/* reasoning */}
          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
              How it got there
            </p>
            <ol className="space-y-1.5">
              {insight.reasoning.map((r, i) => (
                <li key={i} className="flex gap-2.5 text-xs leading-relaxed text-ink-700">
                  <span className="tabular mt-px grid size-4 shrink-0 place-items-center rounded-full bg-ink-200 text-[9px] font-semibold text-ink-600">
                    {i + 1}
                  </span>
                  {r}
                </li>
              ))}
            </ol>
          </div>

          {/* evidence — every claim is clickable back to its source */}
          {insight.evidence.length ? (
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                Evidence
              </p>
              <div className="space-y-1.5">
                {insight.evidence.map((e, i) => {
                  const doc = getDocument(e.documentId);
                  const region = e.regionId ? getRegion(e.documentId, e.regionId) : undefined;
                  return (
                    <button
                      key={i}
                      onClick={() => onOpenEvidence?.(e.documentId, e.regionId)}
                      disabled={!onOpenEvidence}
                      className={cn(
                        'group flex w-full items-start gap-2 rounded-lg border border-ink-200 bg-white px-2.5 py-2 text-left transition',
                        onOpenEvidence && 'hover:border-ai-300 hover:bg-ai-50',
                      )}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[11px] text-ink-500">
                          {doc?.name ?? e.documentId}
                          {region ? ` · ${region.boxNo ? `Box ${region.boxNo}` : region.label}` : ''}
                        </span>
                        <span className="tabular mt-0.5 block truncate text-xs font-medium text-ink-900">
                          “{e.quote}”
                        </span>
                      </span>
                      {onOpenEvidence ? (
                        <ArrowUpRight className="mt-0.5 size-3.5 shrink-0 text-ink-300 transition group-hover:text-ai-600" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* uncertainty — deliberately loud, deliberately last before acting */}
          {insight.uncertainty ? (
            <div className="rounded-lg border border-caution-300 bg-caution-50 px-3 py-2.5">
              <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-caution-800">
                <TriangleAlert className="size-3" />
                What it isn&apos;t sure about
              </p>
              <p className="text-xs leading-relaxed text-caution-800">{insight.uncertainty}</p>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* ---------------- actions ---------------- */}
      {!resolved && !compact ? (
        <div className="border-t border-ink-200 px-4 py-3">
          {correcting ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-ink-500">Correct to</span>
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="0"
                className="tabular h-8 w-32 rounded-md border border-brand-600 px-2 text-right text-sm ring-2 ring-brand-600/20 outline-none"
              />
              <Button
                size="sm"
                variant="primary"
                icon={Check}
                onClick={() => {
                  const v = Number(draft.replace(/[^0-9.-]/g, ''));
                  if (!Number.isNaN(v)) {
                    onApply?.(v, 'Corrected by hand');
                    setInsightStatus(insight.id, 'corrected');
                  }
                  setCorrecting(false);
                }}
              >
                Save
              </Button>
              <Button size="sm" variant="ghost" icon={X} onClick={() => setCorrecting(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {insight.suggestedActions.map((a) => {
                const isBlocked = blockedByCredential && a.kind !== 'escalate';
                const btn = (
                  <Button
                    key={a.id}
                    size="sm"
                    variant={
                      a.primary ? (a.kind === 'escalate' ? 'ai' : 'primary') : 'secondary'
                    }
                    disabled={isBlocked}
                    icon={
                      a.kind === 'escalate'
                        ? Send
                        : a.kind === 'accept'
                          ? Check
                          : a.kind === 'dismiss'
                            ? X
                            : undefined
                    }
                    onClick={() => runAction(a)}
                  >
                    {a.label}
                  </Button>
                );
                return isBlocked ? (
                  <Tooltip
                    key={a.id}
                    content="This position needs a CPA or EA. Send it to your reviewer instead — your notes travel with it."
                  >
                    <span>{btn}</span>
                  </Tooltip>
                ) : (
                  btn
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      {/* ---------------- undo ---------------- */}
      {resolved && !compact ? (
        <div className="flex items-center justify-between border-t border-ink-200 px-4 py-2.5">
          <p className="text-xs text-ink-500">
            {status === 'escalated'
              ? `Sent to ${USER_BY_ID['u-lin']!.name}`
              : `Marked ${STATUS_META[status].label.toLowerCase()}`}
          </p>
          <Button
            size="sm"
            variant="ghost"
            icon={Undo2}
            onClick={() => setInsightStatus(insight.id, 'open')}
          >
            Undo
          </Button>
        </div>
      ) : null}
    </div>
  );
}
