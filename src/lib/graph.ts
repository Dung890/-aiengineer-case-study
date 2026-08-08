import type { ObjectRef, ObjectType, ResolvedRef } from './types';
import {
  getDocument,
  getField,
  getFields,
  getInsights,
  getTasks,
  getThreads,
  HERO_RETURN_ID,
  INSIGHT_BY_ID,
  RETURN_BY_ID,
  TASK_BY_ID,
  THREAD_BY_ID,
} from './mock';

/* ==================================================================
   Ch.04 — Getting lost between parts of the app
   ------------------------------------------------------------------
   The navigation problem is really a data problem. If a document does
   not know which task, thread and field concern it, no amount of
   breadcrumb design will keep someone oriented.

   So: one universal `ObjectRef`, one function that turns it into a URL,
   and one function that returns everything connected to it. Every
   "Related" rail in the product is the same component reading this
   graph — which is why moving between objects never dead-ends.

   Links are declared in one direction (a task lists what it concerns)
   and inverted here at read time, so the mock data can't drift out of
   sync with itself.
   ================================================================== */

/* ------------------------------------------------------------------ */
/* Ref → URL                                                           */
/* ------------------------------------------------------------------ */

export function hrefFor(ref: ObjectRef, returnId = HERO_RETURN_ID): string {
  switch (ref.type) {
    case 'return':
      return `/returns/${ref.id}`;
    case 'document':
      return `/returns/${returnId}/documents?doc=${ref.id}`;
    case 'field':
      return `/returns/${returnId}/review?field=${ref.id}`;
    case 'insight':
      return `/returns/${returnId}/review?insight=${ref.id}`;
    case 'thread':
      return `/returns/${returnId}/messages?thread=${ref.id}`;
    case 'task':
      return `/returns/${returnId}/tasks?task=${ref.id}`;
  }
}

/** Human labels for each object type, used in rails and breadcrumbs. */
export const TYPE_LABEL: Record<ObjectType, string> = {
  return: 'Return',
  document: 'Document',
  field: 'Return line',
  thread: 'Conversation',
  task: 'Task',
  insight: 'AI finding',
};

/* ------------------------------------------------------------------ */
/* Ref → display                                                       */
/* ------------------------------------------------------------------ */

export function resolveRef(ref: ObjectRef, returnId = HERO_RETURN_ID): ResolvedRef | null {
  const href = hrefFor(ref, returnId);

  switch (ref.type) {
    case 'return': {
      const r = RETURN_BY_ID[ref.id];
      if (!r) return null;
      return { ...ref, label: `${r.clientName} · ${r.taxYear}`, href, sublabel: r.formType };
    }
    case 'document': {
      const d = getDocument(ref.id);
      if (!d) return null;
      return { ...ref, label: d.name, href, sublabel: `${d.kind} · ${d.issuer}` };
    }
    case 'field': {
      const f = getField(ref.id);
      if (!f) return null;
      return { ...ref, label: f.label, href, sublabel: f.lineRef };
    }
    case 'thread': {
      const t = THREAD_BY_ID[ref.id] ?? getThreads(returnId).find((x) => x.id === ref.id);
      if (!t) return null;
      return {
        ...ref,
        label: t.subject,
        href,
        sublabel: t.visibility === 'internal' ? 'Internal only' : `${t.messages.length} messages`,
      };
    }
    case 'task': {
      const t = TASK_BY_ID[ref.id] ?? getTasks(returnId).find((x) => x.id === ref.id);
      if (!t) return null;
      return { ...ref, label: t.title, href, sublabel: t.status === 'done' ? 'Done' : t.priority };
    }
    case 'insight': {
      const i = INSIGHT_BY_ID[ref.id] ?? getInsights(returnId).find((x) => x.id === ref.id);
      if (!i) return null;
      return { ...ref, label: i.title, href, sublabel: `${Math.round(i.confidence * 100)}% confidence` };
    }
  }
}

export function resolveRefs(refs: ObjectRef[], returnId = HERO_RETURN_ID): ResolvedRef[] {
  return refs.map((r) => resolveRef(r, returnId)).filter((r): r is ResolvedRef => r !== null);
}

/* ------------------------------------------------------------------ */
/* The inverted index                                                  */
/* ------------------------------------------------------------------ */

function key(ref: ObjectRef) {
  return `${ref.type}:${ref.id}`;
}

/**
 * Builds the bidirectional adjacency map once, lazily. Declared links are
 * added in both directions, plus the implicit edges that live on other
 * fields (a thread's anchor, an insight's target field and evidence).
 */
const ADJACENCY_BY_RETURN = new Map<string, Map<string, ObjectRef[]>>();

function buildAdjacency(returnId: string) {
  const map = new Map<string, ObjectRef[]>();

  const link = (a: ObjectRef, b: ObjectRef) => {
    if (key(a) === key(b)) return;
    for (const [from, to] of [
      [a, b],
      [b, a],
    ] as const) {
      const list = map.get(key(from)) ?? [];
      if (!list.some((r) => key(r) === key(to))) list.push(to);
      map.set(key(from), list);
    }
  };

  // Tasks declare their links explicitly.
  for (const task of getTasks(returnId)) {
    const self: ObjectRef = { type: 'task', id: task.id, label: task.title };
    for (const l of task.links) link(self, l);
  }

  // A thread is always about something.
  for (const thread of getThreads(returnId)) {
    const self: ObjectRef = { type: 'thread', id: thread.id, label: thread.subject };
    link(self, thread.anchor);
    for (const m of thread.messages) {
      for (const a of m.attachments ?? []) {
        link(self, { type: 'document', id: a.documentId, label: a.name });
      }
    }
  }

  // An insight points at the field it affects and the documents it read.
  for (const insight of getInsights(returnId)) {
    const self: ObjectRef = { type: 'insight', id: insight.id, label: insight.title };
    if (insight.targetFieldId) {
      link(self, { type: 'field', id: insight.targetFieldId });
    }
    for (const e of insight.evidence) {
      link(self, { type: 'document', id: e.documentId });
    }
  }

  // A field's provenance names its source documents, plus any document cited
  // by an individual step of the calculation.
  for (const field of getFields(returnId)) {
    const self: ObjectRef = { type: 'field', id: field.id, label: field.label };
    for (const s of field.provenance.sources) {
      link(self, { type: 'document', id: s.documentId });
    }
    for (const step of field.provenance.steps) {
      if (step.documentId) link(self, { type: 'document', id: step.documentId });
    }
  }

  return map;
}

export function relatedTo(ref: ObjectRef, returnId = HERO_RETURN_ID): ResolvedRef[] {
  let adjacency = ADJACENCY_BY_RETURN.get(returnId);
  if (!adjacency) {
    adjacency = buildAdjacency(returnId);
    ADJACENCY_BY_RETURN.set(returnId, adjacency);
  }
  const neighbours = adjacency.get(key(ref)) ?? [];
  return resolveRefs(neighbours, returnId);
}

/** Grouped for the rail, which sections by object type. */
export function relatedGrouped(ref: ObjectRef, returnId = HERO_RETURN_ID) {
  const all = relatedTo(ref, returnId);
  const groups = new Map<ObjectType, ResolvedRef[]>();
  for (const r of all) {
    const list = groups.get(r.type) ?? [];
    list.push(r);
    groups.set(r.type, list);
  }
  const order: ObjectType[] = ['field', 'document', 'insight', 'thread', 'task', 'return'];
  return order
    .filter((t) => groups.has(t))
    .map((t) => ({ type: t, label: TYPE_LABEL[t], items: groups.get(t)! }));
}
