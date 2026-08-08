# Green Growth — AI Tax Platform

A working prototype of a tax platform for clients and CPAs, built from scratch for the
AI Engineer case study. It covers all ten challenges as **one product** rather than ten
separate demos.

**Stack:** Next.js 16 · React 19 · TypeScript · Tailwind v4 · Radix · Zustand
**Run it:** `npm install && npm run dev` → http://localhost:3000

---

## Start here — the two-minute tour

The demo follows one client (Marcus Delgado, a designer who went freelance mid-year)
through a single return. Use the **role switcher at the bottom-left** to change who you are.

1. **`/dashboard`** — you are Jordan, a tax concierge. The queue answers "what should I
   work on now?" Hover any row's score to see *why* it ranks there.
2. **`/returns/ret-marcus-1040/review`** — the hero screen. Click any figure to trace it
   back to the exact box on the source document. Open **Gross receipts** (pre-selected):
   the AI caught that a payer filed a *corrected* 1099 and the two aren't additive.
3. **AI findings tab** — expand "Why does it think this?" on any finding. Note the K-1
   one, where the model reports 58% confidence and says what it's unsure about.
4. **Switch role → Individual client** — the same product becomes a client experience.
   Internal notes vanish, navigation shrinks, jargon becomes plain English.
5. **Switch role → Rosa (her own return)** — a staff member who is also a client. One
   identity, two contexts.

---

## What's genuinely wired up vs. simulated

### Real — actually runs

- **The entire frontend**: layout, navigation, routing, all interaction and state.
- **The affordance system** (Ch.08). One `DataState` per value drives its appearance and
  what you can do to it, from a single table in `src/lib/design.ts`, on every screen.
- **The return recalculates.** Edit gross receipts or accept an AI suggestion and total
  income, SE tax, AGI, taxable income, tax and the balance due all recompute
  (`recompute()` in `src/lib/store.ts`). The numbers foot.
- **Prioritisation logic** (Ch.07). A real weighted scoring function in
  `src/lib/ranking.ts`, with the reasons surfaced in the UI.
- **Search, filtering and faceting** over 328 documents (Ch.09) — real filtering, real counts.
- **The object graph** (Ch.04). Links are declared once and inverted at read time in
  `src/lib/graph.ts`; every "Connected to this" rail reads from it.
- **Permissions** (Ch.05). `can(role, capability)` gates controls, and every denial has a
  written reason attached (`denialReason()`), shown on hover.
- **The internal/external wall** (Ch.02) is enforced in the data layer (`visibleThreads`),
  not per-component, so a client view cannot render an internal note.
- **Correction workflows** (Ch.10). Accepting, correcting, dismissing and escalating all
  mutate state and can be undone.
- **Deep links.** The review screen and document library encode their state in the URL.

### Simulated — fabricated, as the brief invites

- **The AI.** No model runs. Every confidence score, reasoning chain, piece of evidence
  and uncertainty note is hand-written in `src/lib/mock/insights.ts`.
- **Document parsing / OCR.** No extraction happens. Documents are *rendered from data*
  rather than scanned — each form's boxes and the traceability highlights come from the
  same `DocumentRegion[]`, which is why highlights align exactly.
- **Auth.** The role switcher is a dropdown. No login, no sessions.
- **Persistence.** All state is in memory. There's a **Reset** control in the sidebar.
- **Volume.** ~320 of the 328 documents and 140 of the 143 returns are generated from a
  seeded RNG (`src/lib/mock/rng.ts`) so the dataset is identical on every load. Only the
  8 hero documents are modelled in full detail.
- **Every other return synthesises its own content** (`src/lib/mock/derive.ts`) — documents,
  figures, tasks, threads and findings, seeded from the return id. So clicking any client
  in the queue gives you a populated app, not an empty shell. That content is shallower
  than Marcus's by design: no box-level provenance and no hand-written AI reasoning. Its
  figures are computed once at build time and are internally consistent, but unlike the
  hero return they do **not** cascade when edited — the live recalculation engine is wired
  to the hero return's line ids.
- **"Today" is frozen** at 12 March 2026 (`TODAY` in `src/lib/utils.ts`) so every relative
  date and deadline tells the same story permanently.

---

## Decisions worth explaining

**One product, not ten demos.** The challenges are facets of a single workflow — the one
the AI Tax Concierge role describes: gather facts → run the AI → review its explanations →
present in plain English → escalate what needs a credential. Building them as one app is
the only way the cross-cutting challenges (affordances, navigation, roles) can actually be
demonstrated, because those only exist *across* screens.

**Colour means "look at me."** Resolved states — verified, editable — are deliberately
quiet. Only unresolved things (low confidence, discrepancies, approvals) get saturated
colour. A dense tax UI where everything is coloured is a UI where nothing is.

**Clickable and editable are different questions** (Ch.08). *Every* value can be clicked to
see where it came from; only some can be edited. So they get different signals: inspecting
tints the value, editing summons a bordered input well with a pencil. Non-editable values
never show a well, and locked ones always name their specific reason.

**Status is one ladder with two vocabularies** (Ch.06). Client and staff see different
words for the same position, plus an identical `meaning` sentence on hover. Crucially,
"who acts next" is tracked *separately* from the stage — conflating them is why legacy
status fields lie.

**A return you're waiting on is not work** (Ch.07). The dashboard splits *before* it ranks:
things you can act on, versus things to chase. Ranking everything in one list by deadline
is exactly why staff fall back to a spreadsheet.

**Uncertainty gets its own block** (Ch.10). Not a footnote — a bordered amber panel sitting
directly above the action buttons, so it's read at the moment of deciding. And the
explanation is collapsed by default: "transparency without overload" means always one
click away, never in the way.

**A superseded source stays in the audit trail.** The excluded original 1099 is still
listed, with a zero contribution, because hiding it is how a reviewer rediscovers the same
problem next year.

**The concierge escalates rather than decides.** The QBI finding is flagged
`requiresCredentialedReviewer`, and its non-escalate actions are disabled for a preparer
with the reason attached. That mirrors the actual role: expertise in fact discovery and
knowing when a credential is needed.

---

## Known gaps

- **Light theme only.** Deliberate — professional tax software is used in bright offices
  and printed constantly. Doing one theme well beat doing two adequately.
- **Desktop-first.** The split-pane review screen assumes a wide viewport; it is not
  designed for mobile.
- Marcus is the only return with box-level traceability. Other returns are fully populated
  but their figures cite documents by name rather than by coordinates on the page.
- `useSearchParams` is replaced by a small `useUrlState` hook (`src/lib/useUrlState.ts`) —
  the Next hook suspends on non-prerendered dynamic routes and parked the review screen
  behind a fallback. The hook keeps the properties that matter: the URL describes the view,
  and loading that URL restores it.

---

## Where things live

```
src/lib/
  types.ts        domain model
  design.ts       Ch.08 — the affordance table (the design system)
  stages.ts       Ch.06 — the status ladder
  permissions.ts  Ch.05 — roles, capabilities, denial reasons
  ranking.ts      Ch.07 — prioritisation scoring
  graph.ts        Ch.04 — the object graph and link resolution
  store.ts        live demo state + the recalculation engine
  mock/           the whole "backend"
src/components/
  affordance/     Ch.08 — FieldValue, the state-driven value component
  ai/             Ch.10 — confidence chips, insight cards, corrections
  document/       Ch.01 — form facsimiles rendered from region data
  shell/          Ch.04/05 — nav, role switcher, breadcrumbs, related rail
```
