import type { Audience, ReturnStage, StageProfile } from './types';

/* ==================================================================
   Ch.06 — Return status & progress
   ------------------------------------------------------------------
   The problem with "In Progress" is not that it is vague; it is that it
   is a single label doing two incompatible jobs. A client wants to know
   "is anything required of me?", staff want to know "what operational
   bucket is this in?".

   So: ONE ladder, ONE position, TWO vocabularies — plus a `meaning`
   string that is shown verbatim to BOTH audiences. Client and preparer
   can hover the same badge, read the same sentence, and be certain they
   are talking about the same thing.

   Crucially, the stage never answers "who acts next". That is tracked
   separately on the return (`nextActionOwner`), because ownership flips
   back and forth inside a single stage and conflating the two is what
   makes legacy status fields lie.
   ================================================================== */

export const STAGES: Record<ReturnStage, StageProfile> = {
  intake: {
    stage: 'intake',
    order: 0,
    clientLabel: 'Collecting documents',
    firmLabel: 'Intake',
    meaning:
      'We are gathering the source documents needed to start. Nothing has been prepared yet.',
    defaultOwner: 'client',
  },
  questions: {
    stage: 'questions',
    order: 1,
    clientLabel: 'Questions for you',
    firmLabel: 'Open items',
    meaning:
      'The documents are in, but specific facts still need confirming before the return can be built.',
    defaultOwner: 'client',
  },
  preparing: {
    stage: 'preparing',
    order: 2,
    clientLabel: 'We are preparing your return',
    firmLabel: 'In preparation',
    meaning:
      'Your preparer is building the return from the documents and answers provided. No action is needed from you right now.',
    defaultOwner: 'firm',
  },
  review: {
    stage: 'review',
    order: 3,
    clientLabel: 'Final review by a credentialed CPA',
    firmLabel: 'Credentialed review',
    meaning:
      'A licensed reviewer is checking every figure and the positions taken before anything is shown to you for approval.',
    defaultOwner: 'firm',
  },
  client_approval: {
    stage: 'client_approval',
    order: 4,
    clientLabel: 'Your approval needed',
    firmLabel: 'Awaiting client sign-off',
    meaning:
      'The return is finished and accurate as far as we can tell. It cannot be filed until you review and approve it.',
    defaultOwner: 'client',
  },
  filed: {
    stage: 'filed',
    order: 5,
    clientLabel: 'Filed',
    firmLabel: 'Filed & accepted',
    meaning: 'The return has been transmitted and accepted. Nothing further is required.',
    defaultOwner: 'firm',
  },
};

export const STAGE_ORDER: ReturnStage[] = [
  'intake',
  'questions',
  'preparing',
  'review',
  'client_approval',
  'filed',
];

export function stageLabel(stage: ReturnStage, audience: Audience) {
  const p = STAGES[stage];
  return audience === 'client' ? p.clientLabel : p.firmLabel;
}

export function stageIndex(stage: ReturnStage) {
  return STAGES[stage].order;
}

/** Progress as a fraction, for bars and rings. `filed` is the only 100%. */
export function stageProgress(stage: ReturnStage) {
  return STAGES[stage].order / (STAGE_ORDER.length - 1);
}

export function isBefore(a: ReturnStage, b: ReturnStage) {
  return STAGES[a].order < STAGES[b].order;
}

/**
 * The single sentence that goes at the top of a client's screen. Ownership
 * beats stage: if the ball is with the client, say so first and loudly,
 * because that is the only case where the answer to "do I need to do
 * something?" is yes.
 */
export function headlineFor(
  stage: ReturnStage,
  nextActionOwner: Audience,
  nextActionLabel: string,
  audience: Audience,
) {
  if (audience === 'client') {
    return nextActionOwner === 'client'
      ? { primary: nextActionLabel, secondary: STAGES[stage].clientLabel, actionable: true }
      : { primary: STAGES[stage].clientLabel, secondary: 'Nothing needed from you', actionable: false };
  }
  return nextActionOwner === 'firm'
    ? { primary: nextActionLabel, secondary: STAGES[stage].firmLabel, actionable: true }
    : { primary: `Waiting on client`, secondary: nextActionLabel, actionable: false };
}
