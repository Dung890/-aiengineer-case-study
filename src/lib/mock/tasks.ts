import type { Task } from '../types';
import { DOC } from './documents';
import { HERO_RETURN_ID } from './users';

/* ==================================================================
   Tasks
   ------------------------------------------------------------------
   Tasks carry `links`, which is what makes Ch.04's "related objects"
   rail possible: from a task you can always reach the document, field
   or thread it concerns, and from any of those you can find the task.
   The graph is bidirectional and resolved at read time in lib/graph.ts.
   ================================================================== */

const R = HERO_RETURN_ID;

export const HERO_TASKS: Task[] = [
  {
    id: 'tsk-k1',
    returnId: R,
    title: 'Send a clean copy of your K-1',
    detail:
      'The photo we have is too low-resolution to read the ordinary income box. A PDF from your bookkeeper is ideal.',
    kind: 'upload',
    status: 'open',
    owner: 'client',
    priority: 'urgent',
    dueDate: '2026-03-17T00:00:00Z',
    links: [
      { type: 'document', id: DOC.k1, label: 'Schedule K-1 — Delgado Studio Inc.' },
      { type: 'thread', id: 'thr-k1', label: 'Clean copy of your K-1' },
      { type: 'field', id: 'fld-k1-income', label: 'Schedule E — S-corp ordinary income' },
    ],
  },
  {
    id: 'tsk-coastal',
    returnId: R,
    title: 'Upload your Coastal Credit Union 1099-INT',
    detail: 'Account ····4471. Usually under “Tax Documents” in online banking.',
    kind: 'upload',
    status: 'open',
    owner: 'client',
    priority: 'high',
    dueDate: '2026-03-20T00:00:00Z',
    links: [
      { type: 'thread', id: 'thr-coastal', label: 'Coastal Credit Union 1099-INT' },
      { type: 'field', id: 'fld-interest', label: 'Form 1040, Line 2b — Taxable interest' },
      { type: 'insight', id: 'ins-missing-1099int', label: 'Interest income with no matching 1099-INT' },
    ],
  },
  {
    id: 'tsk-qbi-review',
    returnId: R,
    title: 'Credentialed review — QBI / SSTB position',
    detail: 'Escalated by Jordan Avery. $15,369 of deduction depends on the determination.',
    kind: 'review',
    status: 'in_progress',
    owner: 'firm',
    assigneeId: 'u-lin',
    priority: 'urgent',
    dueDate: '2026-03-16T00:00:00Z',
    links: [
      { type: 'field', id: 'fld-qbi', label: 'Form 1040, Line 13 — QBI deduction' },
      { type: 'thread', id: 'thr-qbi', label: 'QBI / SSTB call on the consulting income' },
      { type: 'insight', id: 'ins-qbi-sstb', label: 'QBI deduction depends on an SSTB judgement' },
    ],
  },
  {
    id: 'tsk-northwind',
    returnId: R,
    title: 'Apply the corrected Northwind 1099',
    detail: 'Marcus confirmed the $16,900 figure is correct. Exclude the superseded original.',
    kind: 'verify',
    status: 'open',
    owner: 'firm',
    assigneeId: 'u-jordan',
    priority: 'high',
    links: [
      { type: 'field', id: 'fld-gross-receipts', label: 'Schedule C, Line 1 — Gross receipts' },
      { type: 'insight', id: 'ins-duplicate-1099', label: 'Northwind Labs filed a corrected 1099-NEC' },
      { type: 'thread', id: 'thr-northwind', label: 'Northwind Labs — two 1099s' },
      { type: 'document', id: DOC.necCorrected, label: '1099-NEC — Northwind Labs (CORRECTED)' },
    ],
  },
  {
    id: 'tsk-estimates',
    returnId: R,
    title: 'Set up 2026 quarterly estimates',
    detail: 'Prior-year safe harbour protects 2025, but it will not apply next year.',
    kind: 'call',
    status: 'open',
    owner: 'firm',
    assigneeId: 'u-jordan',
    priority: 'normal',
    dueDate: '2026-04-15T00:00:00Z',
    links: [
      { type: 'field', id: 'fld-estimated-payments', label: 'Form 1040, Line 26 — Estimated payments' },
      { type: 'insight', id: 'ins-estimated-penalty', label: 'Underpayment penalty likely' },
    ],
  },
  {
    id: 'tsk-mileage',
    returnId: R,
    title: 'Confirm business mileage',
    kind: 'answer',
    status: 'done',
    owner: 'client',
    priority: 'normal',
    links: [{ type: 'thread', id: 'thr-mileage', label: 'Business mileage for 2025' }],
  },
];

/* ------------------------------------------------------------------ */
/* Ch.03 — the brand-new client's onboarding                           */
/* ------------------------------------------------------------------ */

/**
 * Priya has just logged in for the first time. Her list is deliberately
 * SHORT and ORDERED: the first-run screen shows exactly one next action,
 * and the rest of the product stays hidden until it can mean something.
 */
export const ONBOARDING_TASKS: Task[] = [
  {
    id: 'ob-1',
    returnId: 'ret-priya-1040',
    title: 'Confirm who’s on your return',
    detail: 'Filing status, and anyone you support. Two minutes.',
    kind: 'answer',
    status: 'done',
    owner: 'client',
    priority: 'high',
    links: [],
    onboardingStep: 1,
  },
  {
    id: 'ob-2',
    returnId: 'ret-priya-1040',
    title: 'Upload your W-2',
    detail:
      'One document gets you started. Everything else can follow — we’ll tell you what’s missing as we go.',
    kind: 'upload',
    status: 'open',
    owner: 'client',
    priority: 'urgent',
    dueDate: '2026-03-19T00:00:00Z',
    links: [],
    onboardingStep: 2,
  },
  {
    id: 'ob-3',
    returnId: 'ret-priya-1040',
    title: 'Answer 4 questions about your year',
    detail: 'Did you move, marry, buy a home, or start a business?',
    kind: 'answer',
    status: 'open',
    owner: 'client',
    priority: 'normal',
    links: [],
    onboardingStep: 3,
  },
  {
    id: 'ob-4',
    returnId: 'ret-priya-1040',
    title: 'Meet your concierge',
    detail: 'A 15-minute call with Jordan once your documents are in.',
    kind: 'call',
    status: 'blocked',
    owner: 'client',
    priority: 'low',
    links: [],
    onboardingStep: 4,
  },
];

export const ALL_TASKS: Task[] = [...HERO_TASKS, ...ONBOARDING_TASKS];

export const TASK_BY_ID: Record<string, Task> = Object.fromEntries(
  ALL_TASKS.map((t) => [t.id, t]),
);
