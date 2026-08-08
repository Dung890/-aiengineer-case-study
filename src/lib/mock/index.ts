/**
 * The whole "backend", in one module.
 *
 * Screens import from here and nowhere else, so the day this becomes a real
 * API only this file changes. Everything is synchronous and in-memory — there
 * is deliberately no loading state to fake, because the case study asks for
 * proof that the *interaction model* works, not a simulation of latency.
 */

import type { SourceDocument, Task, TaxReturn, Thread } from '../types';

export * from './users';
export * from './documents';
export * from './fields';
export * from './insights';
export * from './returns';
export * from './threads';
export * from './tasks';

import { ALL_HERO_RETURN_DOCUMENTS } from './documents';
import { HERO_FIELDS } from './fields';
import { HERO_INSIGHTS } from './insights';
import { ALL_RETURNS, RETURN_BY_ID } from './returns';
import { HERO_THREADS } from './threads';
import { ALL_TASKS } from './tasks';
import { HERO_RETURN_ID } from './users';
import { derived } from './derive';

/* ------------------------------------------------------------------ */
/* Reads                                                               */
/* ------------------------------------------------------------------ */

export function getReturn(id: string): TaxReturn | undefined {
  return RETURN_BY_ID[id];
}

export function getReturns(): TaxReturn[] {
  return ALL_RETURNS;
}

/**
 * Every return a client owns (Ch.05 business-owner case: a personal 1040 plus
 * one or more entity returns). Personal 1040 first, so the switcher opens on the
 * filing most clients think of as "theirs".
 */
export function getClientReturns(userId: string): TaxReturn[] {
  return ALL_RETURNS.filter((r) => r.clientId === userId).sort(
    (a, b) => Number(b.formType === '1040') - Number(a.formType === '1040'),
  );
}

/**
 * Marcus is hand-modelled; every other return synthesises equivalent content
 * from `derive.ts`. Callers never need to know which is which — that is the
 * whole point, because a screen that behaves differently for the "real" client
 * and the rest is a screen that only works in the demo.
 */
export function getDocuments(returnId: string): SourceDocument[] {
  if (returnId === HERO_RETURN_ID) return ALL_HERO_RETURN_DOCUMENTS;
  const ret = RETURN_BY_ID[returnId];
  return ret ? derived(ret).documents : [];
}

export function getDocument(documentId: string): SourceDocument | undefined {
  const hero = ALL_HERO_RETURN_DOCUMENTS.find((d) => d.id === documentId);
  if (hero) return hero;
  // Derived ids are prefixed with their return id, so we can go straight there
  // instead of generating every return's library to find one document.
  const ret = ALL_RETURNS.find((r) => documentId.startsWith(`${r.id}-doc-`));
  return ret ? derived(ret).documents.find((d) => d.id === documentId) : undefined;
}

export function getRegion(documentId: string, regionId: string) {
  return getDocument(documentId)?.regions.find((r) => r.id === regionId);
}

/** Find a field by id across the hero return and every derived one. */
export function getField(fieldId: string) {
  const hero = HERO_FIELDS.find((f) => f.id === fieldId);
  if (hero) return hero;
  const ret = ALL_RETURNS.find((r) => fieldId.startsWith(`${r.id}-`));
  return ret ? derived(ret).fields.find((f) => f.id === fieldId) : undefined;
}

export function getFields(returnId: string) {
  if (returnId === HERO_RETURN_ID) return HERO_FIELDS;
  const ret = RETURN_BY_ID[returnId];
  return ret ? derived(ret).fields : [];
}

export function getInsights(returnId: string) {
  if (returnId === HERO_RETURN_ID) return HERO_INSIGHTS;
  const ret = RETURN_BY_ID[returnId];
  return ret ? derived(ret).insights : [];
}

export function getThreads(returnId: string): Thread[] {
  if (returnId === HERO_RETURN_ID) return HERO_THREADS;
  const ret = RETURN_BY_ID[returnId];
  return ret ? derived(ret).threads : [];
}

export function getTasks(returnId: string): Task[] {
  const authored = ALL_TASKS.filter((t) => t.returnId === returnId);
  if (authored.length) return authored;
  const ret = RETURN_BY_ID[returnId];
  return ret ? derived(ret).tasks : [];
}

/* ------------------------------------------------------------------ */
/* Visibility — the internal/external wall (Ch.02 + Ch.05)             */
/* ------------------------------------------------------------------ */

import type { Audience } from '../types';

/**
 * Applied at the data layer rather than in each component, so there is
 * exactly one place a client-visible view can leak an internal note.
 */
export function visibleThreads(returnId: string, audience: Audience): Thread[] {
  const threads = getThreads(returnId);
  if (audience === 'firm') return threads;
  return threads
    .filter((t) => t.visibility === 'shared')
    .map((t) => ({ ...t, messages: t.messages.filter((m) => !m.internalOnly) }));
}

/* ------------------------------------------------------------------ */
/* Derived counts                                                      */
/* ------------------------------------------------------------------ */

export function returnSummary(returnId: string) {
  const fields = getFields(returnId);
  const insights = getInsights(returnId);
  const docs = getDocuments(returnId);
  const tasks = getTasks(returnId);

  return {
    fieldCount: fields.length,
    unresolvedFields: fields.filter((f) =>
      ['flagged', 'ai_low_confidence', 'needs_approval', 'ai_suggested'].includes(f.state),
    ).length,
    openInsights: insights.filter((i) => i.status === 'open').length,
    documentCount: docs.length,
    documentsNeedingReview: docs.filter((d) => d.status === 'needs_review').length,
    openClientTasks: tasks.filter((t) => t.owner === 'client' && t.status !== 'done').length,
    openFirmTasks: tasks.filter((t) => t.owner === 'firm' && t.status !== 'done').length,
  };
}
