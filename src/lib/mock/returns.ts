import type { Audience, Blocker, FormType, ReturnStage, TaxReturn } from '../types';
import { Rand } from './rng';
import { HERO_CLIENT_ID, HERO_RETURN_ID } from './users';

/* ==================================================================
   Returns
   ------------------------------------------------------------------
   One hand-built hero return (everything the demo drills into) plus a
   generated firm queue of ~140 more, because a dashboard that answers
   "what should I work on right now?" is only interesting when there is
   too much work to eyeball. Ch.07 explicitly asks that it stay usable
   at hundreds of returns.
   ================================================================== */

export const HERO_RETURN: TaxReturn = {
  id: HERO_RETURN_ID,
  clientId: HERO_CLIENT_ID,
  clientName: 'Marcus Delgado',
  taxYear: 2025,
  formType: '1040',
  stage: 'preparing',
  // Three weeks in preparation. Genuinely stale, which is why the ranking
  // surfaces it first — not because the demo needs it to.
  stageSince: '2026-02-19T09:00:00Z',
  preparerId: 'u-jordan',
  reviewerId: 'u-lin',
  nextActionOwner: 'firm',
  nextActionLabel: 'Resolve 3 open AI findings',
  blockers: [
    {
      id: 'blk-k1',
      label: 'K-1 scan is unreadable — a clean copy is needed',
      owner: 'client',
      severity: 'blocking',
      href: `/returns/${HERO_RETURN_ID}/documents?doc=doc-k1-delgado`,
    },
    {
      id: 'blk-qbi',
      label: 'QBI position needs credentialed sign-off',
      owner: 'firm',
      severity: 'blocking',
      href: `/returns/${HERO_RETURN_ID}/review?field=fld-qbi`,
    },
    {
      id: 'blk-int',
      label: 'Coastal Credit Union 1099-INT not yet provided',
      owner: 'client',
      severity: 'warning',
      href: `/returns/${HERO_RETURN_ID}/messages`,
    },
  ],
  openQuestions: 2,
  unreadMessages: 1,
  documentCount: 328,
  refundOrDue: -9044,
  dueDate: '2026-04-15T00:00:00Z',
  onExtension: false,
  complexity: 4,
  aiFlagsOpen: 5,
  lowConfidenceFields: 1,
  fee: 2400,
};

/** Ch.05 edge case: a staff member's own personal return. */
export const ROSA_RETURN: TaxReturn = {
  id: 'ret-rosa-1040',
  clientId: 'u-rosa',
  clientName: 'Rosa Iglesias',
  taxYear: 2025,
  formType: '1040',
  stage: 'client_approval',
  stageSince: '2026-03-09T14:00:00Z',
  preparerId: 'u-lin',
  reviewerId: 'u-lin',
  nextActionOwner: 'client',
  nextActionLabel: 'Review and approve your return',
  blockers: [],
  openQuestions: 0,
  unreadMessages: 1,
  documentCount: 14,
  refundOrDue: 2180,
  dueDate: '2026-04-15T00:00:00Z',
  onExtension: false,
  complexity: 1,
  aiFlagsOpen: 0,
  lowConfidenceFields: 0,
  fee: 450,
};

/** A second client, used to prove the client experience isn't hard-coded to Marcus. */
export const PRIYA_RETURN: TaxReturn = {
  id: 'ret-priya-1040',
  clientId: 'u-priya',
  clientName: 'Priya Raghunathan',
  taxYear: 2025,
  formType: '1040',
  stage: 'intake',
  stageSince: '2026-03-10T10:00:00Z',
  preparerId: 'u-jordan',
  nextActionOwner: 'client',
  nextActionLabel: 'Upload your W-2 to get started',
  blockers: [
    {
      id: 'blk-priya-w2',
      label: 'No income documents uploaded yet',
      owner: 'client',
      severity: 'blocking',
      href: '/returns/ret-priya-1040/documents',
    },
  ],
  openQuestions: 4,
  unreadMessages: 1,
  documentCount: 0,
  refundOrDue: 0,
  dueDate: '2026-04-15T00:00:00Z',
  onExtension: false,
  complexity: 1,
  aiFlagsOpen: 0,
  lowConfidenceFields: 0,
  fee: 350,
};

/* ------------------------------------------------------------------ */
/* Generated firm queue                                                */
/* ------------------------------------------------------------------ */

const FIRST = [
  'Amara', 'Devin', 'Sofia', 'Elliot', 'Naomi', 'Tobias', 'Ingrid', 'Rafael', 'Yuki', 'Cormac',
  'Beatriz', 'Hassan', 'Wren', 'Desmond', 'Lucia', 'Anders', 'Priyanka', 'Malik', 'Freya', 'Ozias',
  'Camille', 'Theo', 'Anika', 'Bruno', 'Saoirse', 'Idris', 'Marlow', 'Zara', 'Emeka', 'Juno',
  'Kai', 'Rosalind', 'Fabian', 'Noor', 'Grady', 'Sela', 'Viktor', 'Imani', 'Casper', 'Delphine',
];

const LAST = [
  'Okafor', 'Brennan', 'Villanueva', 'Kaur', 'Lindqvist', 'Moreau', 'Ferrara', 'Adeyemi',
  'Novak', 'Sørensen', 'Castellanos', 'Mbeki', 'Whitlock', 'Rahman', 'Petrov', 'Nakagawa',
  'Duarte', 'Halloran', 'Bergström', 'Oyelaran', 'Marchetti', 'Sandoval', 'Kowalski', 'Baptiste',
  'Ellington', 'Fournier', 'Aguilar', 'Strand', 'Chukwu', 'Vasquez',
];

const BLOCKER_TEMPLATES: ReadonlyArray<readonly [string, Audience, Blocker['severity']]> = [
  ['Missing prior-year return', 'client', 'blocking'],
  ['Brokerage 1099 not yet issued', 'client', 'warning'],
  ['Awaiting signed engagement letter', 'client', 'blocking'],
  ['K-1 from partnership outstanding', 'client', 'blocking'],
  ['Depreciation schedule needs rebuilding', 'firm', 'warning'],
  ['Foreign account reporting question unresolved', 'firm', 'blocking'],
  ['Client has not answered residency question', 'client', 'warning'],
  ['Second reviewer requested', 'firm', 'warning'],
];

const NEXT_ACTIONS: Record<ReturnStage, readonly string[]> = {
  intake: ['Chase outstanding documents', 'Send document checklist', 'Confirm engagement letter'],
  questions: ['Follow up on open questions', 'Call client about business mileage', 'Clarify dependent status'],
  preparing: ['Resolve AI findings', 'Complete Schedule C', 'Reconcile brokerage basis', 'Draft the return'],
  review: ['Review depreciation', 'Check state apportionment', 'Second-pass review'],
  client_approval: ['Nudge client for e-signature', 'Walk client through the result'],
  filed: ['Archive workpapers', 'Send closing letter'],
};

/**
 * Builds the rest of the firm's book of business. Weighted so the queue
 * looks like a real filing season in mid-March: mostly in-flight work, a
 * meaningful tail already filed, and a stubborn set still in intake.
 */
export function buildQueue(count = 140): TaxReturn[] {
  const rand = new Rand(770315);
  const anchor = new Date('2026-03-12T00:00:00Z');
  const preparers = ['u-jordan', 'u-lin', 'u-rosa', 'u-sam'];
  const out: TaxReturn[] = [];

  for (let i = 0; i < count; i++) {
    const stage = rand.weighted([
      ['intake', 16],
      ['questions', 20],
      ['preparing', 28],
      ['review', 16],
      ['client_approval', 12],
      ['filed', 18],
    ] as const) as ReturnStage;

    const formType = rand.weighted([
      ['1040', 70],
      ['1120S', 14],
      ['1065', 10],
      ['1120', 6],
    ] as const) as FormType;

    const onExtension = stage !== 'filed' && rand.bool(0.16);
    const complexity = rand.weighted([[1, 20], [2, 30], [3, 26], [4, 16], [5, 8]] as const);

    const blockerCount =
      stage === 'filed' ? 0 : rand.weighted([[0, 55], [1, 30], [2, 12], [3, 3]] as const);

    const blockers: Blocker[] = [];
    const used = new Set<number>();
    for (let b = 0; b < blockerCount; b++) {
      let idx = rand.int(0, BLOCKER_TEMPLATES.length - 1);
      let guard = 0;
      while (used.has(idx) && guard++ < 8) idx = rand.int(0, BLOCKER_TEMPLATES.length - 1);
      used.add(idx);
      const [label, owner, severity] = BLOCKER_TEMPLATES[idx]!;
      blockers.push({ id: `blk-${i}-${b}`, label, owner, severity });
    }

    const nextActionOwner: Audience =
      stage === 'filed'
        ? 'firm'
        : blockers.some((b) => b.owner === 'client' && b.severity === 'blocking')
          ? 'client'
          : rand.weighted([['firm', 62], ['client', 38]] as const);

    const id = `ret-${i.toString().padStart(3, '0')}`;
    // Pass-through entities are due a month before individuals. Modelling the
    // real calendar is what gives the dashboard genuine deadline spread —
    // with one universal date, every ranking looks the same.
    const entityReturn = formType === '1065' || formType === '1120S';
    const dueDate = onExtension
      ? entityReturn
        ? '2026-09-15T00:00:00Z'
        : '2026-10-15T00:00:00Z'
      : entityReturn
        ? '2026-03-16T00:00:00Z'
        : '2026-04-15T00:00:00Z';
    const refundOrDue = rand.bool(0.62)
      ? rand.money(180, 14500, 10)
      : -rand.money(220, 26000, 10);

    out.push({
      id,
      clientId: `c-${i}`,
      clientName: `${rand.pick(FIRST)} ${rand.pick(LAST)}`,
      taxYear: 2025,
      formType,
      stage,
      stageSince: rand.dateOffset(anchor, -34, -1),
      preparerId: rand.pick(preparers),
      reviewerId: rand.bool(0.7) ? 'u-lin' : undefined,
      nextActionOwner,
      nextActionLabel: rand.pick(NEXT_ACTIONS[stage]),
      blockers,
      openQuestions: stage === 'filed' ? 0 : rand.weighted([[0, 46], [1, 24], [2, 16], [3, 9], [5, 5]] as const),
      unreadMessages: rand.weighted([[0, 66], [1, 22], [2, 9], [4, 3]] as const),
      documentCount: rand.int(4, 190),
      refundOrDue,
      dueDate,
      onExtension,
      complexity,
      aiFlagsOpen: stage === 'filed' ? 0 : rand.weighted([[0, 44], [1, 24], [2, 16], [3, 10], [6, 6]] as const),
      lowConfidenceFields: stage === 'filed' ? 0 : rand.weighted([[0, 66], [1, 22], [2, 9], [4, 3]] as const),
      fee: rand.money(350, 6800, 25),
    });
  }

  return out;
}

/**
 * Ch.05 business-owner case: Marcus files personally (the hero 1040) AND for
 * his S-corp. This is that entity return, sharing his client id so the two
 * surface together in the entity switcher. The K-1 on his personal return is
 * issued *by* this company, which is why a business owner needs to move
 * between the two rather than treating them as unrelated files.
 *
 * Content (documents, figures, threads) is synthesised by derive.ts like every
 * non-hero return; only the summary lives here. The 1120S deadline is March 15,
 * a fortnight before the personal April 15 — so the two filings are genuinely
 * on different clocks, which is half the reason they're easy to conflate.
 */
export const MARCUS_ENTITY_RETURN: TaxReturn = {
  id: 'ret-delgado-1120s',
  clientId: HERO_CLIENT_ID,
  clientName: 'Delgado Studio Inc.',
  taxYear: 2025,
  formType: '1120S',
  stage: 'review',
  stageSince: '2026-03-03T09:00:00Z',
  preparerId: 'u-jordan',
  reviewerId: 'u-lin',
  nextActionOwner: 'firm',
  nextActionLabel: 'Finalise the shareholder K-1',
  blockers: [
    {
      id: 'blk-delgado-basis',
      label: 'Shareholder basis schedule needs a second look',
      owner: 'firm',
      severity: 'warning',
      href: '/returns/ret-delgado-1120s/documents',
    },
  ],
  openQuestions: 1,
  unreadMessages: 1,
  documentCount: 22,
  refundOrDue: 0,
  dueDate: '2026-03-15T00:00:00Z',
  onExtension: false,
  complexity: 3,
  aiFlagsOpen: 2,
  lowConfidenceFields: 1,
  fee: 1800,
};

export const ALL_RETURNS: TaxReturn[] = [
  HERO_RETURN,
  MARCUS_ENTITY_RETURN,
  ROSA_RETURN,
  PRIYA_RETURN,
  ...buildQueue(),
];

export const RETURN_BY_ID: Record<string, TaxReturn> = Object.fromEntries(
  ALL_RETURNS.map((r) => [r.id, r]),
);
