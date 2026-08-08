import type {
  AIInsight,
  DocumentRegion,
  Provenance,
  ReturnField,
  SourceDocument,
  Task,
  TaxReturn,
  Thread,
} from '../types';
import { Rand } from './rng';
import { buildBulkDocuments } from './documents';

/* ==================================================================
   Derived content for every other return
   ------------------------------------------------------------------
   Marcus is modelled by hand because the traceability demo needs
   per-box coordinates. But a queue of 140 clients that all open onto
   empty screens is worse than a queue of five that don't — the moment
   a reviewer clicks a name we didn't anticipate, the whole thing reads
   as a facade.

   So every other return synthesises its own documents, figures, tasks
   and conversations, deterministically seeded from its id. The content
   is shallower than Marcus's on purpose (no box-level provenance, no
   hand-written AI reasoning) but it is internally consistent: the
   figures foot, the tasks match the return's actual blockers, and the
   threads are anchored to documents that really exist on that return.
   ================================================================== */

/** Stable numeric seed from a return id, so content never shifts. */
function seedOf(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/* ------------------------------------------------------------------ */
/* Documents                                                           */
/* ------------------------------------------------------------------ */

export function deriveBulkDocuments(ret: TaxReturn, reserve: number): SourceDocument[] {
  const count = Math.max(0, Math.max(6, ret.documentCount) - reserve);
  const docs = buildBulkDocuments(ret.id, count);
  // Re-key so ids can't collide with the hero return's bulk documents, and use
  // a "b" prefix so they never clash with the derived facsimile documents.
  return docs.map((d, i) => ({
    ...d,
    id: `${ret.id}-doc-b${i.toString().padStart(3, '0')}`,
    returnId: ret.id,
  }));
}

/* ------------------------------------------------------------------ */
/* Source documents + figures (Ch.01 traceability)                     */
/* ------------------------------------------------------------------ */

/**
 * Derived returns used to open onto "No source document" — a figure with no
 * form behind it. Now every one carries a couple of rendered facsimiles (a W-2
 * and 1099-INTs for an individual; a year-end P&L and a K-1 for an entity) with
 * real, positioned boxes, and each income line cites the exact box. So the
 * click-to-trace interaction works on every return, not just the hand-built
 * hero — and the numbers on the form match the numbers on the return, because
 * both are computed here, once.
 */

const EMPLOYERS = [
  'Halcyon Design Group LLC',
  'Meridian Systems Inc.',
  'Cormorant Media Co.',
  'Vantage Analytics LLC',
  'Brightwater Studios LLC',
  'Kestrel Robotics Inc.',
];
const BANKS = [
  'Coastal Credit Union',
  'Meridian Savings Bank',
  'First Cascade Bank',
  'Harbor Point Financial',
  'Evergreen Trust',
];

function money2(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Local region builder — same shape the hand-built documents use. */
function reg(
  documentId: string,
  id: string,
  boxNo: string | undefined,
  label: string,
  rawText: string,
  kind: DocumentRegion['kind'],
  x: number,
  y: number,
  w: number,
  h: number,
): DocumentRegion {
  return { id, documentId, page: 1, boxNo, label, rawText, kind, bbox: { x, y, w, h } };
}

/**
 * Everything a derived return needs, computed once: the rendered source
 * documents and the return fields that cite them. Called by `derived()`.
 */
export function deriveFinancials(ret: TaxReturn): {
  sourceDocs: SourceDocument[];
  fields: ReturnField[];
} {
  const rand = new Rand(seedOf(ret.id));
  const entity = ret.formType === '1120S' || ret.formType === '1065' || ret.formType === '1120';
  const lowConf = ret.lowConfidenceFields;
  const flags = ret.aiFlagsOpen;

  const doc = (
    slug: string,
    name: string,
    kind: SourceDocument['kind'],
    issuer: string,
    category: SourceDocument['category'],
    facsimile: SourceDocument['facsimile'],
    regions: DocumentRegion[],
  ): SourceDocument => ({
    id: `${ret.id}-doc-${slug}`,
    returnId: ret.id,
    name,
    kind,
    issuer,
    pages: 1,
    status: 'extracted',
    uploadedAt: ret.stageSince,
    uploadedBy: ret.clientId,
    sizeKb: rand.int(90, 480),
    regions,
    facsimile,
    category,
  });

  const f = (
    id: string,
    lineRef: string,
    label: string,
    section: ReturnField['section'],
    value: number,
    state: ReturnField['state'],
    steps: Provenance['steps'],
    opts: {
      sources?: Provenance['sources'];
      rule?: string;
      citation?: string;
      confidence?: number;
      lockReason?: string;
    } = {},
  ): ReturnField => ({
    id: `${ret.id}-${id}`,
    returnId: ret.id,
    lineRef,
    label,
    section,
    value,
    state,
    provenance: { sources: opts.sources ?? [], steps, rule: opts.rule, citation: opts.citation },
    ...(opts.confidence !== undefined ? { confidence: opts.confidence } : {}),
    ...(opts.lockReason !== undefined ? { lockReason: opts.lockReason } : {}),
  });

  /* ================= ENTITY (1120S / 1065 / 1120) ================= */
  if (entity) {
    const F = `Form ${ret.formType}`;
    const grossReceipts = rand.money(180000, 1_600_000, 100);
    const cogs = Math.round(grossReceipts * rand.float(0.18, 0.46));
    const totalIncome = grossReceipts - cogs;
    const officerComp = rand.money(60000, 180000, 100);
    const otherDeductions = Math.round(totalIncome * rand.float(0.25, 0.5));
    const totalDeductions = officerComp + otherDeductions;
    const ordinaryIncome = totalIncome - totalDeductions;

    const PNL = `${ret.id}-doc-pnl`;
    const pnl = doc(
      'pnl',
      'Year-end profit & loss statement',
      'Other',
      ret.clientName,
      'Business',
      undefined, // renders via the generic page, with real highlighted regions
      [
        reg(PNL, `${ret.id}-pnl-gr`, undefined, 'Gross receipts or sales', money2(grossReceipts), 'money', 6, 12, 66, 7),
        reg(PNL, `${ret.id}-pnl-cogs`, undefined, 'Cost of goods sold', money2(cogs), 'money', 6, 26, 66, 7),
        reg(PNL, `${ret.id}-pnl-oc`, undefined, 'Officer compensation', money2(officerComp), 'money', 6, 40, 66, 7),
      ],
    );

    const K1 = `${ret.id}-doc-k1`;
    const k1 = doc(
      'k1',
      `Schedule K-1 (${ret.formType}) — ${ret.clientName}`,
      'K-1',
      ret.clientName,
      'Business',
      'k1',
      [
        reg(K1, `${ret.id}-k1-rec`, undefined, "Shareholder's name", 'Shareholder', 'text', 3, 14, 45, 12),
        reg(K1, `${ret.id}-k1-1`, '1', 'Ordinary business income (loss)', money2(ordinaryIncome), 'money', 52, 12, 45, 12),
      ],
    );

    const fields: ReturnField[] = [
      f(
        'gross-receipts',
        `${F}, Line 1a`,
        'Gross receipts or sales',
        'Income',
        grossReceipts,
        flags > 0 ? 'ai_suggested' : 'verified',
        [{ label: 'Year-end P&L — gross receipts', value: grossReceipts, documentId: PNL, regionId: `${ret.id}-pnl-gr` }],
        {
          sources: [{ documentId: PNL, regionId: `${ret.id}-pnl-gr`, amount: grossReceipts }],
          confidence: 0.95,
        },
      ),
      f(
        'cogs',
        `${F}, Line 2`,
        'Cost of goods sold',
        'Income',
        cogs,
        lowConf > 0 ? 'ai_low_confidence' : 'ai_suggested',
        [{ label: 'Year-end P&L — cost of goods sold', value: cogs, documentId: PNL, regionId: `${ret.id}-pnl-cogs` }],
        {
          sources: [{ documentId: PNL, regionId: `${ret.id}-pnl-cogs`, amount: cogs }],
          confidence: lowConf > 0 ? 0.6 : 0.9,
        },
      ),
      f('total-income', `${F}, Line 6`, 'Total income', 'Income', totalIncome, 'calculated', [
        { label: 'Gross receipts (Line 1a)', value: grossReceipts },
        { label: 'Less cost of goods sold (Line 2)', value: -cogs },
      ], { rule: 'Gross receipts less cost of goods sold.' }),
      f(
        'officer-comp',
        `${F}, Line 7`,
        'Compensation of officers',
        'Deductions',
        officerComp,
        'verified',
        [{ label: 'Year-end P&L — officer compensation', value: officerComp, documentId: PNL, regionId: `${ret.id}-pnl-oc` }],
        { sources: [{ documentId: PNL, regionId: `${ret.id}-pnl-oc`, amount: officerComp }], confidence: 0.98 },
      ),
      f('total-deductions', `${F}, Line 20`, 'Total deductions', 'Deductions', totalDeductions, 'calculated', [
        { label: 'Compensation of officers (Line 7)', value: officerComp },
        { label: 'Other deductions', value: otherDeductions },
      ], { rule: 'Sum of every deduction line on the return.' }),
      f(
        'ordinary-income',
        `${F}, Line 21`,
        'Ordinary business income',
        'Income',
        ordinaryIncome,
        ordinaryIncome < 0 ? 'flagged' : 'ai_suggested',
        [
          { label: 'Total income (Line 6)', value: totalIncome },
          { label: 'Less total deductions (Line 20)', value: -totalDeductions },
        ],
        {
          rule: 'Total income less total deductions — the amount that passes through to the shareholder.',
          confidence: 0.88,
        },
      ),
      f(
        'k1-share',
        `Schedule K-1 (${ret.formType}), Box 1`,
        'Shareholder share — ordinary business income',
        'Income',
        ordinaryIncome,
        'verified',
        [{ label: 'Schedule K-1, Box 1', value: ordinaryIncome, documentId: K1, regionId: `${ret.id}-k1-1` }],
        { sources: [{ documentId: K1, regionId: `${ret.id}-k1-1`, amount: ordinaryIncome }], confidence: 0.98 },
      ),
    ];

    return { sourceDocs: [pnl, k1], fields };
  }

  /* ================= INDIVIDUAL (1040) ================= */
  const employer = rand.pick(EMPLOYERS);
  const wages = rand.money(48000, 210000, 10);

  // Interest across one or two banks, so the trace is a genuine sum you can
  // follow to two separate forms — not a 1:1 passthrough.
  const bankA = rand.pick(BANKS);
  const intA = rand.money(60, 2600, 1);
  const twoBanks = rand.bool(0.5) && intA > 0;
  const bankB = twoBanks ? rand.pick(BANKS.filter((b) => b !== bankA)) : bankA;
  const intB = twoBanks ? rand.money(40, 1500, 1) : 0;
  const interest = intA + intB;

  const dividends = rand.money(0, 9200, 1);
  const totalIncome = wages + interest + dividends;
  const adjustments = rand.money(0, 8600, 10);
  const agi = totalIncome - adjustments;
  const standard = 15000;
  const itemised = rand.money(6000, 41000, 10);
  const deduction = Math.max(standard, itemised);
  const taxable = Math.max(0, agi - deduction);
  const tax = Math.round(taxable * rand.float(0.14, 0.23));
  const withheld = Math.max(0, tax + ret.refundOrDue);

  // --- W-2 (wages + withholding) ---
  const W2 = `${ret.id}-doc-w2`;
  const w2 = doc('w2', `W-2 — ${employer}`, 'W-2', employer, 'Income', 'w2', [
    reg(W2, `${ret.id}-w2-c`, 'c', "Employer's name, address, and ZIP code", `${employer}\nTax year 2025`, 'text', 2, 19, 46, 20),
    reg(W2, `${ret.id}-w2-e`, 'e', "Employee's name", ret.clientName, 'text', 2, 40, 46, 10),
    reg(W2, `${ret.id}-w2-1`, '1', 'Wages, tips, other compensation', money2(wages), 'money', 50, 9, 24, 9),
    reg(W2, `${ret.id}-w2-2`, '2', 'Federal income tax withheld', money2(withheld), 'money', 75, 9, 23, 9),
  ]);

  // --- 1099-INT(s) ---
  const sourceDocs: SourceDocument[] = [w2];
  const INT1 = `${ret.id}-doc-int1`;
  const int1RegionId = `${ret.id}-int1-1`;
  sourceDocs.push(
    doc('int1', `1099-INT — ${bankA}`, '1099-INT', bankA, 'Investments', '1099int', [
      reg(INT1, `${ret.id}-int1-payer`, undefined, "Payer's name", bankA, 'text', 3, 12, 45, 18),
      reg(INT1, `${ret.id}-int1-rec`, undefined, "Recipient's name", ret.clientName, 'text', 3, 44, 45, 10),
      reg(INT1, int1RegionId, '1', 'Interest income', money2(intA), 'money', 52, 12, 45, 12),
    ]),
  );
  const intSources: Provenance['sources'] = [{ documentId: INT1, regionId: int1RegionId, amount: intA }];
  const intSteps: Provenance['steps'] = [
    { label: `1099-INT Box 1 — ${bankA}`, value: intA, documentId: INT1, regionId: int1RegionId },
  ];
  if (twoBanks) {
    const INT2 = `${ret.id}-doc-int2`;
    const int2RegionId = `${ret.id}-int2-1`;
    sourceDocs.push(
      doc('int2', `1099-INT — ${bankB}`, '1099-INT', bankB, 'Investments', '1099int', [
        reg(INT2, `${ret.id}-int2-payer`, undefined, "Payer's name", bankB, 'text', 3, 12, 45, 18),
        reg(INT2, `${ret.id}-int2-rec`, undefined, "Recipient's name", ret.clientName, 'text', 3, 44, 45, 10),
        reg(INT2, int2RegionId, '1', 'Interest income', money2(intB), 'money', 52, 12, 45, 12),
      ]),
    );
    intSources.push({ documentId: INT2, regionId: int2RegionId, amount: intB });
    intSteps.push({ label: `1099-INT Box 1 — ${bankB}`, value: intB, documentId: INT2, regionId: int2RegionId });
  }

  const fields: ReturnField[] = [
    f(
      'wages',
      'Form 1040, Line 1a',
      'Wages, salaries, tips',
      'Income',
      wages,
      flags > 0 ? 'ai_suggested' : 'verified',
      [{ label: `W-2 Box 1 — ${employer}`, value: wages, documentId: W2, regionId: `${ret.id}-w2-1` }],
      { sources: [{ documentId: W2, regionId: `${ret.id}-w2-1`, amount: wages }], confidence: 0.97 },
    ),
    f(
      'interest',
      'Form 1040, Line 2b',
      'Taxable interest',
      'Income',
      interest,
      lowConf > 0 ? 'ai_low_confidence' : 'ai_suggested',
      intSteps,
      {
        sources: intSources,
        confidence: lowConf > 0 ? 0.61 : 0.94,
        rule: twoBanks ? 'Box 1 interest summed across every payer that issued a 1099-INT.' : undefined,
      },
    ),
    f(
      'dividends',
      'Form 1040, Line 3b',
      'Ordinary dividends',
      'Income',
      dividends,
      'ai_suggested',
      [{ label: 'Sum of Box 1a across Forms 1099-DIV', value: dividends }],
      { confidence: 0.9 },
    ),
    f('total-income', 'Form 1040, Line 9', 'Total income', 'Income', totalIncome, 'calculated', [
      { label: 'Wages (Line 1a)', value: wages },
      { label: 'Taxable interest (Line 2b)', value: interest },
      { label: 'Ordinary dividends (Line 3b)', value: dividends },
    ], { rule: 'Sum of all income lines on Form 1040 and Schedule 1.' }),
    f('adjustments', 'Schedule 1, Line 26', 'Total adjustments to income', 'Adjustments', adjustments, 'editable', [
      { label: 'Entered by preparer', value: adjustments },
    ]),
    f('agi', 'Form 1040, Line 11', 'Adjusted gross income', 'Adjustments', agi, 'calculated', [
      { label: 'Total income (Line 9)', value: totalIncome },
      { label: 'Less adjustments', value: -adjustments },
    ]),
    f(
      'deduction',
      'Form 1040, Line 12',
      deduction === standard ? 'Standard deduction' : 'Itemized deductions',
      'Deductions',
      deduction,
      deduction === standard ? 'locked' : 'ai_suggested',
      [
        { label: 'Itemized total', value: itemised },
        { label: 'Standard deduction', value: standard },
        {
          label:
            deduction === standard
              ? 'Standard deduction is higher — taken'
              : 'Itemizing is higher — taken',
          value: null,
        },
      ],
      deduction === standard
        ? {
            lockReason:
              'The standard deduction is set by statute and beats this client’s itemized total, so it cannot be edited here.',
          }
        : { confidence: 0.86 },
    ),
    f('taxable', 'Form 1040, Line 15', 'Taxable income', 'Deductions', taxable, 'calculated', [
      { label: 'Adjusted gross income (Line 11)', value: agi },
      { label: 'Less deduction (Line 12)', value: -deduction },
    ]),
    f('tax', 'Form 1040, Line 16', 'Income tax', 'Tax', tax, 'calculated', [
      { label: '2025 rate schedule applied to taxable income', value: tax },
    ]),
    f(
      'withholding',
      'Form 1040, Line 25a',
      'Federal income tax withheld',
      'Payments',
      withheld,
      'verified',
      [{ label: `W-2 Box 2 — ${employer}`, value: withheld, documentId: W2, regionId: `${ret.id}-w2-2` }],
      { sources: [{ documentId: W2, regionId: `${ret.id}-w2-2`, amount: withheld }], confidence: 0.99 },
    ),
    f(
      'balance',
      ret.refundOrDue >= 0 ? 'Form 1040, Line 34' : 'Form 1040, Line 37',
      ret.refundOrDue >= 0 ? 'Amount overpaid' : 'Amount you owe',
      'Payments',
      Math.abs(ret.refundOrDue),
      'locked',
      [
        { label: 'Total tax (Line 24)', value: tax },
        { label: 'Less payments (Line 25a)', value: -withheld },
      ],
      {
        lockReason: 'The bottom line is computed from every figure above it and cannot be typed over.',
      },
    ),
  ];

  return { sourceDocs, fields };
}

/* ------------------------------------------------------------------ */
/* Tasks — driven by the return's own blockers, not invented            */
/* ------------------------------------------------------------------ */

export function deriveTasks(ret: TaxReturn): Task[] {
  const tasks: Task[] = ret.blockers.map((b, i) => ({
    id: `${ret.id}-tsk-${i}`,
    returnId: ret.id,
    title: b.label,
    detail:
      b.owner === 'client'
        ? 'We need this from the client before the return can move forward.'
        : 'This needs a decision from the engagement team.',
    kind: b.owner === 'client' ? 'upload' : 'review',
    status: b.severity === 'blocking' ? 'open' : 'in_progress',
    owner: b.owner,
    assigneeId: b.owner === 'firm' ? ret.preparerId : undefined,
    priority: b.severity === 'blocking' ? 'urgent' : 'normal',
    dueDate: ret.dueDate,
    links: [],
  }));

  if (ret.stage !== 'filed') {
    tasks.push({
      id: `${ret.id}-tsk-next`,
      returnId: ret.id,
      title: ret.nextActionLabel,
      kind: ret.nextActionOwner === 'client' ? 'answer' : 'review',
      status: 'open',
      owner: ret.nextActionOwner,
      assigneeId: ret.nextActionOwner === 'firm' ? ret.preparerId : undefined,
      priority: 'normal',
      links: [],
    });
  }

  return tasks;
}

/* ------------------------------------------------------------------ */
/* Threads                                                             */
/* ------------------------------------------------------------------ */

export function deriveThreads(ret: TaxReturn, docs: SourceDocument[]): Thread[] {
  const rand = new Rand(seedOf(ret.id) ^ 0x9e3779b9);
  const out: Thread[] = [];
  const firstName = ret.clientName.split(' ')[0]!;
  const anchorDoc = docs[rand.int(0, Math.min(docs.length - 1, 12))];

  if (anchorDoc) {
    out.push({
      id: `${ret.id}-thr-0`,
      returnId: ret.id,
      subject: `Question on ${anchorDoc.kind}`,
      visibility: 'shared',
      anchor: { type: 'document', id: anchorDoc.id, label: anchorDoc.name },
      participantIds: [ret.preparerId, 'u-marcus'],
      nextActionOwner: ret.nextActionOwner,
      status: ret.nextActionOwner === 'client' ? 'awaiting_client' : 'awaiting_firm',
      updatedAt: ret.stageSince,
      messages: [
        {
          id: `${ret.id}-m-0`,
          threadId: `${ret.id}-thr-0`,
          authorId: ret.preparerId,
          sentAt: ret.stageSince,
          body: `Hi ${firstName} — I'm working through your ${anchorDoc.kind.toLowerCase()} from ${anchorDoc.issuer}. Can you confirm this covers the full year? I want to make sure nothing is missing before I finish the return.`,
        },
      ],
    });
  }

  // An internal thread exists on roughly half of returns, so the
  // internal/external distinction is demonstrable outside the hero return too.
  if (rand.bool(0.5)) {
    out.push({
      id: `${ret.id}-thr-int`,
      returnId: ret.id,
      subject: 'Internal — review notes',
      visibility: 'internal',
      anchor: { type: 'return', id: ret.id, label: `${ret.clientName} · ${ret.taxYear}` },
      participantIds: [ret.preparerId, 'u-lin'],
      nextActionOwner: 'firm',
      status: 'open',
      updatedAt: ret.stageSince,
      messages: [
        {
          id: `${ret.id}-m-int`,
          threadId: `${ret.id}-thr-int`,
          authorId: 'u-lin',
          sentAt: ret.stageSince,
          body: `Flagging for the file: this one is a ${ret.formType} at complexity ${ret.complexity}. Let's not sign it off without a second pass on the schedules.`,
        },
      ],
    });
  }

  return out;
}

/* ------------------------------------------------------------------ */
/* AI findings                                                         */
/* ------------------------------------------------------------------ */

export function deriveInsights(ret: TaxReturn, docs: SourceDocument[]): AIInsight[] {
  if (!ret.aiFlagsOpen) return [];
  const rand = new Rand(seedOf(ret.id) ^ 0x51ed270b);
  const out: AIInsight[] = [];
  const n = Math.min(ret.aiFlagsOpen, 3);

  const templates = [
    {
      kind: 'missing_document' as const,
      title: 'Prior-year carryforward not yet confirmed',
      summary:
        'Last year’s return shows a capital loss carryforward that has not been applied to this return.',
      reasoning: [
        'The 2024 return reports an unused capital loss.',
        'No carryforward amount has been entered on this year’s Schedule D.',
        'Unused losses carry forward indefinitely and should be applied before they expire.',
      ],
      uncertainty:
        'Green Growth has not seen the 2024 return directly — this is inferred from the client record, so the amount needs confirming.',
    },
    {
      kind: 'discrepancy' as const,
      title: 'Withholding does not tie to the W-2',
      summary: 'The withholding entered differs from what was read off the source document.',
      reasoning: [
        'Box 2 on the uploaded W-2 and the figure on Line 25a do not agree.',
        'A difference this size usually means a second W-2 exists, or one was entered by hand.',
      ],
      uncertainty:
        'If the client held more than one job this year, a second W-2 would explain the gap entirely.',
    },
    {
      kind: 'recommendation' as const,
      title: 'Retirement contribution may still be available',
      summary:
        'An IRA contribution before the filing deadline could reduce this year’s tax.',
      reasoning: [
        'Adjusted gross income is inside the deductible range.',
        'No IRA contribution is recorded for the year.',
        'Contributions can be made up to the filing deadline and applied to the prior year.',
      ],
      uncertainty:
        'Deductibility depends on whether the client is covered by a workplace plan, which is not in the file.',
    },
  ];

  for (let i = 0; i < n; i++) {
    const t = templates[i % templates.length]!;
    const doc = docs[rand.int(0, Math.min(docs.length - 1, 20))];
    out.push({
      id: `${ret.id}-ins-${i}`,
      returnId: ret.id,
      kind: t.kind,
      title: t.title,
      summary: t.summary,
      confidence: rand.float(0.62, 0.95),
      reasoning: t.reasoning,
      evidence: doc
        ? [{ documentId: doc.id, quote: `${doc.name} — reviewed ${doc.kind}` }]
        : [],
      uncertainty: t.uncertainty,
      impact: rand.money(300, 9000, 10),
      suggestedActions: [
        { id: `${ret.id}-a-${i}-accept`, label: 'Accept', kind: 'accept', primary: true },
        { id: `${ret.id}-a-${i}-ask`, label: 'Ask the client', kind: 'ask_client' },
        { id: `${ret.id}-a-${i}-dismiss`, label: 'Dismiss', kind: 'dismiss' },
      ],
      status: 'open',
      createdAt: ret.stageSince,
    });
  }

  return out;
}

/* ------------------------------------------------------------------ */
/* Assembled, memoised                                                 */
/* ------------------------------------------------------------------ */

export interface DerivedReturn {
  documents: SourceDocument[];
  fields: ReturnField[];
  tasks: Task[];
  threads: Thread[];
  insights: AIInsight[];
}

const CACHE = new Map<string, DerivedReturn>();

/** Built once per return id, then reused — generation is not free at 140 returns. */
export function derived(ret: TaxReturn): DerivedReturn {
  const hit = CACHE.get(ret.id);
  if (hit) return hit;

  const { sourceDocs, fields } = deriveFinancials(ret);
  // Real forms first (they lead the library and back the traceability trace),
  // then the bulk background documents — total held at the return's own count.
  const documents = [...sourceDocs, ...deriveBulkDocuments(ret, sourceDocs.length)];
  const value: DerivedReturn = {
    documents,
    fields,
    tasks: deriveTasks(ret),
    threads: deriveThreads(ret, documents),
    insights: deriveInsights(ret, documents),
  };
  CACHE.set(ret.id, value);
  return value;
}
