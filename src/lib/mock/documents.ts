import type { DocumentCategory, DocumentKind, DocumentRegion, SourceDocument } from '../types';
import { Rand } from './rng';
import { HERO_RETURN_ID } from './users';

/* ==================================================================
   Source documents
   ------------------------------------------------------------------
   Two tiers, on purpose:

   1. HERO documents — a handful, fully specified down to per-box
      coordinates. These are what the traceability screen (Ch.01) opens,
      and they render as true form facsimiles.

   2. BULK documents — a few hundred generated records that give the
      document library (Ch.09) real volume to be tested against. They
      have no regions; opening one shows a generic page.

   Building only tier 1 would make search and filtering a lie. Building
   all of tier 2 by hand would waste the time that should go into
   interaction design.
   ================================================================== */

/* ------------------------------------------------------------------ */
/* Layout helper                                                       */
/* ------------------------------------------------------------------ */

function region(
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
  page = 1,
): DocumentRegion {
  return { id, documentId, page, boxNo, label, rawText, kind, bbox: { x, y, w, h } };
}

/* ------------------------------------------------------------------ */
/* Hero document 1 — W-2                                               */
/* ------------------------------------------------------------------ */

const W2_ID = 'doc-w2-halcyon';

const W2_REGIONS: DocumentRegion[] = [
  region(W2_ID, 'r-w2-b', 'b', "Employer identification number (EIN)", '95-4418820', 'id', 2, 9, 46, 9),
  region(W2_ID, 'r-w2-c', 'c', "Employer's name, address, and ZIP code", 'Halcyon Design Group LLC\n4400 MacArthur Blvd\nNewport Beach, CA 92660', 'text', 2, 19, 46, 20),
  region(W2_ID, 'r-w2-e', 'e', "Employee's name", 'Marcus A. Delgado', 'text', 2, 40, 46, 10),
  region(W2_ID, 'r-w2-f', 'f', "Employee's address", '812 Camino Verde\nIrvine, CA 92612', 'text', 2, 51, 46, 16),

  region(W2_ID, 'r-w2-1', '1', 'Wages, tips, other compensation', '84,320.00', 'money', 50, 9, 24, 9),
  region(W2_ID, 'r-w2-2', '2', 'Federal income tax withheld', '14,902.00', 'money', 75, 9, 23, 9),
  region(W2_ID, 'r-w2-3', '3', 'Social security wages', '84,320.00', 'money', 50, 19, 24, 9),
  region(W2_ID, 'r-w2-4', '4', 'Social security tax withheld', '5,227.84', 'money', 75, 19, 23, 9),
  region(W2_ID, 'r-w2-5', '5', 'Medicare wages and tips', '84,320.00', 'money', 50, 29, 24, 9),
  region(W2_ID, 'r-w2-6', '6', 'Medicare tax withheld', '1,222.64', 'money', 75, 29, 23, 9),
  region(W2_ID, 'r-w2-12a', '12a', 'Code D — 401(k) elective deferrals', 'D  6,400.00', 'money', 50, 39, 24, 9),
  region(W2_ID, 'r-w2-12b', '12b', 'Code DD — cost of employer health coverage', 'DD  9,180.00', 'money', 75, 39, 23, 9),
  region(W2_ID, 'r-w2-16', '16', 'State wages, tips, etc.', '84,320.00', 'money', 50, 51, 24, 9),
  region(W2_ID, 'r-w2-17', '17', 'State income tax', '5,914.00', 'money', 75, 51, 23, 9),
];

/* ------------------------------------------------------------------ */
/* Hero documents 2 & 3 — the corrected-1099 discrepancy               */
/* ------------------------------------------------------------------ */

const NEC_ORIG_ID = 'doc-1099nec-northwind-orig';
const NEC_CORR_ID = 'doc-1099nec-northwind-corrected';

const NEC_ORIG_REGIONS: DocumentRegion[] = [
  region(NEC_ORIG_ID, 'r-neco-payer', undefined, "Payer's name and address", 'Northwind Labs, Inc.\n1200 Bridgepointe Pkwy\nSan Mateo, CA 94404', 'text', 3, 12, 45, 20),
  region(NEC_ORIG_ID, 'r-neco-tin', undefined, "Payer's TIN", '81-2204417', 'id', 3, 34, 45, 9),
  region(NEC_ORIG_ID, 'r-neco-rec', undefined, "Recipient's name", 'Delgado Studio Inc.', 'text', 3, 45, 45, 10),
  region(NEC_ORIG_ID, 'r-neco-1', '1', 'Nonemployee compensation', '18,400.00', 'money', 52, 12, 45, 12),
  region(NEC_ORIG_ID, 'r-neco-4', '4', 'Federal income tax withheld', '0.00', 'money', 52, 26, 45, 10),
];

const NEC_CORR_REGIONS: DocumentRegion[] = [
  region(NEC_CORR_ID, 'r-necc-corrected', undefined, 'CORRECTED checkbox', '☒ CORRECTED', 'text', 52, 3, 45, 7),
  region(NEC_CORR_ID, 'r-necc-payer', undefined, "Payer's name and address", 'Northwind Labs, Inc.\n1200 Bridgepointe Pkwy\nSan Mateo, CA 94404', 'text', 3, 12, 45, 20),
  region(NEC_CORR_ID, 'r-necc-tin', undefined, "Payer's TIN", '81-2204417', 'id', 3, 34, 45, 9),
  region(NEC_CORR_ID, 'r-necc-rec', undefined, "Recipient's name", 'Delgado Studio Inc.', 'text', 3, 45, 45, 10),
  region(NEC_CORR_ID, 'r-necc-1', '1', 'Nonemployee compensation', '16,900.00', 'money', 52, 12, 45, 12),
  region(NEC_CORR_ID, 'r-necc-4', '4', 'Federal income tax withheld', '0.00', 'money', 52, 26, 45, 10),
];

/* ------------------------------------------------------------------ */
/* Hero document 4 — a clean 1099-NEC                                  */
/* ------------------------------------------------------------------ */

const NEC_BRIGHT_ID = 'doc-1099nec-brightpath';

const NEC_BRIGHT_REGIONS: DocumentRegion[] = [
  region(NEC_BRIGHT_ID, 'r-necb-payer', undefined, "Payer's name and address", 'Brightpath Ventures LLC\n88 Kearny Street, Suite 1400\nSan Francisco, CA 94108', 'text', 3, 12, 45, 20),
  region(NEC_BRIGHT_ID, 'r-necb-tin', undefined, "Payer's TIN", '46-7719203', 'id', 3, 34, 45, 9),
  region(NEC_BRIGHT_ID, 'r-necb-rec', undefined, "Recipient's name", 'Delgado Studio Inc.', 'text', 3, 45, 45, 10),
  region(NEC_BRIGHT_ID, 'r-necb-1', '1', 'Nonemployee compensation', '42,750.00', 'money', 52, 12, 45, 12),
  region(NEC_BRIGHT_ID, 'r-necb-4', '4', 'Federal income tax withheld', '0.00', 'money', 52, 26, 45, 10),
];

/* ------------------------------------------------------------------ */
/* Hero document 5 — 1099-INT                                          */
/* ------------------------------------------------------------------ */

const INT_ID = 'doc-1099int-meridian';

const INT_REGIONS: DocumentRegion[] = [
  region(INT_ID, 'r-int-payer', undefined, "Payer's name", 'Meridian Savings Bank\n2001 Michelson Dr\nIrvine, CA 92612', 'text', 3, 12, 45, 20),
  region(INT_ID, 'r-int-1', '1', 'Interest income', '1,284.00', 'money', 52, 12, 45, 12),
  region(INT_ID, 'r-int-4', '4', 'Federal income tax withheld', '0.00', 'money', 52, 26, 45, 10),
];

/* ------------------------------------------------------------------ */
/* Hero document 6 — 1098 mortgage interest                            */
/* ------------------------------------------------------------------ */

const M1098_ID = 'doc-1098-summit';

const M1098_REGIONS: DocumentRegion[] = [
  region(M1098_ID, 'r-1098-lender', undefined, "Lender's name", 'Summit Home Loans\nPO Box 44120\nPhoenix, AZ 85064', 'text', 3, 12, 45, 20),
  region(M1098_ID, 'r-1098-1', '1', 'Mortgage interest received from payer', '19,847.00', 'money', 52, 12, 45, 12),
  region(M1098_ID, 'r-1098-2', '2', 'Outstanding mortgage principal', '612,400.00', 'money', 52, 26, 45, 10),
  region(M1098_ID, 'r-1098-5', '5', 'Mortgage insurance premiums', '0.00', 'money', 52, 38, 45, 10),
  region(M1098_ID, 'r-1098-6', '6', 'Points paid on purchase of principal residence', '3,100.00', 'money', 52, 50, 45, 10),
];

/* ------------------------------------------------------------------ */
/* Hero document 7 — the smudged K-1 (low-confidence extraction)       */
/* ------------------------------------------------------------------ */

const K1_ID = 'doc-k1-delgado';

const K1_REGIONS: DocumentRegion[] = [
  region(K1_ID, 'r-k1-entity', undefined, "Corporation's name", 'Delgado Studio Inc.\n812 Camino Verde\nIrvine, CA 92612', 'text', 3, 14, 45, 18),
  region(K1_ID, 'r-k1-share', undefined, 'Shareholder’s percentage of stock ownership', '100.000%', 'text', 3, 34, 45, 9),
  region(K1_ID, 'r-k1-1', '1', 'Ordinary business income (loss)', '3l,480.00', 'money', 52, 14, 45, 12),
  region(K1_ID, 'r-k1-16c', '16C', 'Nondeductible expenses', '740.00', 'money', 52, 28, 45, 10),
  region(K1_ID, 'r-k1-17v', '17V', 'Section 199A qualified business income', '31,480.00', 'money', 52, 40, 45, 10),
];

/* ------------------------------------------------------------------ */
/* Hero document 8 — bank statement (evidence for a MISSING form)      */
/* ------------------------------------------------------------------ */

const STMT_ID = 'doc-stmt-coastal';

const STMT_REGIONS: DocumentRegion[] = [
  region(STMT_ID, 'r-stmt-acct', undefined, 'Account', 'Coastal Credit Union · High-Yield Savings ····4471', 'text', 4, 14, 92, 8),
  region(STMT_ID, 'r-stmt-int', undefined, 'Interest paid year-to-date', '$742.16', 'money', 4, 40, 92, 9),
];

/* ------------------------------------------------------------------ */
/* Hero document registry                                              */
/* ------------------------------------------------------------------ */

interface HeroSpec {
  id: string;
  name: string;
  kind: DocumentKind;
  issuer: string;
  category: DocumentCategory;
  status: SourceDocument['status'];
  facsimile: SourceDocument['facsimile'];
  regions: DocumentRegion[];
  uploadedAt: string;
  uploadedBy: string;
  sizeKb: number;
  pages?: number;
}

const HERO_SPECS: HeroSpec[] = [
  {
    id: W2_ID,
    name: 'W-2 — Halcyon Design Group (2025)',
    kind: 'W-2',
    issuer: 'Halcyon Design Group LLC',
    category: 'Income',
    status: 'verified',
    facsimile: 'w2',
    regions: W2_REGIONS,
    uploadedAt: '2026-02-04T17:22:00Z',
    uploadedBy: 'u-marcus',
    sizeKb: 218,
  },
  {
    id: NEC_ORIG_ID,
    name: '1099-NEC — Northwind Labs (original)',
    kind: '1099-NEC',
    issuer: 'Northwind Labs, Inc.',
    category: 'Business',
    status: 'needs_review',
    facsimile: '1099nec',
    regions: NEC_ORIG_REGIONS,
    uploadedAt: '2026-02-06T15:10:00Z',
    uploadedBy: 'u-marcus',
    sizeKb: 96,
  },
  {
    id: NEC_CORR_ID,
    name: '1099-NEC — Northwind Labs (CORRECTED)',
    kind: '1099-NEC',
    issuer: 'Northwind Labs, Inc.',
    category: 'Business',
    status: 'needs_review',
    facsimile: '1099nec',
    regions: NEC_CORR_REGIONS,
    uploadedAt: '2026-02-27T11:48:00Z',
    uploadedBy: 'u-marcus',
    sizeKb: 98,
  },
  {
    id: NEC_BRIGHT_ID,
    name: '1099-NEC — Brightpath Ventures',
    kind: '1099-NEC',
    issuer: 'Brightpath Ventures LLC',
    category: 'Business',
    status: 'extracted',
    facsimile: '1099nec',
    regions: NEC_BRIGHT_REGIONS,
    uploadedAt: '2026-02-06T15:11:00Z',
    uploadedBy: 'u-marcus',
    sizeKb: 94,
  },
  {
    id: INT_ID,
    name: '1099-INT — Meridian Savings Bank',
    kind: '1099-INT',
    issuer: 'Meridian Savings Bank',
    category: 'Investments',
    status: 'extracted',
    facsimile: '1099int',
    regions: INT_REGIONS,
    uploadedAt: '2026-02-05T09:03:00Z',
    uploadedBy: 'u-marcus',
    sizeKb: 88,
  },
  {
    id: M1098_ID,
    name: '1098 — Summit Home Loans',
    kind: '1098',
    issuer: 'Summit Home Loans',
    category: 'Property',
    status: 'extracted',
    facsimile: '1098',
    regions: M1098_REGIONS,
    uploadedAt: '2026-02-05T09:05:00Z',
    uploadedBy: 'u-marcus',
    sizeKb: 102,
  },
  {
    id: K1_ID,
    name: 'Schedule K-1 — Delgado Studio Inc.',
    kind: 'K-1',
    issuer: 'Delgado Studio Inc.',
    category: 'Business',
    status: 'needs_review',
    facsimile: 'k1',
    regions: K1_REGIONS,
    uploadedAt: '2026-03-02T13:37:00Z',
    uploadedBy: 'u-jordan',
    sizeKb: 1440,
    pages: 2,
  },
  {
    id: STMT_ID,
    name: 'Coastal Credit Union — December statement',
    kind: 'Bank Statement',
    issuer: 'Coastal Credit Union',
    category: 'Investments',
    status: 'needs_review',
    facsimile: undefined,
    regions: STMT_REGIONS,
    uploadedAt: '2026-03-04T08:12:00Z',
    uploadedBy: 'u-marcus',
    sizeKb: 340,
    pages: 3,
  },
];

export const HERO_DOCUMENTS: SourceDocument[] = HERO_SPECS.map((s) => ({
  id: s.id,
  returnId: HERO_RETURN_ID,
  name: s.name,
  kind: s.kind,
  issuer: s.issuer,
  pages: s.pages ?? 1,
  status: s.status,
  uploadedAt: s.uploadedAt,
  uploadedBy: s.uploadedBy,
  sizeKb: s.sizeKb,
  regions: s.regions,
  facsimile: s.facsimile,
  category: s.category,
}));

/* Convenience ids used by fields/insights so the links can't drift. */
export const DOC = {
  w2: W2_ID,
  necOriginal: NEC_ORIG_ID,
  necCorrected: NEC_CORR_ID,
  necBrightpath: NEC_BRIGHT_ID,
  int: INT_ID,
  mortgage: M1098_ID,
  k1: K1_ID,
  statement: STMT_ID,
} as const;

export const REGION = {
  w2Wages: 'r-w2-1',
  w2FedTax: 'r-w2-2',
  w2StateTax: 'r-w2-17',
  w2Retirement: 'r-w2-12a',
  necOriginalAmount: 'r-neco-1',
  necCorrectedAmount: 'r-necc-1',
  necCorrectedFlag: 'r-necc-corrected',
  necBrightpathAmount: 'r-necb-1',
  intAmount: 'r-int-1',
  mortgageInterest: 'r-1098-1',
  mortgagePoints: 'r-1098-6',
  k1Ordinary: 'r-k1-1',
  k1QBI: 'r-k1-17v',
  stmtInterest: 'r-stmt-int',
} as const;

/* ------------------------------------------------------------------ */
/* Bulk documents — volume for Ch.09                                   */
/* ------------------------------------------------------------------ */

const BULK_KINDS: ReadonlyArray<readonly [DocumentKind, DocumentCategory, number]> = [
  ['Receipt', 'Deductions', 30],
  ['1099-B', 'Investments', 10],
  ['1099-DIV', 'Investments', 8],
  ['1099-INT', 'Investments', 6],
  ['Bank Statement', 'Reference', 10],
  ['Mileage Log', 'Business', 5],
  ['1098-T', 'Deductions', 3],
  ['1095-A', 'Health', 3],
  ['5498-SA', 'Health', 3],
  ['Other', 'Reference', 6],
];

const VENDORS = [
  'Adobe Systems', 'Figma Inc.', 'Notion Labs', 'Linear Orbit', 'WeWork Irvine',
  'Southwest Airlines', 'Hyatt Place', 'Uber Technologies', 'Apple Store', 'B&H Photo',
  'Costco Wholesale', 'Staples', 'Verizon Wireless', 'Spectrum Business', 'DigitalOcean',
  'Amazon Web Services', 'Dropbox', 'Slack Technologies', 'Zoom Video', 'LinkedIn Premium',
  'Charles Schwab', 'Fidelity Investments', 'Vanguard Group', 'Coastal Credit Union',
  'Meridian Savings Bank', 'Blue Shield of CA', 'Kaiser Permanente', 'UC Irvine Extension',
  'Sequoia Print Co.', 'Pacific Coast Legal',
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/* ------------------------------------------------------------------ */
/* Believable form content for bulk documents                          */
/* ------------------------------------------------------------------ */
/* Bulk documents used to open as a blank ruled page. That undercut the
   whole point of a "source document" — you couldn't see anything. So the
   common information returns now render as real facsimiles with populated
   boxes, and receipts / statements get structured content, all seeded so
   they're stable on every load. */

type FormFacsimile = NonNullable<SourceDocument['facsimile']>;

const KIND_TO_FACSIMILE: Partial<Record<DocumentKind, FormFacsimile>> = {
  'W-2': 'w2',
  '1099-NEC': '1099nec',
  '1099-INT': '1099int',
  '1099-DIV': '1099div',
  '1099-B': '1099b',
  '1098': '1098',
  '1098-T': '1098t',
  '1095-A': '1095a',
  '5498-SA': '5498sa',
  'K-1': 'k1',
};

interface BoxSpec {
  boxNo?: string;
  label: string;
  value: string;
  kind?: DocumentRegion['kind'];
}

/** The amount boxes each information return shows, with realistic box numbers. */
const FORM_BOXES: Record<FormFacsimile, (r: Rand, usd: (n: number) => string) => BoxSpec[]> = {
  w2: (r, usd) => [
    { boxNo: '1', label: 'Wages, tips, other comp.', value: usd(r.money(42000, 180000, 10)) },
    { boxNo: '2', label: 'Federal income tax withheld', value: usd(r.money(4000, 32000, 10)) },
    { boxNo: '3', label: 'Social security wages', value: usd(r.money(42000, 168600, 10)) },
    { boxNo: '17', label: 'State income tax', value: usd(r.money(1500, 12000, 10)) },
  ],
  '1099nec': (r, usd) => [
    { boxNo: '1', label: 'Nonemployee compensation', value: usd(r.money(1200, 60000, 10)) },
    { boxNo: '4', label: 'Federal income tax withheld', value: usd(r.money(0, 4000, 10)) },
  ],
  '1099int': (r, usd) => [
    { boxNo: '1', label: 'Interest income', value: usd(r.money(20, 3200, 1)) },
    { boxNo: '4', label: 'Federal income tax withheld', value: usd(r.money(0, 300, 1)) },
  ],
  '1099div': (r, usd) => {
    const a = r.money(80, 7200, 1);
    return [
      { boxNo: '1a', label: 'Total ordinary dividends', value: usd(a) },
      { boxNo: '1b', label: 'Qualified dividends', value: usd(Math.round(a * 0.8)) },
      { boxNo: '2a', label: 'Total capital gain distr.', value: usd(r.money(0, 2400, 1)) },
      { boxNo: '4', label: 'Federal income tax withheld', value: usd(r.money(0, 200, 1)) },
    ];
  },
  '1099b': (r, usd) => {
    const proceeds = r.money(1500, 42000, 10);
    return [
      { boxNo: '1a', label: 'Description of property', value: `${r.int(10, 400)} sh.`, kind: 'text' },
      { boxNo: '1d', label: 'Proceeds', value: usd(proceeds) },
      { boxNo: '1e', label: 'Cost or other basis', value: usd(Math.round(proceeds * r.float(0.6, 1.1))) },
      { boxNo: '4', label: 'Federal income tax withheld', value: usd(r.money(0, 300, 1)) },
    ];
  },
  '1098': (r, usd) => [
    { boxNo: '1', label: 'Mortgage interest received', value: usd(r.money(3000, 26000, 10)) },
    { boxNo: '2', label: 'Outstanding mortgage principal', value: usd(r.money(180000, 900000, 100)) },
  ],
  '1098t': (r, usd) => [
    { boxNo: '1', label: 'Payments for qualified tuition', value: usd(r.money(1200, 24000, 10)) },
    { boxNo: '5', label: 'Scholarships or grants', value: usd(r.money(0, 12000, 10)) },
  ],
  '1095a': (r, usd) => [
    { boxNo: '33A', label: 'Annual premium amount', value: usd(r.money(3600, 18000, 10)) },
    { boxNo: '33B', label: 'Annual premium SLCSP', value: usd(r.money(3600, 18000, 10)) },
    { boxNo: '33C', label: 'Advance payment of PTC', value: usd(r.money(0, 9000, 10)) },
  ],
  '5498sa': (r, usd) => [
    { boxNo: '1', label: 'HSA contributions this year', value: usd(r.money(500, 4150, 10)) },
    { boxNo: '2', label: 'Total contributions', value: usd(r.money(500, 4150, 10)) },
    { boxNo: '5', label: 'Fair market value of HSA', value: usd(r.money(1000, 32000, 10)) },
  ],
  k1: (r, usd) => [
    { boxNo: '1', label: 'Ordinary business income', value: usd(r.money(2000, 90000, 10)) },
    { boxNo: '2', label: 'Net rental real estate income', value: usd(r.money(0, 20000, 10)) },
    { boxNo: '16', label: 'Items affecting basis', value: usd(r.money(0, 8000, 10)) },
  ],
};

/** Stacked rows for documents that aren't IRS forms, so they still read as
 *  a real page rather than a blank one. */
const NONFORM_ROWS: Partial<
  Record<DocumentKind, (r: Rand, usd: (n: number) => string, issuer: string) => BoxSpec[]>
> = {
  Receipt: (r, usd, issuer) => {
    const sub = r.money(12, 1400, 1);
    const tax = Math.round(sub * 0.0875);
    return [
      { label: 'Merchant', value: issuer, kind: 'text' },
      {
        label: 'Description',
        value: r.pick([
          'Software subscription',
          'Office supplies',
          'Travel — airfare',
          'Client dinner',
          'Hardware purchase',
          'Coworking day pass',
        ]),
        kind: 'text',
      },
      { label: 'Subtotal', value: usd(sub), kind: 'money' },
      { label: 'Sales tax', value: usd(tax), kind: 'money' },
      { label: 'Total', value: usd(sub + tax), kind: 'money' },
    ];
  },
  'Bank Statement': (r, usd, issuer) => [
    { label: 'Account', value: `${issuer} ····${r.int(1000, 9999)}`, kind: 'id' },
    { label: 'Beginning balance', value: usd(r.money(1000, 40000, 1)), kind: 'money' },
    { label: 'Total deposits', value: usd(r.money(2000, 60000, 1)), kind: 'money' },
    { label: 'Total withdrawals', value: usd(r.money(1000, 55000, 1)), kind: 'money' },
    { label: 'Ending balance', value: usd(r.money(1000, 45000, 1)), kind: 'money' },
  ],
  'Mileage Log': (r, usd) => {
    const mi = r.int(80, 1400);
    return [
      { label: 'Total miles', value: `${mi} mi`, kind: 'text' },
      { label: 'Business miles', value: `${Math.round(mi * r.float(0.6, 0.95))} mi`, kind: 'text' },
      { label: 'Standard rate', value: '$0.67 / mi', kind: 'text' },
      { label: 'Deduction', value: usd(Math.round(mi * 0.67)), kind: 'money' },
    ];
  },
  Other: (r, _usd, issuer) => [
    { label: 'Document from', value: issuer, kind: 'text' },
    { label: 'Reference', value: `REF-${r.int(100000, 999999)}`, kind: 'id' },
  ],
};

/** Builds the facsimile flag and populated regions for one bulk document. */
function bulkContent(
  docId: string,
  kind: DocumentKind,
  issuer: string,
  rand: Rand,
): { facsimile?: FormFacsimile; regions: DocumentRegion[] } {
  const usd = (n: number) => '$' + Math.round(n).toLocaleString('en-US');
  const region = (
    i: number,
    boxNo: string | undefined,
    label: string,
    rawText: string,
    rkind: DocumentRegion['kind'],
    bbox: DocumentRegion['bbox'],
  ): DocumentRegion => ({ id: `${docId}-r${i}`, documentId: docId, page: 1, boxNo, label, rawText, kind: rkind, bbox });

  const fac = KIND_TO_FACSIMILE[kind];
  if (fac) {
    const regions: DocumentRegion[] = [
      region(0, undefined, 'PAYER’S name, address', `${issuer}\n1 Market Plaza\nSan Francisco, CA 94105`, 'text', { x: 4, y: 2, w: 44, h: 15 }),
      region(1, undefined, 'RECIPIENT', `Marcus Delgado\nTIN ***-**-4291`, 'text', { x: 52, y: 2, w: 44, h: 15 }),
    ];
    FORM_BOXES[fac](rand, usd).forEach((b, k) => {
      const col = k % 2;
      const row = Math.floor(k / 2);
      regions.push(
        region(2 + k, b.boxNo, b.label, b.value, b.kind ?? 'money', {
          x: col ? 52 : 4,
          y: 20 + row * 15,
          w: 44,
          h: 12,
        }),
      );
    });
    return { facsimile: fac, regions };
  }

  const rows = NONFORM_ROWS[kind]?.(rand, usd, issuer);
  if (!rows) return { regions: [] };
  return {
    regions: rows.map((b, k) =>
      region(k, b.boxNo, b.label, b.value, b.kind ?? 'text', { x: 6, y: 6 + k * 12, w: 88, h: 9 }),
    ),
  };
}

/**
 * ~320 additional documents on the hero return. Enough that the library has
 * to actually work — you cannot eyeball this list, you have to search it.
 */
export function buildBulkDocuments(returnId: string, count = 320): SourceDocument[] {
  const rand = new Rand(20260312);
  const anchor = new Date('2026-01-05T00:00:00Z');
  const out: SourceDocument[] = [];

  const kindPool = BULK_KINDS.map(([k, c, w]) => [[k, c] as const, w] as const);

  for (let i = 0; i < count; i++) {
    const [kind, category] = rand.weighted(kindPool);
    const issuer = rand.pick(VENDORS);
    const status = rand.weighted([
      ['extracted', 62],
      ['verified', 24],
      ['needs_review', 10],
      ['processing', 4],
    ] as const);

    const name =
      kind === 'Receipt'
        ? `Receipt — ${issuer} · ${rand.pick(MONTHS)}`
        : kind === 'Bank Statement'
          ? `${issuer} — ${rand.pick(MONTHS)} statement`
          : kind === 'Mileage Log'
            ? `Mileage log — ${rand.pick(MONTHS)}`
            : `${kind} — ${issuer}`;

    const docId = `doc-bulk-${i.toString().padStart(3, '0')}`;
    const { facsimile, regions } = bulkContent(docId, kind, issuer, rand);
    out.push({
      id: docId,
      returnId,
      name,
      kind,
      issuer,
      pages: rand.weighted([[1, 70], [2, 18], [3, 8], [6, 4]] as const),
      status,
      uploadedAt: rand.dateOffset(anchor, 0, 62),
      uploadedBy: rand.bool(0.82) ? 'u-marcus' : 'u-jordan',
      sizeKb: rand.int(48, 2400),
      regions,
      facsimile,
      category,
    });
  }

  return out;
}

export const ALL_HERO_RETURN_DOCUMENTS: SourceDocument[] = [
  ...HERO_DOCUMENTS,
  ...buildBulkDocuments(HERO_RETURN_ID),
];
