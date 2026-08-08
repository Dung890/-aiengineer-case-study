'use client';

import { Sparkles } from 'lucide-react';
import { CONFIDENCE_VISUALS, confidenceBand } from '@/lib/design';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/ui/Tooltip';

/* ==================================================================
   Ch.10 — showing confidence without overclaiming it
   ------------------------------------------------------------------
   Design position: THE BAND IS THE SIGNAL, THE NUMBER IS A DETAIL.

   "87%" invites a reader to treat the model as calibrated to the
   percentage point, which no extraction model is. Worse, it invites
   comparison — is 87% meaningfully better than 84%? Nobody can answer
   that, so the number becomes decoration people learn to ignore.

   A band ("worth confirming") maps onto an actual decision. The
   percentage stays available for anyone who wants it, one hover away,
   because hiding it entirely would read as evasive.
   ================================================================== */

export function ConfidenceChip({
  confidence,
  showNumber = false,
  className,
}: {
  confidence: number;
  showNumber?: boolean;
  className?: string;
}) {
  const band = confidenceBand(confidence);
  const v = CONFIDENCE_VISUALS[band];
  const pct = Math.round(confidence * 100);

  return (
    <Tooltip
      width="w-72"
      content={
        <div className="space-y-1">
          <p className="font-semibold">
            {v.label} · {pct}%
          </p>
          <p className="text-ink-300">{v.meaning}</p>
        </div>
      }
    >
      <span
        className={cn(
          'inline-flex cursor-help items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap',
          v.chip,
          className,
        )}
      >
        <Sparkles className="size-3" />
        {v.label}
        {showNumber ? <span className="tabular opacity-70">{pct}%</span> : null}
      </span>
    </Tooltip>
  );
}

/** A three-segment meter. Reads as a level, not a precise measurement. */
export function ConfidenceMeter({
  confidence,
  className,
}: {
  confidence: number;
  className?: string;
}) {
  const band = confidenceBand(confidence);
  const filled = band === 'high' ? 3 : band === 'medium' ? 2 : 1;
  const v = CONFIDENCE_VISUALS[band];

  return (
    <span className={cn('inline-flex items-center gap-1', className)} aria-label={v.label}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn(
            'block h-1.5 w-4 rounded-full',
            i < filled ? v.bar : 'bg-ink-200',
          )}
        />
      ))}
    </span>
  );
}
