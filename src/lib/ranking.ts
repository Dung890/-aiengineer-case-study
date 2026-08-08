import type { TaxReturn } from './types';
import { daysUntil, TODAY } from './utils';

/* ==================================================================
   Ch.07 — "What should I work on right now?"
   ------------------------------------------------------------------
   The design position that makes this dashboard different from the
   spreadsheet it has to beat:

     A return you are WAITING ON is not work.

   Most tax dashboards rank by deadline and shove everything into one
   list, so the top of your queue fills with returns you physically
   cannot progress because the client hasn't sent a K-1. That is why
   staff fall back to their own spreadsheet — they are really
   maintaining a list of *what they can actually do today*.

   So we split first, then rank:

     · ACT     — the ball is with you. Ranked and worked top-down.
     · CHASE   — the ball is with the client. A separate, quieter list
                 whose only verb is "nudge".
     · CLEAR   — nothing outstanding.

   Ranking within ACT is a transparent weighted score, and every item
   carries the reasons that produced it, so the dashboard can explain
   its own ordering. Given the product's whole thesis is reviewable AI,
   an unexplainable priority list would be off-message.
   ================================================================== */

export type Bucket = 'act' | 'chase' | 'clear';

export interface RankedReturn {
  ret: TaxReturn;
  bucket: Bucket;
  score: number;
  /** Human-readable drivers, highest contribution first. */
  reasons: Array<{ label: string; weight: number }>;
}

export function bucketOf(ret: TaxReturn): Bucket {
  if (ret.stage === 'filed') return 'clear';

  const firmBlocked = ret.blockers.some((b) => b.owner === 'firm');
  const clientBlocked = ret.blockers.some((b) => b.owner === 'client' && b.severity === 'blocking');

  // A firm-owned blocker always means there is something to do, even if the
  // client also owes something.
  if (firmBlocked) return 'act';
  if (clientBlocked) return 'chase';
  return ret.nextActionOwner === 'firm' ? 'act' : 'chase';
}

export function rankReturn(ret: TaxReturn): RankedReturn {
  const reasons: Array<{ label: string; weight: number }> = [];
  const bucket = bucketOf(ret);

  const days = daysUntil(ret.dueDate);

  // Deadline pressure, sharply non-linear. A return due in 5 days is far
  // more than twice as urgent as one due in 10.
  if (days <= 0) {
    reasons.push({ label: 'Past the filing deadline', weight: 100 });
  } else if (days <= 45) {
    const w = Math.round(600 / days);
    reasons.push({
      label: days <= 7 ? `Due in ${days} days` : `Filing deadline in ${days} days`,
      weight: w,
    });
  }

  if (ret.onExtension) {
    reasons.push({ label: 'On extension — October deadline', weight: -25 });
  }

  // Work you can actually do.
  const firmBlockers = ret.blockers.filter((b) => b.owner === 'firm');
  if (firmBlockers.length) {
    reasons.push({
      label:
        firmBlockers.length === 1
          ? firmBlockers[0]!.label
          : `${firmBlockers.length} items need a decision from the firm`,
      weight: 40 * firmBlockers.length,
    });
  }

  if (ret.aiFlagsOpen > 0) {
    reasons.push({
      label: `${ret.aiFlagsOpen} open AI finding${ret.aiFlagsOpen > 1 ? 's' : ''}`,
      weight: 12 * ret.aiFlagsOpen,
    });
  }

  if (ret.lowConfidenceFields > 0) {
    reasons.push({
      label: `${ret.lowConfidenceFields} figure${ret.lowConfidenceFields > 1 ? 's' : ''} the AI is unsure about`,
      weight: 15 * ret.lowConfidenceFields,
    });
  }

  // Nearly-done work is worth prioritising: pushing a return over the line
  // frees capacity, whereas starting a new one does not.
  if (ret.stage === 'review' || ret.stage === 'client_approval') {
    reasons.push({ label: 'Close to filing — worth finishing', weight: 30 });
  }

  // Stale work rots. Something sitting untouched in one stage for weeks is
  // usually stuck rather than slow.
  const stageDays = Math.round(
    (TODAY.getTime() - new Date(ret.stageSince).getTime()) / 86_400_000,
  );
  if (stageDays >= 14) {
    reasons.push({ label: `No movement in ${stageDays} days`, weight: Math.min(45, stageDays) });
  }

  // Money matters, but only as a tiebreak — ranking primarily by fee would
  // quietly deprioritise every small client, which is a bad practice policy
  // as much as a bad product one.
  if (Math.abs(ret.refundOrDue) > 10000) {
    reasons.push({ label: 'Large balance at stake', weight: 10 });
  }

  if (ret.complexity >= 4) {
    reasons.push({ label: 'Complex return — start early', weight: 12 });
  }

  if (ret.unreadMessages > 0) {
    reasons.push({
      label: `${ret.unreadMessages} unread message${ret.unreadMessages > 1 ? 's' : ''}`,
      weight: 8 * ret.unreadMessages,
    });
  }

  const score = reasons.reduce((s, r) => s + r.weight, 0);
  reasons.sort((a, b) => b.weight - a.weight);

  return { ret, bucket, score, reasons };
}

export function rankAll(returns: TaxReturn[]): RankedReturn[] {
  return returns.map(rankReturn).sort((a, b) => b.score - a.score);
}

export interface QueueView {
  act: RankedReturn[];
  chase: RankedReturn[];
  clear: RankedReturn[];
}

export function buildQueueView(returns: TaxReturn[], assigneeId?: string): QueueView {
  const scoped = assigneeId ? returns.filter((r) => r.preparerId === assigneeId) : returns;
  const ranked = rankAll(scoped);
  return {
    act: ranked.filter((r) => r.bucket === 'act'),
    chase: ranked.filter((r) => r.bucket === 'chase'),
    clear: ranked.filter((r) => r.bucket === 'clear'),
  };
}

/* ------------------------------------------------------------------ */
/* Practice-level roll-up, for the manager view                        */
/* ------------------------------------------------------------------ */

export function practiceStats(returns: TaxReturn[]) {
  const active = returns.filter((r) => r.stage !== 'filed');
  const atRisk = active.filter((r) => !r.onExtension && daysUntil(r.dueDate) <= 21);
  const blockedOnClient = active.filter((r) =>
    r.blockers.some((b) => b.owner === 'client' && b.severity === 'blocking'),
  );
  const awaitingReview = returns.filter((r) => r.stage === 'review');

  return {
    total: returns.length,
    active: active.length,
    filed: returns.length - active.length,
    atRisk: atRisk.length,
    blockedOnClient: blockedOnClient.length,
    awaitingReview: awaitingReview.length,
    openFindings: active.reduce((s, r) => s + r.aiFlagsOpen, 0),
  };
}

/* ------------------------------------------------------------------ */
/* Drill-down: a dashboard stat tile is a filtered list of returns.    */
/* One predicate defines both the tile's count and the list it opens,  */
/* so the number on the card can never disagree with what you land on. */

export type StatFilter =
  | 'actionable'
  | 'waiting'
  | 'at-risk'
  | 'blocked-client'
  | 'ai'
  | 'in-review'
  | 'active'
  | 'filed';

export function matchesStat(ret: TaxReturn, filter: StatFilter): boolean {
  switch (filter) {
    case 'filed':
      return ret.stage === 'filed';
    case 'active':
      return ret.stage !== 'filed';
    case 'in-review':
      return ret.stage === 'review';
    // The product's core split: work you can do vs. work you're waiting on.
    // bucketOf already treats a filed return as 'clear', so both exclude it.
    case 'actionable':
      return bucketOf(ret) === 'act';
    case 'waiting':
      return bucketOf(ret) === 'chase';
    case 'at-risk':
      return ret.stage !== 'filed' && !ret.onExtension && daysUntil(ret.dueDate) <= 21;
    case 'blocked-client':
      return (
        ret.stage !== 'filed' &&
        ret.blockers.some((b) => b.owner === 'client' && b.severity === 'blocking')
      );
    case 'ai':
      return ret.stage !== 'filed' && ret.aiFlagsOpen > 0;
  }
}

export const STAT_FILTER_LABEL: Record<StatFilter, string> = {
  actionable: 'To do — you can act now',
  waiting: 'Waiting on clients',
  'at-risk': 'Deadline within 3 weeks',
  'blocked-client': 'Blocked on clients',
  ai: 'Returns with open AI findings',
  'in-review': 'In review',
  active: 'Active returns',
  filed: 'Filed',
};
