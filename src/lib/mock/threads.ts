import type { Thread } from '../types';
import { DOC } from './documents';
import { HERO_RETURN_ID } from './users';

/* ==================================================================
   Ch.02 — Client & CPA collaboration
   ------------------------------------------------------------------
   Three design positions are encoded in this data:

   1. NOTHING IS FLOATING. Every thread has an `anchor` — a document, a
      field or a task. There is no way to start a conversation about
      nothing, which is precisely what turns a collaboration tool into
      an inbox.

   2. INTERNAL VS SHARED IS A PROPERTY OF THE THREAD, and `internalOnly`
      can additionally hide a single message inside a shared thread. The
      second one matters: staff need to say something to each other
      without spawning a parallel thread that later desyncs.

   3. `nextActionOwner` IS REQUIRED. A thread always knows whose move it
      is, so "outstanding requests" is a view over real state rather
      than a separate to-do list someone has to maintain by hand.
   ================================================================== */

const R = HERO_RETURN_ID;

export const HERO_THREADS: Thread[] = [
  /* --- A formal outstanding request, anchored to the unreadable K-1 --- */
  {
    id: 'thr-k1',
    returnId: R,
    subject: 'Clean copy of your K-1',
    visibility: 'shared',
    anchor: { type: 'document', id: DOC.k1, label: 'Schedule K-1 — Delgado Studio Inc.' },
    participantIds: ['u-jordan', 'u-marcus', 'u-lin'],
    nextActionOwner: 'client',
    status: 'awaiting_client',
    updatedAt: '2026-03-10T09:14:00Z',
    request: {
      what: 'A clean scan or PDF of the 2025 Schedule K-1',
      dueDate: '2026-03-17T00:00:00Z',
      fulfilled: false,
    },
    messages: [
      {
        id: 'm-k1-1',
        threadId: 'thr-k1',
        authorId: 'u-jordan',
        sentAt: '2026-03-04T11:02:00Z',
        body: "Hi Marcus — the K-1 that came through is a phone photo and the ordinary income box isn't quite legible. Could you send the PDF your bookkeeper generated? It'll save us guessing on the biggest number on your return.",
        attachments: [{ documentId: DOC.k1, name: 'Schedule K-1 — Delgado Studio Inc.' }],
      },
      {
        id: 'm-k1-2',
        threadId: 'thr-k1',
        authorId: 'u-marcus',
        sentAt: '2026-03-06T18:40:00Z',
        body: "Sure — I'll ask Renée for it. She's out until Monday so it might be early next week.",
      },
      {
        id: 'm-k1-3',
        threadId: 'thr-k1',
        authorId: 'u-lin',
        sentAt: '2026-03-06T19:05:00Z',
        internalOnly: true,
        body: "If it doesn't land by Wednesday let's just pull the figure from the 1120-S we filed for the entity — we prepared it, so we have the source. Don't hold the whole return for this.",
      },
      {
        id: 'm-k1-4',
        threadId: 'thr-k1',
        authorId: 'u-jordan',
        sentAt: '2026-03-10T09:14:00Z',
        body: 'No rush at all — just flagging that this is the last thing holding up your draft. Monday is fine.',
      },
    ],
  },

  /* --- Anchored to a FIELD, not a document: the corrected-1099 question --- */
  {
    id: 'thr-northwind',
    returnId: R,
    subject: 'Northwind Labs — two 1099s',
    visibility: 'shared',
    anchor: { type: 'field', id: 'fld-gross-receipts', label: 'Schedule C, Line 1 — Gross receipts' },
    participantIds: ['u-jordan', 'u-marcus'],
    nextActionOwner: 'firm',
    status: 'awaiting_firm',
    updatedAt: '2026-03-09T16:22:00Z',
    messages: [
      {
        id: 'm-nw-1',
        threadId: 'thr-northwind',
        authorId: 'u-jordan',
        sentAt: '2026-03-09T10:30:00Z',
        body: "Northwind sent a corrected 1099 at the end of February — $16,900 instead of the original $18,400. Do you know what they adjusted? I want to make sure it isn't a payment that landed in January 2026 rather than a genuine correction.",
      },
      {
        id: 'm-nw-2',
        threadId: 'thr-northwind',
        authorId: 'u-marcus',
        sentAt: '2026-03-09T16:22:00Z',
        body: "Yes — they'd double-counted an invoice I'd already been paid for in 2024. The $16,900 is right.",
      },
    ],
  },

  /* --- A purely internal thread: the QBI escalation --- */
  {
    id: 'thr-qbi',
    returnId: R,
    subject: 'QBI / SSTB call on the consulting income',
    visibility: 'internal',
    anchor: { type: 'field', id: 'fld-qbi', label: 'Form 1040, Line 13 — QBI deduction' },
    participantIds: ['u-jordan', 'u-lin'],
    nextActionOwner: 'firm',
    status: 'open',
    updatedAt: '2026-03-11T08:50:00Z',
    messages: [
      {
        id: 'm-qbi-1',
        threadId: 'thr-qbi',
        authorId: 'u-jordan',
        sentAt: '2026-03-05T14:05:00Z',
        body: "Lin — this is above my line. Taxable income lands at $102,828, so we're inside the phase-in and SSTB status actually bites. The SOWs mostly read as product design and build, but two of the Brightpath ones say 'advisory'. $15,369 of deduction riding on it. Can you make the call?",
      },
      {
        id: 'm-qbi-2',
        threadId: 'thr-qbi',
        authorId: 'u-lin',
        sentAt: '2026-03-11T08:50:00Z',
        body: "Good catch flagging rather than guessing. Send me the four Brightpath SOWs and I'll document the position — my instinct is non-SSTB but I want the language in the file before we take the deduction.",
      },
    ],
  },

  /* --- The outstanding document request the client can act on --- */
  {
    id: 'thr-coastal',
    returnId: R,
    subject: 'Coastal Credit Union 1099-INT',
    visibility: 'shared',
    anchor: { type: 'document', id: DOC.statement, label: 'Coastal Credit Union — December statement' },
    participantIds: ['u-jordan', 'u-marcus'],
    nextActionOwner: 'client',
    status: 'awaiting_client',
    updatedAt: '2026-03-05T09:00:00Z',
    request: {
      what: '1099-INT from Coastal Credit Union (account ····4471)',
      dueDate: '2026-03-20T00:00:00Z',
      fulfilled: false,
    },
    messages: [
      {
        id: 'm-cc-1',
        threadId: 'thr-coastal',
        authorId: 'u-jordan',
        sentAt: '2026-03-05T09:00:00Z',
        body: "Your December Coastal statement shows $742 of interest for the year, but we don't have the 1099-INT for that account. It's usually in online banking under Tax Documents — could you grab it? It's a small number but it has to be on the return.",
      },
    ],
  },

  /* --- Resolved, to prove threads have a lifecycle --- */
  {
    id: 'thr-mileage',
    returnId: R,
    subject: 'Business mileage for 2025',
    visibility: 'shared',
    anchor: { type: 'task', id: 'tsk-mileage', label: 'Confirm business mileage' },
    participantIds: ['u-jordan', 'u-marcus'],
    nextActionOwner: 'firm',
    status: 'resolved',
    updatedAt: '2026-02-28T12:10:00Z',
    messages: [
      {
        id: 'm-mi-1',
        threadId: 'thr-mileage',
        authorId: 'u-jordan',
        sentAt: '2026-02-26T10:00:00Z',
        body: 'Your mileage log stops in September. Did you drive for work in Q4?',
      },
      {
        id: 'm-mi-2',
        threadId: 'thr-mileage',
        authorId: 'u-marcus',
        sentAt: '2026-02-28T12:10:00Z',
        body: 'Barely — everything was remote after October. Maybe two client visits, both local.',
      },
    ],
  },
];

export const THREAD_BY_ID: Record<string, Thread> = Object.fromEntries(
  HERO_THREADS.map((t) => [t.id, t]),
);

/** Outstanding requests, derived rather than maintained separately. */
export function outstandingRequests(threads: Thread[] = HERO_THREADS) {
  return threads.filter((t) => t.request && !t.request.fulfilled);
}
