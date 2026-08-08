'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Lock, Pencil, X } from 'lucide-react';
import type { DataState, ReturnField } from '@/lib/types';
import { DATA_STATES } from '@/lib/design';
import { cn, money } from '@/lib/utils';
import { Tooltip } from '@/components/ui/Tooltip';

/* ==================================================================
   Ch.08 — Clickable vs. editable
   ------------------------------------------------------------------
   The rule the whole product is built on, stated once:

     EVERY value can be CLICKED to find out where it came from.
     ONLY SOME values can be EDITED.

   Those are different questions, so they get different signals rather
   than sharing one ambiguous "interactive" look:

     · Clickable-to-inspect → the value tints on hover. No box.
     · Editable             → a bordered input well appears on hover,
                              with a pencil. It looks like a form field
                              because it is about to become one.
     · Not editable         → no well, ever. Hovering tells you why.
     · Locked               → not-allowed cursor + a lock, and the
                              tooltip always names the specific reason.

   Once a user learns "a box means I can type here", it holds on the
   review screen, the dashboard, the document library and the client
   view — which is the actual ask: consistency ACROSS contexts, not a
   pretty component in one.
   ================================================================== */

export function FieldValue({
  field,
  canEdit = true,
  denialReason,
  onInspect,
  onCommit,
  align = 'right',
  size = 'md',
  className,
}: {
  field: ReturnField;
  /** Role-level permission. Separate from the state's own editability. */
  canEdit?: boolean;
  /** Why `canEdit` is false — surfaced on hover so a denial teaches. */
  denialReason?: string;
  onInspect?: () => void;
  onCommit?: (value: number) => void;
  align?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const visual = DATA_STATES[field.state];
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(field.value));
  const inputRef = useRef<HTMLInputElement>(null);

  const editableByState = visual.editable;
  const editable = editableByState && canEdit && !!onCommit;

  // Only a DOM side-effect. The draft itself is seeded when editing starts
  // (see `beginEdit`) rather than synced from props in an effect, which would
  // cause a cascading render on every recalculation of the return.
  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  function beginEdit() {
    setDraft(String(field.value));
    setEditing(true);
  }

  const sizeClasses = {
    sm: 'text-xs h-6 px-1.5',
    md: 'text-figure h-7 px-2',
    lg: 'text-lg font-semibold h-9 px-2.5',
  }[size];

  function commit() {
    const parsed = Number(draft.replace(/[^0-9.-]/g, ''));
    if (!Number.isNaN(parsed) && parsed !== field.value) onCommit?.(parsed);
    setEditing(false);
  }

  /* ---------------- editing ---------------- */
  if (editing) {
    return (
      <span className={cn('inline-flex items-center gap-1', className)}>
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') {
              setDraft(String(field.value));
              setEditing(false);
            }
          }}
          onBlur={commit}
          aria-label={`${field.label} value`}
          className={cn(
            'tabular rounded-md border border-brand-600 bg-white ring-2 ring-brand-600/20 outline-none',
            align === 'right' ? 'text-right' : 'text-left',
            sizeClasses,
            size === 'lg' ? 'w-40' : 'w-28',
          )}
        />
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={commit}
          aria-label="Save"
          className="grid size-6 place-items-center rounded-md bg-brand-700 text-white hover:bg-brand-800"
        >
          <Check className="size-3.5" />
        </button>
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            setDraft(String(field.value));
            setEditing(false);
          }}
          aria-label="Cancel"
          className="grid size-6 place-items-center rounded-md text-ink-500 hover:bg-ink-100"
        >
          <X className="size-3.5" />
        </button>
      </span>
    );
  }

  /* ---------------- display ---------------- */
  const tooltip = buildTooltip(field, canEdit, denialReason);

  const body = (
    <span
      role="button"
      tabIndex={0}
      onClick={onInspect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onInspect?.();
        }
      }}
      className={cn(
        'group/val inline-flex items-center gap-1.5 rounded-md transition-colors',
        align === 'right' ? 'justify-end' : 'justify-start',
        sizeClasses,
        // Inspect affordance: a tint, no box.
        onInspect ? 'cursor-pointer' : 'cursor-default',
        visual.hover,
        field.state === 'locked' && 'cursor-not-allowed',
        className,
      )}
    >
      <span className={cn('tabular', visual.value)}>{money(field.value)}</span>

      {/* State marker. Always present, always the same glyph per state. */}
      <StateGlyph state={field.state} />
    </span>
  );

  return (
    <span className="inline-flex items-center gap-1">
      <Tooltip content={tooltip} width="w-72">
        {body}
      </Tooltip>

      {/* The edit affordance is a SEPARATE control from the value, which is
          what lets "click to inspect" and "click to edit" coexist without
          either one becoming ambiguous. */}
      {editable ? (
        <Tooltip content="Edit this figure">
          <button
            onClick={beginEdit}
            aria-label={`Edit ${field.label}`}
            className={cn(
              'grid size-6 place-items-center rounded-md text-ink-400 opacity-0 transition',
              'hover:bg-ink-100 hover:text-ink-700 focus-visible:opacity-100 group-hover/row:opacity-100',
            )}
          >
            <Pencil className="size-3.5" />
          </button>
        </Tooltip>
      ) : editableByState && !canEdit ? (
        <Tooltip content={denialReason ?? 'You do not have permission to edit this.'}>
          <span
            className="grid size-6 cursor-not-allowed place-items-center rounded-md text-ink-300 opacity-0 group-hover/row:opacity-100"
            aria-label="Editing not permitted"
          >
            <Lock className="size-3.5" />
          </span>
        </Tooltip>
      ) : (
        <span className="size-6" aria-hidden />
      )}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* The per-state glyph                                                 */
/* ------------------------------------------------------------------ */

export function StateGlyph({ state, className }: { state: DataState; className?: string }) {
  const visual = DATA_STATES[state];
  const Icon = visual.icon;

  // `verified` and `editable` are the two resting states. Marking them as
  // loudly as the others would make a healthy return look alarming, so they
  // get a muted glyph rather than a coloured one.
  const tone =
    state === 'verified'
      ? 'text-positive-600'
      : state === 'editable'
        ? 'text-ink-300'
        : state === 'ai_suggested'
          ? 'text-ai-500'
          : state === 'ai_low_confidence'
            ? 'text-caution-600'
            : state === 'needs_approval'
              ? 'text-caution-700'
              : state === 'flagged'
                ? 'text-danger-600'
                : state === 'calculated'
                  ? 'text-info-500'
                  : 'text-ink-400';

  return <Icon className={cn('size-3.5 shrink-0', tone, className)} aria-hidden />;
}

/* ------------------------------------------------------------------ */
/* Tooltip contents                                                    */
/* ------------------------------------------------------------------ */

function buildTooltip(field: ReturnField, canEdit: boolean, denialReason?: string) {
  const visual = DATA_STATES[field.state];
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 font-semibold">
        <visual.icon className="size-3" />
        {visual.label}
        {field.confidence !== undefined ? (
          <span className="font-normal text-ink-400">
            · {Math.round(field.confidence * 100)}%
          </span>
        ) : null}
      </div>
      <p className="text-ink-300">
        {field.state === 'locked' && field.lockReason ? field.lockReason : visual.explanation}
      </p>
      {field.override ? (
        <p className="border-t border-ink-700 pt-1.5 text-ink-400">
          Changed from {money(field.override.previousValue)} by you.
        </p>
      ) : null}
      {!canEdit && visual.editable && denialReason ? (
        <p className="border-t border-ink-700 pt-1.5 text-caution-300">{denialReason}</p>
      ) : null}
      <p className="border-t border-ink-700 pt-1.5 text-[10px] uppercase tracking-wide text-ink-500">
        Click to trace this figure
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Legend                                                              */
/* ------------------------------------------------------------------ */

/**
 * Shown in-product rather than only in documentation. A dense professional
 * tool earns the right to a legend — hiding the key to your own visual
 * language is how users end up guessing.
 */
export function StateChip({
  state,
  showLabel = true,
  className,
}: {
  state: DataState;
  showLabel?: boolean;
  className?: string;
}) {
  const visual = DATA_STATES[state];
  return (
    <Tooltip content={visual.explanation}>
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap',
          visual.chip,
          className,
        )}
      >
        <visual.icon className="size-3" />
        {showLabel ? visual.label : null}
      </span>
    </Tooltip>
  );
}
