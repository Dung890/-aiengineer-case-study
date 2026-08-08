'use client';

import { create } from 'zustand';
import type { DataState, InsightStatus, Message, ReturnField, Role, TaskStatus } from './types';
import { HERO_FIELDS } from './mock/fields';
import { getField, getFields } from './mock';
import { DEFAULT_USER_ID, HERO_RETURN_ID, USER_BY_ID } from './mock/users';

/* ==================================================================
   Demo state
   ------------------------------------------------------------------
   This is the one piece of "backend" that genuinely runs: accepting an
   AI suggestion, correcting a value or verifying a figure really does
   mutate the return, and every dependent calculated line recomputes.

   That matters for the brief. A prototype where the buttons are painted
   on proves nothing about a correction workflow; the whole question in
   Ch.10 is what happens AFTER someone disagrees with the model.

   Deliberately NOT persisted to localStorage. A demo that remembers
   yesterday's half-finished clicking is worse than one that always
   opens in a known-good state — and there is a Reset control for
   getting back mid-walkthrough.
   ================================================================== */

interface FieldOverride {
  value: number;
  state: DataState;
  previousValue: number;
  by: string;
  at: string;
  note?: string;
}

interface DemoState {
  /* --- identity (Ch.05) --- */
  activeUserId: string;
  activeRole: Role;
  setRole: (role: Role, userId?: string) => void;

  /* --- return edits --- */
  fieldOverrides: Record<string, FieldOverride>;
  setFieldValue: (fieldId: string, value: number, opts?: { note?: string; state?: DataState }) => void;
  verifyField: (fieldId: string) => void;
  resetField: (fieldId: string) => void;

  /* --- AI findings (Ch.10) --- */
  insightStatus: Record<string, InsightStatus>;
  setInsightStatus: (insightId: string, status: InsightStatus) => void;

  /* --- tasks --- */
  taskStatus: Record<string, TaskStatus>;
  setTaskStatus: (taskId: string, status: TaskStatus) => void;

  /* --- threads (Ch.02) --- */
  extraMessages: Record<string, Message[]>;
  addMessage: (threadId: string, body: string, internalOnly: boolean) => void;

  /* --- onboarding (Ch.03) --- */
  onboardingDone: string[];
  completeOnboardingStep: (taskId: string) => void;

  /* --- navigation memory (Ch.04) --- */
  lastWorkflow: { label: string; href: string } | null;
  setLastWorkflow: (w: { label: string; href: string } | null) => void;

  resetDemo: () => void;
}

const INITIAL = {
  activeUserId: DEFAULT_USER_ID,
  activeRole: 'preparer' as Role,
  fieldOverrides: {} as Record<string, FieldOverride>,
  insightStatus: {} as Record<string, InsightStatus>,
  taskStatus: {} as Record<string, TaskStatus>,
  extraMessages: {} as DemoState['extraMessages'],
  onboardingDone: [] as string[],
  lastWorkflow: null,
};

export const useDemo = create<DemoState>((set, get) => ({
  ...INITIAL,

  setRole: (role, userId) =>
    set((s) => ({
      activeRole: role,
      activeUserId: userId ?? s.activeUserId,
    })),

  setFieldValue: (fieldId, value, opts) => {
    const base = getField(fieldId);
    if (!base) return;
    const current = get().fieldOverrides[fieldId];
    set((s) => ({
      fieldOverrides: {
        ...s.fieldOverrides,
        [fieldId]: {
          value,
          // A human-touched value is verified unless the caller says otherwise.
          state: opts?.state ?? 'verified',
          previousValue: current?.previousValue ?? base.value,
          by: s.activeUserId,
          at: new Date().toISOString(),
          note: opts?.note,
        },
      },
    }));
  },

  verifyField: (fieldId) => {
    const base = getField(fieldId);
    if (!base) return;
    const current = get().fieldOverrides[fieldId];
    set((s) => ({
      fieldOverrides: {
        ...s.fieldOverrides,
        [fieldId]: {
          value: current?.value ?? base.value,
          state: 'verified',
          previousValue: current?.previousValue ?? base.value,
          by: s.activeUserId,
          at: new Date().toISOString(),
        },
      },
    }));
  },

  resetField: (fieldId) =>
    set((s) => {
      const next = { ...s.fieldOverrides };
      delete next[fieldId];
      return { fieldOverrides: next };
    }),

  setInsightStatus: (insightId, status) =>
    set((s) => ({ insightStatus: { ...s.insightStatus, [insightId]: status } })),

  setTaskStatus: (taskId, status) =>
    set((s) => ({ taskStatus: { ...s.taskStatus, [taskId]: status } })),

  addMessage: (threadId, body, internalOnly) =>
    set((s) => ({
      extraMessages: {
        ...s.extraMessages,
        [threadId]: [
          ...(s.extraMessages[threadId] ?? []),
          {
            id: `m-live-${threadId}-${(s.extraMessages[threadId]?.length ?? 0) + 1}`,
            threadId,
            authorId: s.activeUserId,
            body,
            sentAt: new Date().toISOString(),
            internalOnly,
          },
        ],
      },
    })),

  completeOnboardingStep: (taskId) =>
    set((s) => ({
      onboardingDone: s.onboardingDone.includes(taskId)
        ? s.onboardingDone
        : [...s.onboardingDone, taskId],
    })),

  setLastWorkflow: (w) => set({ lastWorkflow: w }),

  resetDemo: () => set({ ...INITIAL }),
}));

/* ------------------------------------------------------------------ */
/* Derived reads                                                       */
/* ------------------------------------------------------------------ */

/** A field with any live edit applied. Components never read raw mock data. */
export function applyOverride(
  field: ReturnField,
  overrides: Record<string, FieldOverride>,
): ReturnField {
  const o = overrides[field.id];
  if (!o) return field;
  return {
    ...field,
    value: o.value,
    state: o.state,
    override: {
      previousValue: o.previousValue,
      by: o.by,
      at: o.at,
      note: o.note,
    },
  };
}

/**
 * Recomputes every `calculated` line from its inputs.
 *
 * The dependency graph is declared explicitly rather than parsed out of the
 * provenance steps — for a prototype that is both shorter and far easier to
 * read than a generic formula engine, and it keeps the demo honest: change
 * gross receipts and the balance due at the bottom really does move.
 */
export function recompute(fields: ReturnField[]): ReturnField[] {
  const v: Record<string, number> = {};
  for (const f of fields) v[f.id] = f.value;

  v['fld-sch-c-net'] = v['fld-gross-receipts']! - v['fld-sch-c-expenses']!;
  v['fld-total-income'] =
    v['fld-wages']! +
    v['fld-interest']! +
    v['fld-dividends']! +
    v['fld-sch-c-net']! +
    v['fld-k1-income']!;

  const netSE = Math.round(v['fld-sch-c-net']! * 0.9235);
  v['fld-se-tax'] = Math.round(netSE * 0.153);
  v['fld-se-tax-deduction'] = Math.round(v['fld-se-tax']! / 2);

  v['fld-agi'] = v['fld-total-income']! - v['fld-se-tax-deduction']! - v['fld-se-health']!;

  v['fld-total-deductions'] =
    v['fld-mortgage-interest']! + v['fld-points']! + v['fld-salt']! + v['fld-charitable']!;

  v['fld-taxable-income'] = Math.max(
    0,
    v['fld-agi']! - v['fld-total-deductions']! - v['fld-qbi']!,
  );

  v['fld-income-tax'] = bracketTax(v['fld-taxable-income']!);
  v['fld-total-tax'] = v['fld-income-tax']! + v['fld-se-tax']!;
  v['fld-balance-due'] =
    v['fld-total-tax']! - v['fld-withholding']! - v['fld-estimated-payments']!;

  return fields.map((f) =>
    f.state === 'calculated' || f.id === 'fld-balance-due'
      ? { ...f, value: Math.round(v[f.id] ?? f.value) }
      : f,
  );
}

/** 2025 single-filer rate schedule. */
function bracketTax(taxable: number) {
  const brackets: Array<[number, number]> = [
    [11925, 0.1],
    [48475, 0.12],
    [103350, 0.22],
    [197300, 0.24],
    [250525, 0.32],
    [626350, 0.35],
    [Infinity, 0.37],
  ];
  let tax = 0;
  let lower = 0;
  for (const [ceiling, rate] of brackets) {
    if (taxable <= lower) break;
    tax += (Math.min(taxable, ceiling) - lower) * rate;
    lower = ceiling;
  }
  return Math.round(tax);
}

/**
 * The live view of a return's figures.
 *
 * Only the hero return runs through `recompute` — its line ids are what the
 * dependency graph is written against. Derived returns are internally
 * consistent at build time instead, so their columns still add up; they just
 * don't cascade when edited. That trade is called out in the README rather
 * than hidden.
 */
export function useFields(returnId: string = HERO_RETURN_ID): ReturnField[] {
  const overrides = useDemo((s) => s.fieldOverrides);
  const base = returnId === HERO_RETURN_ID ? HERO_FIELDS : getFields(returnId);
  const applied = base.map((f) => applyOverride(f, overrides));
  return returnId === HERO_RETURN_ID ? recompute(applied) : applied;
}

export function useActiveUser() {
  const id = useDemo((s) => s.activeUserId);
  return USER_BY_ID[id]!;
}
