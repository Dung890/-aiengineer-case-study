import {
  Sparkles,
  ShieldCheck,
  Pencil,
  Sigma,
  Lock,
  Stamp,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';
import type { ConfidenceBand, DataState } from './types';

/* ==================================================================
   Ch.08 — the interaction affordance system
   ------------------------------------------------------------------
   This table IS the design system. Every value rendered anywhere in the
   product resolves its appearance and its permitted interactions from
   here, which is the only way a consistent language survives across a
   dozen screens built at speed.

   Three signals are carried redundantly on every state so none of them
   depends on colour alone (colour-blindness, greyscale printing):
     1. an icon,
     2. a text treatment (weight / underline style),
     3. a colour.
   ================================================================== */

export interface StateVisual {
  state: DataState;
  label: string;
  /** The "and why" half of the affordance — always reachable on hover/focus. */
  explanation: string;
  icon: LucideIcon;
  /** Can you click it to learn more? */
  interactive: boolean;
  /** Can you change the value in place? */
  editable: boolean;
  /** Small pill used in legends, tables and next to headings. */
  chip: string;
  /** Applied to the value itself when rendered inline. */
  value: string;
  /** Hover treatment, only meaningful when `interactive`. */
  hover: string;
  /** Solid colour for dots, bars and legend swatches. */
  dot: string;
}

export const DATA_STATES: Record<DataState, StateVisual> = {
  ai_suggested: {
    state: 'ai_suggested',
    label: 'AI suggested',
    explanation:
      'Green Growth read this from a source document. Nobody has confirmed it yet — open it to see the evidence.',
    icon: Sparkles,
    interactive: true,
    editable: true,
    chip: 'bg-ai-50 text-ai-700 ring-1 ring-ai-200',
    value: 'text-ink-900 decoration-ai-300',
    hover: 'hover:bg-ai-50 hover:ring-1 hover:ring-ai-200',
    dot: 'bg-ai-500',
  },
  ai_low_confidence: {
    state: 'ai_low_confidence',
    label: 'Needs a look',
    explanation:
      'Green Growth produced this but flagged its own uncertainty. Treat it as a draft until a person confirms it.',
    icon: Sparkles,
    interactive: true,
    editable: true,
    chip: 'bg-caution-50 text-caution-800 ring-1 ring-caution-300',
    value: 'text-ink-900 underline-uncertain decoration-caution-500',
    hover: 'hover:bg-caution-50 hover:ring-1 hover:ring-caution-300',
    dot: 'bg-caution-500',
  },
  verified: {
    state: 'verified',
    label: 'Verified',
    explanation:
      'A person checked this against the source document and confirmed it. Hover to see who and when.',
    // Deliberately the quietest state in the system: resolved things should
    // recede so unresolved ones are the only colour competing for attention.
    icon: ShieldCheck,
    interactive: true,
    editable: true,
    chip: 'bg-ink-100 text-ink-700 ring-1 ring-ink-200',
    value: 'text-ink-900',
    hover: 'hover:bg-ink-100 hover:ring-1 hover:ring-ink-200',
    dot: 'bg-positive-600',
  },
  editable: {
    state: 'editable',
    label: 'Editable',
    explanation: 'You entered this, and you can change it at any time.',
    icon: Pencil,
    interactive: true,
    editable: true,
    chip: 'bg-white text-ink-600 ring-1 ring-ink-300',
    value: 'text-ink-900',
    hover: 'hover:bg-white hover:ring-1 hover:ring-ink-300',
    dot: 'bg-ink-400',
  },
  calculated: {
    state: 'calculated',
    label: 'Calculated',
    explanation:
      'Derived from other figures on this return. Change the inputs and this updates itself — open it to see the arithmetic.',
    icon: Sigma,
    interactive: true,
    editable: false,
    chip: 'bg-info-50 text-info-700 ring-1 ring-info-200',
    value: 'text-ink-900',
    hover: 'hover:bg-info-50 hover:ring-1 hover:ring-info-200',
    dot: 'bg-info-500',
  },
  locked: {
    state: 'locked',
    label: 'Locked',
    explanation:
      'This cannot be changed here. Hover to see the specific reason — a locked field always says why.',
    icon: Lock,
    interactive: true,
    editable: false,
    chip: 'bg-ink-100 text-ink-500 ring-1 ring-ink-200',
    value: 'text-ink-500',
    hover: 'hover:bg-ink-100',
    dot: 'bg-ink-400',
  },
  needs_approval: {
    state: 'needs_approval',
    label: 'Needs approval',
    explanation:
      'Changed since the last review. A credentialed reviewer has to approve it before the return can be filed.',
    icon: Stamp,
    interactive: true,
    editable: false,
    chip: 'bg-caution-100 text-caution-800 ring-1 ring-caution-400',
    value: 'text-ink-900',
    hover: 'hover:bg-caution-50 hover:ring-1 hover:ring-caution-400',
    dot: 'bg-caution-600',
  },
  flagged: {
    state: 'flagged',
    label: 'Discrepancy',
    explanation:
      'Two sources disagree, or this figure conflicts with something else on the return. It has to be resolved before filing.',
    icon: TriangleAlert,
    interactive: true,
    editable: true,
    chip: 'bg-danger-50 text-danger-700 ring-1 ring-danger-200',
    value: 'text-danger-700 underline-uncertain decoration-danger-400',
    hover: 'hover:bg-danger-50 hover:ring-1 hover:ring-danger-300',
    dot: 'bg-danger-500',
  },
};

/** Ordered for legends — roughly "most attention needed" first. */
export const DATA_STATE_ORDER: DataState[] = [
  'flagged',
  'ai_low_confidence',
  'needs_approval',
  'ai_suggested',
  'verified',
  'editable',
  'calculated',
  'locked',
];

/** States that represent unfinished work — used for counts and filters. */
export const UNRESOLVED_STATES: DataState[] = [
  'flagged',
  'ai_low_confidence',
  'needs_approval',
  'ai_suggested',
];

/* ------------------------------------------------------------------ */
/* Confidence                                                          */
/* ------------------------------------------------------------------ */

/**
 * Ch.10. Raw percentages invite false precision — "87%" implies the model
 * knows its own error rate to the point. We show a band as the primary
 * signal and keep the number secondary, for people who want it.
 */
export function confidenceBand(c: number): ConfidenceBand {
  if (c >= 0.9) return 'high';
  if (c >= 0.7) return 'medium';
  return 'low';
}

export const CONFIDENCE_VISUALS: Record<
  ConfidenceBand,
  { label: string; chip: string; bar: string; meaning: string }
> = {
  high: {
    label: 'High confidence',
    chip: 'bg-ink-100 text-ink-700 ring-1 ring-ink-200',
    bar: 'bg-positive-600',
    meaning:
      'Clean read from a standard form field. Spot-check it; you should not need to re-derive it.',
  },
  medium: {
    label: 'Medium confidence',
    chip: 'bg-caution-50 text-caution-800 ring-1 ring-caution-200',
    bar: 'bg-caution-500',
    meaning:
      'The value is probably right but something was ambiguous. Worth confirming against the source.',
  },
  low: {
    label: 'Low confidence',
    chip: 'bg-danger-50 text-danger-700 ring-1 ring-danger-200',
    bar: 'bg-danger-500',
    meaning:
      'Do not rely on this without checking the document yourself. Green Growth is telling you it guessed.',
  },
};

/* ------------------------------------------------------------------ */
/* Generic tones, for one-off badges                                   */
/* ------------------------------------------------------------------ */

export type Tone = 'neutral' | 'brand' | 'ai' | 'caution' | 'danger' | 'positive' | 'info';

export const TONE_CHIP: Record<Tone, string> = {
  neutral: 'bg-ink-100 text-ink-700 ring-1 ring-ink-200',
  brand: 'bg-brand-50 text-brand-700 ring-1 ring-brand-200',
  ai: 'bg-ai-50 text-ai-700 ring-1 ring-ai-200',
  caution: 'bg-caution-50 text-caution-800 ring-1 ring-caution-200',
  danger: 'bg-danger-50 text-danger-700 ring-1 ring-danger-200',
  positive: 'bg-positive-50 text-positive-700 ring-1 ring-positive-200',
  info: 'bg-info-50 text-info-700 ring-1 ring-info-200',
};

export const TONE_DOT: Record<Tone, string> = {
  neutral: 'bg-ink-400',
  brand: 'bg-brand-600',
  ai: 'bg-ai-500',
  caution: 'bg-caution-500',
  danger: 'bg-danger-500',
  positive: 'bg-positive-600',
  info: 'bg-info-500',
};
