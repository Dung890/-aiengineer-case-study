import type { ReturnField } from '../types';
import { DOC, REGION } from './documents';
import { HERO_RETURN_ID } from './users';

/* ==================================================================
   Ch.01 — Source document traceability
   ------------------------------------------------------------------
   Every figure below carries a `provenance` block answering four
   questions a CPA will ask of any number on a return:

     · which document did this come from?
     · which box on that document?
     · what arithmetic was applied on the way here?
     · what rule authorised that arithmetic?

   The arithmetic is stored as an ordered list of steps rather than a
   single formula string, so the UI can render it as an auditable trail
   where each line links back to its own source region.

   The numbers foot. Total income, AGI, deductions, tax and the balance
   due are all genuinely derived from the figures above them — which
   matters, because a reviewer's first instinct on any demo is to add
   the column up.
   ================================================================== */

const R = HERO_RETURN_ID;

export const HERO_FIELDS: ReturnField[] = [
  /* ================= INCOME ================= */
  {
    id: 'fld-wages',
    returnId: R,
    lineRef: 'Form 1040, Line 1a',
    label: 'Wages, salaries, tips',
    section: 'Income',
    value: 84320,
    state: 'verified',
    confidence: 0.99,
    provenance: {
      sources: [{ documentId: DOC.w2, regionId: REGION.w2Wages, amount: 84320 }],
      steps: [
        {
          label: 'W-2 Box 1 — Halcyon Design Group',
          value: 84320,
          documentId: DOC.w2,
          regionId: REGION.w2Wages,
        },
      ],
      rule: 'Box 1 of each Form W-2 carries directly to Line 1a.',
      verifiedBy: 'u-jordan',
      verifiedAt: '2026-03-06T16:20:00Z',
    },
  },
  {
    id: 'fld-interest',
    returnId: R,
    lineRef: 'Form 1040, Line 2b',
    label: 'Taxable interest',
    section: 'Income',
    value: 1284,
    state: 'ai_suggested',
    confidence: 0.93,
    provenance: {
      sources: [{ documentId: DOC.int, regionId: REGION.intAmount, amount: 1284 }],
      steps: [
        {
          label: '1099-INT Box 1 — Meridian Savings Bank',
          value: 1284,
          documentId: DOC.int,
          regionId: REGION.intAmount,
        },
      ],
      rule: 'Sum of Box 1 across all Forms 1099-INT.',
    },
  },
  {
    id: 'fld-dividends',
    returnId: R,
    lineRef: 'Form 1040, Line 3b',
    label: 'Ordinary dividends',
    section: 'Income',
    value: 2940,
    state: 'ai_suggested',
    confidence: 0.91,
    provenance: {
      sources: [],
      steps: [{ label: 'Sum of Box 1a across 3 Forms 1099-DIV', value: 2940 }],
      rule: 'Sum of Box 1a across all Forms 1099-DIV.',
    },
  },

  /* The discrepancy. This is the field the demo opens on. */
  {
    id: 'fld-gross-receipts',
    returnId: R,
    lineRef: 'Schedule C, Line 1',
    label: 'Gross receipts or sales',
    section: 'Income',
    value: 59650,
    state: 'flagged',
    confidence: 0.71,
    provenance: {
      sources: [
        { documentId: DOC.necBrightpath, regionId: REGION.necBrightpathAmount, amount: 42750 },
        { documentId: DOC.necCorrected, regionId: REGION.necCorrectedAmount, amount: 16900 },
        // Deliberately included with a zero contribution: a superseded source
        // is still part of the audit trail, and hiding it is how a reviewer
        // ends up re-discovering the same problem next year.
        { documentId: DOC.necOriginal, regionId: REGION.necOriginalAmount, amount: 0 },
      ],
      steps: [
        {
          label: '1099-NEC Box 1 — Brightpath Ventures',
          value: 42750,
          documentId: DOC.necBrightpath,
          regionId: REGION.necBrightpathAmount,
        },
        {
          label: '1099-NEC Box 1 — Northwind Labs (CORRECTED, filed 27 Feb)',
          value: 16900,
          documentId: DOC.necCorrected,
          regionId: REGION.necCorrectedAmount,
        },
        {
          label: 'Northwind Labs original 1099-NEC — superseded, excluded',
          value: 0,
          documentId: DOC.necOriginal,
          regionId: REGION.necOriginalAmount,
        },
      ],
      rule:
        'Where a payer issues a corrected Form 1099, the corrected figure replaces the original — the two are not additive.',
      citation: 'IRS General Instructions for Certain Information Returns, §H',
    },
  },
  {
    id: 'fld-sch-c-expenses',
    returnId: R,
    lineRef: 'Schedule C, Line 28',
    label: 'Total business expenses',
    section: 'Income',
    value: 14285,
    state: 'ai_suggested',
    confidence: 0.84,
    provenance: {
      sources: [],
      steps: [
        { label: 'Software & subscriptions (31 receipts)', value: 4180 },
        { label: 'Travel & lodging (12 receipts)', value: 3925 },
        { label: 'Equipment under de minimis safe harbour', value: 2860 },
        { label: 'Contract labour', value: 1900 },
        { label: 'Phone & internet (business portion)', value: 1420 },
      ],
      rule: 'Categorised from 74 uploaded receipts. Personal-use portions already excluded.',
    },
  },
  {
    id: 'fld-sch-c-net',
    returnId: R,
    lineRef: 'Schedule C, Line 31',
    label: 'Net profit from business',
    section: 'Income',
    value: 45365,
    state: 'calculated',
    provenance: {
      sources: [],
      steps: [
        { label: 'Gross receipts (Schedule C, Line 1)', value: 59650 },
        { label: 'Less total expenses (Schedule C, Line 28)', value: -14285 },
      ],
      rule: 'Gross receipts less total expenses.',
    },
  },
  {
    id: 'fld-k1-income',
    returnId: R,
    lineRef: 'Schedule E, Line 28(k)',
    label: 'S-corporation ordinary income',
    section: 'Income',
    value: 31480,
    state: 'ai_low_confidence',
    confidence: 0.58,
    provenance: {
      sources: [{ documentId: DOC.k1, regionId: REGION.k1Ordinary, amount: 31480 }],
      steps: [
        {
          label: 'Schedule K-1 Box 1 — Delgado Studio Inc.',
          value: 31480,
          documentId: DOC.k1,
          regionId: REGION.k1Ordinary,
        },
      ],
      rule: 'Box 1 of Schedule K-1 (Form 1120-S) flows to Schedule E, Part II.',
    },
  },
  {
    id: 'fld-total-income',
    returnId: R,
    lineRef: 'Form 1040, Line 9',
    label: 'Total income',
    section: 'Income',
    value: 165389,
    state: 'calculated',
    provenance: {
      sources: [],
      steps: [
        { label: 'Wages (Line 1a)', value: 84320 },
        { label: 'Taxable interest (Line 2b)', value: 1284 },
        { label: 'Ordinary dividends (Line 3b)', value: 2940 },
        { label: 'Business income (Schedule 1, Line 3)', value: 45365 },
        { label: 'S-corporation income (Schedule 1, Line 5)', value: 31480 },
      ],
      rule: 'Sum of all income lines on Form 1040 and Schedule 1.',
    },
  },

  /* ================= ADJUSTMENTS ================= */
  {
    id: 'fld-se-tax-deduction',
    returnId: R,
    lineRef: 'Schedule 1, Line 15',
    label: 'Deductible part of self-employment tax',
    section: 'Adjustments',
    value: 3205,
    state: 'calculated',
    provenance: {
      sources: [],
      steps: [
        { label: 'Net profit subject to SE tax (Schedule C)', value: 45365 },
        { label: '× 92.35% — net earnings from self-employment', value: 41895 },
        { label: '× 15.3% — self-employment tax', value: 6410 },
        { label: '× 50% — deductible employer-equivalent portion', value: 3205 },
      ],
      rule: 'One half of self-employment tax is deductible in arriving at AGI.',
      citation: 'IRC §164(f)',
    },
  },
  {
    id: 'fld-se-health',
    returnId: R,
    lineRef: 'Schedule 1, Line 17',
    label: 'Self-employed health insurance deduction',
    section: 'Adjustments',
    value: 6840,
    state: 'editable',
    provenance: {
      sources: [],
      steps: [{ label: 'Entered by preparer from Blue Shield premium statements', value: 6840 }],
      rule: 'Premiums paid for the taxpayer, limited to net earnings from self-employment.',
    },
  },
  {
    id: 'fld-agi',
    returnId: R,
    lineRef: 'Form 1040, Line 11',
    label: 'Adjusted gross income',
    section: 'Adjustments',
    value: 155344,
    state: 'calculated',
    provenance: {
      sources: [],
      steps: [
        { label: 'Total income (Line 9)', value: 165389 },
        { label: 'Less deductible SE tax', value: -3205 },
        { label: 'Less self-employed health insurance', value: -6840 },
      ],
      rule: 'Total income less total adjustments.',
    },
  },

  /* ================= DEDUCTIONS ================= */
  {
    id: 'fld-mortgage-interest',
    returnId: R,
    lineRef: 'Schedule A, Line 8a',
    label: 'Home mortgage interest',
    section: 'Deductions',
    value: 19847,
    state: 'ai_suggested',
    confidence: 0.97,
    provenance: {
      sources: [{ documentId: DOC.mortgage, regionId: REGION.mortgageInterest, amount: 19847 }],
      steps: [
        {
          label: 'Form 1098 Box 1 — Summit Home Loans',
          value: 19847,
          documentId: DOC.mortgage,
          regionId: REGION.mortgageInterest,
        },
      ],
      rule:
        'Fully deductible: the loan balance of $612,400 is below the $750,000 acquisition-debt limit.',
      citation: 'IRC §163(h)(3)',
    },
  },
  {
    id: 'fld-points',
    returnId: R,
    lineRef: 'Schedule A, Line 8c',
    label: 'Points paid on purchase of residence',
    section: 'Deductions',
    value: 3100,
    state: 'ai_suggested',
    confidence: 0.88,
    provenance: {
      sources: [{ documentId: DOC.mortgage, regionId: REGION.mortgagePoints, amount: 3100 }],
      steps: [
        {
          label: 'Form 1098 Box 6 — points paid',
          value: 3100,
          documentId: DOC.mortgage,
          regionId: REGION.mortgagePoints,
        },
        { label: 'Deducted in full — purchase of principal residence', value: null },
      ],
      rule:
        'Points paid to buy a principal residence are deductible in the year paid rather than amortised over the loan term.',
      citation: 'IRC §461(g)(2)',
    },
  },

  /* The best single illustration of "transformation applied": two real
     source numbers, a statutory cap, and a visible haircut. */
  {
    id: 'fld-salt',
    returnId: R,
    lineRef: 'Schedule A, Line 5e',
    label: 'State and local taxes (capped)',
    section: 'Deductions',
    value: 10000,
    state: 'calculated',
    provenance: {
      sources: [{ documentId: DOC.w2, regionId: REGION.w2StateTax, amount: 5914 }],
      steps: [
        {
          label: 'State income tax withheld — W-2 Box 17',
          value: 5914,
          documentId: DOC.w2,
          regionId: REGION.w2StateTax,
        },
        { label: 'Real property tax — Orange County installments', value: 8200 },
        { label: 'Subtotal before limitation', value: 14114 },
        { label: 'Statutory cap applied — $4,114 disallowed', value: -4114 },
      ],
      rule: 'The combined deduction for state and local taxes is capped at $10,000.',
      citation: 'IRC §164(b)(6)',
    },
  },
  {
    id: 'fld-charitable',
    returnId: R,
    lineRef: 'Schedule A, Line 11',
    label: 'Charitable contributions',
    section: 'Deductions',
    value: 4200,
    state: 'ai_suggested',
    confidence: 0.79,
    provenance: {
      sources: [],
      steps: [
        { label: 'Cash contributions (9 acknowledgement letters)', value: 3450 },
        { label: 'Non-cash — Goodwill donation receipts', value: 750 },
      ],
      rule: 'Cash contributions substantiated by written acknowledgement.',
    },
  },
  {
    id: 'fld-total-deductions',
    returnId: R,
    lineRef: 'Form 1040, Line 12',
    label: 'Itemized deductions',
    section: 'Deductions',
    value: 37147,
    state: 'calculated',
    provenance: {
      sources: [],
      steps: [
        { label: 'Home mortgage interest', value: 19847 },
        { label: 'Points paid', value: 3100 },
        { label: 'State and local taxes (capped)', value: 10000 },
        { label: 'Charitable contributions', value: 4200 },
        { label: 'Itemizing beats the $15,000 standard deduction by $22,147', value: null },
      ],
      rule: 'The greater of total itemized deductions or the standard deduction.',
    },
  },
  {
    id: 'fld-qbi',
    returnId: R,
    lineRef: 'Form 1040, Line 13',
    label: 'Qualified business income deduction',
    section: 'Deductions',
    value: 15369,
    state: 'needs_approval',
    confidence: 0.74,
    provenance: {
      sources: [{ documentId: DOC.k1, regionId: REGION.k1QBI, amount: 31480 }],
      steps: [
        { label: 'Schedule C qualified business income', value: 45365 },
        {
          label: 'K-1 Box 17V — Section 199A income',
          value: 31480,
          documentId: DOC.k1,
          regionId: REGION.k1QBI,
        },
        { label: 'Combined QBI', value: 76845 },
        { label: '× 20%', value: 15369 },
      ],
      rule:
        'Twenty percent of combined qualified business income. Whether the consulting activity is a specified service trade or business is a judgement call at this income level — a credentialed reviewer must sign off.',
      citation: 'IRC §199A',
    },
  },
  {
    id: 'fld-taxable-income',
    returnId: R,
    lineRef: 'Form 1040, Line 15',
    label: 'Taxable income',
    section: 'Deductions',
    value: 102828,
    state: 'calculated',
    provenance: {
      sources: [],
      steps: [
        { label: 'Adjusted gross income (Line 11)', value: 155344 },
        { label: 'Less itemized deductions (Line 12)', value: -37147 },
        { label: 'Less QBI deduction (Line 13)', value: -15369 },
      ],
      rule: 'AGI less deductions.',
    },
  },

  /* ================= TAX ================= */
  {
    id: 'fld-income-tax',
    returnId: R,
    lineRef: 'Form 1040, Line 16',
    label: 'Income tax',
    section: 'Tax',
    value: 17536,
    state: 'calculated',
    provenance: {
      sources: [],
      steps: [
        { label: '10% on the first $11,925', value: 1193 },
        { label: '12% on $11,925 – $48,475', value: 4386 },
        { label: '22% on $48,475 – $102,828', value: 11958 },
      ],
      rule: '2025 tax rate schedule, single filing status.',
    },
  },
  {
    id: 'fld-se-tax',
    returnId: R,
    lineRef: 'Schedule 2, Line 4',
    label: 'Self-employment tax',
    section: 'Tax',
    value: 6410,
    state: 'calculated',
    provenance: {
      sources: [],
      steps: [
        { label: 'Net earnings from self-employment', value: 41895 },
        { label: '× 12.4% Social Security', value: 5195 },
        { label: '× 2.9% Medicare', value: 1215 },
      ],
      rule:
        'Self-employment tax applies to Schedule C profit. S-corporation K-1 income is not subject to it.',
      citation: 'IRC §1401',
    },
  },
  {
    id: 'fld-total-tax',
    returnId: R,
    lineRef: 'Form 1040, Line 24',
    label: 'Total tax',
    section: 'Tax',
    value: 23946,
    state: 'calculated',
    provenance: {
      sources: [],
      steps: [
        { label: 'Income tax (Line 16)', value: 17536 },
        { label: 'Self-employment tax (Schedule 2)', value: 6410 },
      ],
      rule: 'Income tax plus other taxes.',
    },
  },

  /* ================= PAYMENTS ================= */
  {
    id: 'fld-withholding',
    returnId: R,
    lineRef: 'Form 1040, Line 25a',
    label: 'Federal income tax withheld',
    section: 'Payments',
    value: 14902,
    state: 'verified',
    confidence: 0.99,
    provenance: {
      sources: [{ documentId: DOC.w2, regionId: REGION.w2FedTax, amount: 14902 }],
      steps: [
        {
          label: 'W-2 Box 2 — Halcyon Design Group',
          value: 14902,
          documentId: DOC.w2,
          regionId: REGION.w2FedTax,
        },
      ],
      rule: 'Box 2 of each Form W-2 carries to Line 25a.',
      verifiedBy: 'u-jordan',
      verifiedAt: '2026-03-06T16:21:00Z',
    },
  },
  {
    id: 'fld-estimated-payments',
    returnId: R,
    lineRef: 'Form 1040, Line 26',
    label: 'Estimated tax payments',
    section: 'Payments',
    value: 0,
    state: 'editable',
    provenance: {
      sources: [],
      steps: [{ label: 'No quarterly payments recorded for 2025', value: 0 }],
      rule: 'Quarterly estimated payments made during the year.',
    },
  },
  {
    id: 'fld-balance-due',
    returnId: R,
    lineRef: 'Form 1040, Line 37',
    label: 'Amount you owe',
    section: 'Payments',
    value: 9044,
    state: 'locked',
    lockReason:
      'This is the bottom line — it is computed from every figure above and cannot be typed over. Change an input and it recalculates.',
    provenance: {
      sources: [],
      steps: [
        { label: 'Total tax (Line 24)', value: 23946 },
        { label: 'Less federal withholding (Line 25a)', value: -14902 },
        { label: 'Less estimated payments (Line 26)', value: 0 },
      ],
      rule: 'Total tax less total payments.',
    },
  },
];

export const FIELD_BY_ID: Record<string, ReturnField> = Object.fromEntries(
  HERO_FIELDS.map((f) => [f.id, f]),
);
