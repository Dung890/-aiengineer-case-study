import type { AIInsight } from '../types';
import { DOC, REGION } from './documents';
import { HERO_RETURN_ID } from './users';

/* ==================================================================
   Ch.10 — Trustworthy AI
   ------------------------------------------------------------------
   Every insight here obeys four self-imposed rules, because those rules
   are the actual design position:

   1. NEVER a bare score. A number without evidence is a vibe. Each
      insight carries the specific document region it read.
   2. UNCERTAINTY IS MANDATORY below high confidence. If the model is
      not sure, it has to say what it is not sure ABOUT — "low
      confidence" alone tells a reviewer nothing actionable.
   3. REASONING IS ORDERED AND SHORT. Shortest sufficient chain, in
      plain English, so a non-accountant client can follow the same
      explanation their preparer is reading.
   4. EVERY INSIGHT ENDS IN A CHOICE. Accept, correct, ask the client,
      or escalate. An observation the user cannot act on is noise.

   The escalation flag exists because of the role this product is built
   around: a concierge who is expected to recognise when something needs
   a credential, not to know every rule themselves.
   ================================================================== */

const R = HERO_RETURN_ID;

export const HERO_INSIGHTS: AIInsight[] = [
  /* --- 1. The headline catch: a corrected 1099 double-counted --- */
  {
    id: 'ins-duplicate-1099',
    returnId: R,
    kind: 'discrepancy',
    title: 'Northwind Labs filed a corrected 1099-NEC',
    summary:
      'Two 1099-NECs from the same payer are on file. Adding both would overstate business income by $18,400.',
    confidence: 0.96,
    reasoning: [
      'Both forms share payer TIN 81-2204417 and cover tax year 2025.',
      'The form uploaded on 27 February has the CORRECTED box checked; the original was uploaded on 6 February.',
      'A corrected information return replaces the original rather than supplementing it, so only $16,900 belongs on Schedule C.',
    ],
    evidence: [
      {
        documentId: DOC.necCorrected,
        regionId: REGION.necCorrectedFlag,
        quote: 'CORRECTED checkbox marked',
      },
      {
        documentId: DOC.necCorrected,
        regionId: REGION.necCorrectedAmount,
        quote: 'Box 1 — Nonemployee compensation: 16,900.00',
      },
      {
        documentId: DOC.necOriginal,
        regionId: REGION.necOriginalAmount,
        quote: 'Box 1 — Nonemployee compensation: 18,400.00',
      },
    ],
    uncertainty:
      'The corrected form supersedes the original for the amount, but Green Growth cannot tell whether Northwind also revised any state filing. Worth one email if the client is filing in more than one state.',
    impact: 18400,
    targetFieldId: 'fld-gross-receipts',
    suggestedActions: [
      {
        id: 'a-use-corrected',
        label: 'Use the corrected figure ($16,900)',
        kind: 'accept',
        resultingValue: 59650,
        primary: true,
      },
      { id: 'a-use-original', label: 'Keep the original instead', kind: 'correct', resultingValue: 61150 },
      { id: 'a-ask', label: 'Ask Marcus which is right', kind: 'ask_client' },
    ],
    status: 'open',
    createdAt: '2026-03-04T10:12:00Z',
  },

  /* --- 2. The honest failure: a scan the model could not read --- */
  {
    id: 'ins-k1-lowconf',
    returnId: R,
    kind: 'extraction',
    title: 'K-1 Box 1 could not be read cleanly',
    summary:
      'The scanned K-1 is low resolution. Green Growth read $31,480 but is not confident in the second digit.',
    confidence: 0.58,
    reasoning: [
      'The uploaded K-1 is a photograph of a printed page at roughly 110 DPI.',
      'The character in the second position of Box 1 resolves ambiguously between "1" and a lowercase "l" artefact.',
      'The Box 17V Section 199A figure on the same page reads cleanly as $31,480, which supports — but does not prove — the Box 1 reading.',
    ],
    evidence: [
      {
        documentId: DOC.k1,
        regionId: REGION.k1Ordinary,
        quote: 'Box 1 — Ordinary business income: 3l,480.00',
      },
      {
        documentId: DOC.k1,
        regionId: REGION.k1QBI,
        quote: 'Box 17V — Section 199A income: 31,480.00',
      },
    ],
    uncertainty:
      'A misread here changes taxable income dollar for dollar. Green Growth is corroborating one blurred field against another field on the same page, which is weaker evidence than reading it directly.',
    impact: 31480,
    targetFieldId: 'fld-k1-income',
    suggestedActions: [
      {
        id: 'a-request-k1',
        label: 'Ask Marcus for a clean copy',
        kind: 'ask_client',
        primary: true,
      },
      { id: 'a-accept-k1', label: 'Accept $31,480 as read', kind: 'accept', resultingValue: 31480 },
      { id: 'a-correct-k1', label: 'Enter the figure myself', kind: 'correct' },
    ],
    status: 'open',
    createdAt: '2026-03-04T10:14:00Z',
  },

  /* --- 3. Reasoning about an absence, not just what was uploaded --- */
  {
    id: 'ins-missing-1099int',
    returnId: R,
    kind: 'missing_document',
    title: 'Interest income with no matching 1099-INT',
    summary:
      'A Coastal Credit Union statement shows $742 of interest paid, but no 1099-INT from Coastal has been uploaded.',
    confidence: 0.87,
    reasoning: [
      'The December statement for Coastal Credit Union account ····4471 reports $742.16 of year-to-date interest.',
      'Only one 1099-INT is on file, from Meridian Savings Bank, for a different account.',
      'Payers are not required to issue a 1099-INT below $10, but $742 is well above that threshold — the form almost certainly exists.',
    ],
    evidence: [
      {
        documentId: DOC.statement,
        regionId: REGION.stmtInterest,
        quote: 'Interest paid year-to-date: $742.16',
      },
      {
        documentId: DOC.int,
        regionId: REGION.intAmount,
        quote: 'Meridian Savings Bank — Box 1: 1,284.00',
      },
    ],
    uncertainty:
      'The $742.16 is a year-to-date figure from a December statement, which normally equals the calendar-year total — but Green Growth has not seen the January statement to confirm the account was open all year.',
    impact: 742,
    targetFieldId: 'fld-interest',
    suggestedActions: [
      {
        id: 'a-request-int',
        label: 'Request the Coastal 1099-INT',
        kind: 'ask_client',
        primary: true,
      },
      {
        id: 'a-accept-int',
        label: 'Add $742 from the statement',
        kind: 'accept',
        resultingValue: 2026,
      },
      { id: 'a-dismiss-int', label: 'Not reportable — dismiss', kind: 'dismiss' },
    ],
    status: 'open',
    createdAt: '2026-03-05T08:40:00Z',
  },

  /* --- 4. Money found, but a judgement call the concierge must escalate --- */
  {
    id: 'ins-qbi-sstb',
    returnId: R,
    kind: 'warning',
    title: 'QBI deduction depends on an SSTB judgement',
    summary:
      'The $15,369 QBI deduction assumes the consulting work is not a specified service trade or business. That call needs a credentialed reviewer.',
    confidence: 0.68,
    reasoning: [
      'Taxable income of $102,828 is inside the phase-in range where SSTB status starts to matter for a single filer.',
      'The engagement letters describe product design and implementation work, which generally falls outside the consulting SSTB category.',
      'Two of the four Brightpath statements of work use the word "advisory", which cuts the other way.',
    ],
    evidence: [
      {
        documentId: DOC.k1,
        regionId: REGION.k1QBI,
        quote: 'Box 17V — Section 199A income: 31,480.00',
      },
      {
        documentId: DOC.necBrightpath,
        regionId: REGION.necBrightpathAmount,
        quote: 'Brightpath Ventures — Box 1: 42,750.00',
      },
    ],
    uncertainty:
      'This is a facts-and-circumstances determination, not a calculation. Green Growth can lay out the argument but should not be the one deciding it.',
    impact: 15369,
    targetFieldId: 'fld-qbi',
    requiresCredentialedReviewer: true,
    suggestedActions: [
      {
        id: 'a-escalate-qbi',
        label: 'Send to Lin Nakamura, CPA',
        kind: 'escalate',
        primary: true,
      },
      { id: 'a-note-qbi', label: 'Add an internal note first', kind: 'correct' },
    ],
    status: 'open',
    createdAt: '2026-03-05T14:02:00Z',
  },

  /* --- 5. A forward-looking recommendation, not just a return figure --- */
  {
    id: 'ins-estimated-penalty',
    returnId: R,
    kind: 'warning',
    title: 'Underpayment penalty likely — first year of self-employment',
    summary:
      'No estimated payments were made against $6,410 of self-employment tax. An estimated $310 penalty applies, and next year is the bigger problem.',
    confidence: 0.92,
    reasoning: [
      'Withholding of $14,902 covers 62% of the $23,946 total tax.',
      'The safe harbour requires 90% of the current year or 100% of prior-year tax; 2024 was a fully salaried year, so the prior-year figure is low.',
      'Marcus qualifies for prior-year safe harbour relief this year, which limits the penalty — but that shield disappears in 2026.',
    ],
    evidence: [
      { documentId: DOC.w2, regionId: REGION.w2FedTax, quote: 'W-2 Box 2 — Federal tax withheld: 14,902.00' },
    ],
    uncertainty:
      'The $310 estimate assumes the balance is paid by 15 April. It grows if payment slips, and the exact figure depends on when each quarter’s shortfall arose.',
    impact: 310,
    targetFieldId: 'fld-estimated-payments',
    suggestedActions: [
      {
        id: 'a-plan-estimates',
        label: 'Set up 2026 quarterly estimates',
        kind: 'accept',
        primary: true,
      },
      { id: 'a-explain-penalty', label: 'Explain this to Marcus', kind: 'ask_client' },
      { id: 'a-dismiss-penalty', label: 'Dismiss', kind: 'dismiss' },
    ],
    status: 'open',
    createdAt: '2026-03-05T14:10:00Z',
  },

  /* --- 6. Already resolved: proves the lifecycle, not just the inbox --- */
  {
    id: 'ins-home-office',
    returnId: R,
    kind: 'recommendation',
    title: 'Home office deduction applied',
    summary:
      'The questionnaire describes a dedicated 180 sq ft room used only for work. Simplified method applied: $900.',
    confidence: 0.94,
    reasoning: [
      'Questionnaire item 14 reports a room used regularly and exclusively for business.',
      'At 180 sq ft the simplified method ($5/sq ft, capped at 300 sq ft) gives $900.',
      'Actual-expense method was estimated at $1,240 but requires allocating utilities and depreciation, which creates recapture on sale.',
    ],
    evidence: [
      { documentId: DOC.necBrightpath, quote: 'Client questionnaire item 14 — dedicated workspace: yes' },
    ],
    impact: 900,
    suggestedActions: [{ id: 'a-ho-done', label: 'Applied', kind: 'accept' }],
    status: 'accepted',
    createdAt: '2026-03-03T11:00:00Z',
  },
];

export const INSIGHT_BY_ID: Record<string, AIInsight> = Object.fromEntries(
  HERO_INSIGHTS.map((i) => [i.id, i]),
);

export function insightsForField(fieldId: string) {
  return HERO_INSIGHTS.filter((i) => i.targetFieldId === fieldId);
}

export function openInsights() {
  return HERO_INSIGHTS.filter((i) => i.status === 'open');
}
