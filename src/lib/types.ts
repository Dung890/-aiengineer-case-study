/**
 * Green Growth — domain model.
 *
 * Everything the prototype renders is derived from these types. There is no
 * backend: `src/lib/mock/*` builds a deterministic in-memory dataset that plays
 * the part of an API. Keeping the shapes honest (real provenance, real state
 * machines) is what lets the UI behave like the finished product would.
 */

/* ------------------------------------------------------------------ */
/* Roles & users                                                       */
/* ------------------------------------------------------------------ */

export type Role =
  | 'individual' // an individual taxpayer
  | 'business_owner' // a client who also owns a pass-through entity
  | 'preparer' // firm staff who prepares returns ("AI Tax Concierge")
  | 'reviewer' // credentialed reviewer (CPA/EA) who signs off
  | 'admin' // firm administrator
  | 'seasonal'; // temporary seasonal staff, deliberately limited

export type Audience = 'client' | 'firm';

/** Which side of the wall a role sits on. Drives every permission decision. */
export const ROLE_AUDIENCE: Record<Role, Audience> = {
  individual: 'client',
  business_owner: 'client',
  preparer: 'firm',
  reviewer: 'firm',
  admin: 'firm',
  seasonal: 'firm',
};

export interface RoleProfile {
  role: Role;
  label: string;
  /** One line describing what this person is here to do. */
  blurb: string;
  audience: Audience;
  /** Capabilities this role has. Checked by `can()` in lib/permissions.ts. */
  capabilities: Capability[];
}

export type Capability =
  | 'view_return' // see a return at all
  | 'view_internal_notes' // see firm-only threads
  | 'edit_field' // change a value on the return
  | 'verify_field' // mark an AI value as human-verified
  | 'approve_return' // final sign-off (credentialed only)
  | 'file_return'
  | 'manage_staff'
  | 'view_all_returns' // firm-wide queue vs. just assigned
  | 'view_fees'; // billing figures

export interface User {
  id: string;
  name: string;
  initials: string;
  email: string;
  /** A user can hold several roles — see `activeRole` in the role store. */
  roles: Role[];
  title?: string;
  /**
   * Ch.05 edge case: a firm employee who is also a client of the firm.
   * Points at their own personal return.
   */
  personalReturnId?: string;
  credential?: 'CPA' | 'EA' | null;
}

/* ------------------------------------------------------------------ */
/* Return status — one canonical ladder, two vocabularies              */
/* ------------------------------------------------------------------ */

/**
 * Ch.06. The single source of truth for "where is this return".
 * Staff and clients see *different words* but the *same position* on the same
 * ladder, so a conversation between them can never desync.
 */
export type ReturnStage =
  | 'intake' // collecting documents
  | 'questions' // open questions for the client
  | 'preparing' // firm is building the return
  | 'review' // credentialed reviewer checking it
  | 'client_approval' // client must approve before filing
  | 'filed';

export interface StageProfile {
  stage: ReturnStage;
  order: number;
  /** What the client sees. Plain English, no jargon. */
  clientLabel: string;
  /** What firm staff sees. Precise, operational. */
  firmLabel: string;
  /** Same meaning, expanded — shown in tooltips to both audiences. */
  meaning: string;
  /** Who the ball is with by default at this stage. */
  defaultOwner: Audience;
}

/** Something preventing the return from advancing. Surfaced identically to both sides. */
export interface Blocker {
  id: string;
  label: string;
  /** Who has to act to clear it. */
  owner: Audience;
  severity: 'blocking' | 'warning';
  /** Deep link to the thing that resolves it. */
  href?: string;
}

/* ------------------------------------------------------------------ */
/* Returns                                                             */
/* ------------------------------------------------------------------ */

export type FormType = '1040' | '1120S' | '1065' | '1120';

export interface TaxReturn {
  id: string;
  clientId: string;
  clientName: string;
  taxYear: number;
  formType: FormType;
  stage: ReturnStage;
  stageSince: string; // ISO date
  /** Firm staff assigned. */
  preparerId: string;
  reviewerId?: string;
  /** Who owns the *next* action right now. Overrides the stage default. */
  nextActionOwner: Audience;
  nextActionLabel: string;
  blockers: Blocker[];
  openQuestions: number;
  unreadMessages: number;
  documentCount: number;
  /** Positive = refund, negative = balance due. */
  refundOrDue: number;
  dueDate: string; // ISO
  onExtension: boolean;
  /** 1–5, drives the "this one is hairy" signal on the dashboard. */
  complexity: number;
  /** Denormalised counts used by the dashboard ranking. */
  aiFlagsOpen: number;
  lowConfidenceFields: number;
  /** Fee, only visible to roles with `view_fees`. */
  fee: number;
}

/* ------------------------------------------------------------------ */
/* Source documents & traceability                                     */
/* ------------------------------------------------------------------ */

export type DocumentKind =
  | 'W-2'
  | '1099-NEC'
  | '1099-INT'
  | '1099-DIV'
  | '1099-B'
  | '1098'
  | '1098-T'
  | '1095-A'
  | 'K-1'
  | '5498-SA'
  | 'Bank Statement'
  | 'Receipt'
  | 'Mileage Log'
  | 'Prior Year Return'
  | 'Other';

export type DocumentStatus =
  | 'processing' // AI still reading it
  | 'extracted' // AI done, nothing flagged
  | 'needs_review' // AI wants a human to look
  | 'verified'; // a human has signed off

/**
 * A highlightable area on a rendered document.
 *
 * These regions are not annotations layered on top of a scanned image — they
 * ARE the document. The facsimile renderer draws each form box from this same
 * list, so a traceability highlight lines up with its box by construction
 * rather than by hand-tuned offsets.
 *
 * Coordinates are percentages of the page box, so everything scales with the
 * viewport and stays aligned at any zoom.
 */
export interface DocumentRegion {
  id: string;
  documentId: string;
  page: number;
  /** The form's own box number, e.g. "1", "12a", "b". */
  boxNo?: string;
  /** e.g. "Wages, tips, other compensation" */
  label: string;
  /** The literal text the AI "read" out of this region. */
  rawText: string;
  /** Drives typography in the facsimile: money right-aligns and uses tnum. */
  kind?: 'money' | 'text' | 'id';
  bbox: { x: number; y: number; w: number; h: number }; // 0–100, % of page
}

export interface SourceDocument {
  id: string;
  returnId: string;
  name: string;
  kind: DocumentKind;
  issuer: string;
  pages: number;
  status: DocumentStatus;
  uploadedAt: string;
  uploadedBy: string; // user id
  sizeKb: number;
  /** Regions the AI identified. Empty for bulk/background documents. */
  regions: DocumentRegion[];
  /**
   * Only the handful of "hero" documents render as true form facsimiles.
   * The rest fall back to a generic page rendering.
   */
  facsimile?:
    | 'w2'
    | '1099nec'
    | '1099int'
    | '1099div'
    | '1099b'
    | '1098'
    | '1098t'
    | '1095a'
    | '5498sa'
    | 'k1';
  /** Grouping for the document library's hierarchy (Ch.09). */
  category: DocumentCategory;
}

export type DocumentCategory =
  | 'Income'
  | 'Investments'
  | 'Deductions'
  | 'Business'
  | 'Health'
  | 'Property'
  | 'Reference';

/* ------------------------------------------------------------------ */
/* Interaction affordances (Ch.08)                                     */
/* ------------------------------------------------------------------ */

/**
 * The visual language of the whole product. Every value the user sees carries
 * exactly one of these states, and the state — not the screen — decides how it
 * looks and what you can do to it.
 */
export type DataState =
  | 'ai_suggested' // AI produced it, nobody has checked it
  | 'ai_low_confidence' // AI produced it and isn't sure
  | 'verified' // a human confirmed it
  | 'editable' // plain user-entered value, freely editable
  | 'calculated' // derived from other fields, not directly editable
  | 'locked' // immutable (filed, IRS-sourced, or role-restricted)
  | 'needs_approval' // changed, awaiting a credentialed reviewer
  | 'flagged'; // AI or a human found a problem here

export interface DataStateProfile {
  state: DataState;
  label: string;
  /** Shown on hover/focus — the "and why" half of the affordance. */
  explanation: string;
  interactive: boolean;
  editable: boolean;
}

/* ------------------------------------------------------------------ */
/* Return fields & provenance (Ch.01)                                  */
/* ------------------------------------------------------------------ */

/** One step of arithmetic on the way from source documents to a return line. */
export interface TransformStep {
  label: string;
  /** Signed contribution, or null for pure narration steps. */
  value: number | null;
  /** Optional pointer back to the document that justifies this step. */
  documentId?: string;
  regionId?: string;
}

export interface Provenance {
  /** Every document region that fed this number. */
  sources: Array<{
    documentId: string;
    regionId: string;
    /** How much of the final value this source accounts for. */
    amount: number;
  }>;
  /** The arithmetic, shown as an auditable list rather than a black box. */
  steps: TransformStep[];
  /** Plain-English description of the rule applied. */
  rule?: string;
  /** IRC / instruction citation, if the rule is statutory. */
  citation?: string;
  verifiedBy?: string; // user id
  verifiedAt?: string;
}

export interface ReturnField {
  id: string;
  returnId: string;
  /** Where it lands on the actual form. */
  lineRef: string;
  label: string;
  section: FieldSection;
  value: number;
  state: DataState;
  /** 0–1. Present whenever the AI touched this value. */
  confidence?: number;
  provenance: Provenance;
  /** Why a locked field is locked. Surfaced on hover — never a dead end. */
  lockReason?: string;
  /** Set when a human overrode the AI's number. */
  override?: { previousValue: number; by: string; at: string; note?: string };
}

export type FieldSection =
  | 'Income'
  | 'Adjustments'
  | 'Deductions'
  | 'Credits'
  | 'Payments'
  | 'Tax';

/* ------------------------------------------------------------------ */
/* AI output (Ch.10)                                                   */
/* ------------------------------------------------------------------ */

export type InsightKind =
  | 'extraction' // "I read this number off this document"
  | 'discrepancy' // "these two sources disagree"
  | 'recommendation' // "you could claim this"
  | 'warning' // "this may cause a problem"
  | 'missing_document'; // "I expected something that isn't here"

export type InsightStatus = 'open' | 'accepted' | 'corrected' | 'dismissed' | 'escalated';

/**
 * The shape returned by `runAI()`. Deliberately opinionated: every insight must
 * carry evidence and an admission of what it does *not* know, because that pair
 * is what makes the output reviewable instead of merely confident.
 */
export interface AIInsight {
  id: string;
  returnId: string;
  kind: InsightKind;
  title: string;
  /** One sentence a non-accountant can act on. */
  summary: string;
  confidence: number; // 0–1
  /** The chain of reasoning, in plain English, shortest-first. */
  reasoning: string[];
  evidence: Array<{
    documentId: string;
    regionId?: string;
    quote: string;
  }>;
  /** What the model is explicitly unsure about. Never empty for < 0.9 confidence. */
  uncertainty?: string;
  /** Money at stake, if any. Drives prioritisation. */
  impact?: number;
  targetFieldId?: string;
  suggestedActions: AISuggestedAction[];
  status: InsightStatus;
  /** True when only a credentialed reviewer may resolve this. */
  requiresCredentialedReviewer?: boolean;
  createdAt: string;
}

export interface AISuggestedAction {
  id: string;
  label: string;
  kind: 'accept' | 'correct' | 'dismiss' | 'ask_client' | 'escalate';
  /** The value that would be written if this action is taken. */
  resultingValue?: number;
  primary?: boolean;
}

export type ConfidenceBand = 'high' | 'medium' | 'low';

/* ------------------------------------------------------------------ */
/* Collaboration (Ch.02)                                               */
/* ------------------------------------------------------------------ */

export type ThreadVisibility = 'internal' | 'shared';

export interface Message {
  id: string;
  threadId: string;
  authorId: string;
  body: string;
  sentAt: string;
  /** An internal aside inside an otherwise shared thread. */
  internalOnly?: boolean;
  attachments?: Array<{ documentId: string; name: string }>;
}

export interface Thread {
  id: string;
  returnId: string;
  subject: string;
  visibility: ThreadVisibility;
  /** What this conversation is *about* — never a free-floating inbox item. */
  anchor: ObjectRef;
  participantIds: string[];
  messages: Message[];
  /** Who has to do something next. The whole point of the collaboration layer. */
  nextActionOwner: Audience;
  status: 'open' | 'awaiting_client' | 'awaiting_firm' | 'resolved';
  updatedAt: string;
  /** Set when this thread is a formal request for something. */
  request?: {
    what: string;
    dueDate: string;
    fulfilled: boolean;
  };
}

/* ------------------------------------------------------------------ */
/* Tasks (Ch.03, Ch.07)                                                */
/* ------------------------------------------------------------------ */

export type TaskKind = 'upload' | 'answer' | 'review' | 'approve' | 'verify' | 'call';
export type TaskStatus = 'open' | 'in_progress' | 'blocked' | 'done';

export interface Task {
  id: string;
  returnId: string;
  title: string;
  detail?: string;
  kind: TaskKind;
  status: TaskStatus;
  owner: Audience;
  assigneeId?: string;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  dueDate?: string;
  /** What this task is attached to — powers the "related" rail (Ch.04). */
  links: ObjectRef[];
  /** Only meaningful for onboarding tasks. */
  onboardingStep?: number;
}

/* ------------------------------------------------------------------ */
/* Cross-object linking (Ch.04)                                        */
/* ------------------------------------------------------------------ */

export type ObjectType = 'return' | 'document' | 'field' | 'thread' | 'task' | 'insight';

/** A universal pointer. Everything in the app can reference everything else. */
export interface ObjectRef {
  type: ObjectType;
  id: string;
  /** Denormalised for display so a rail can render without a second lookup. */
  label?: string;
}

/** A resolved reference, ready to render as a link. */
export interface ResolvedRef extends ObjectRef {
  label: string;
  href: string;
  sublabel?: string;
}
