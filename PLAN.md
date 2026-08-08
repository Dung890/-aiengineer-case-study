# Green Growth — AI Tax Platform Prototype: Build Plan

> Case study: "AI Engineer — Designing an AI-Powered Tax Platform From Scratch"
> Scope: **All 10 challenges**, quality-first.
> Strategy: **One coherent product**, not 10 separate demos. Every challenge is a
> screen or interaction *inside* a single fake tax return's lifecycle.

---

## 1. The core idea: one product, one story

The 10 challenges are really 10 facets of a single workflow — the exact workflow
the **AI Tax Concierge** role describes:

> Interview client → gather docs & resolve inconsistencies → run AI → review AI's
> explanations & confidence → present in plain English → flag escalations → maintain
> the relationship.

We build **one product ("Green Growth")** with **one shared fake dataset**, and each
challenge becomes a moment in that product. Judges click through a believable app,
not a slideshow of unrelated screens.

**The demo spine (what the walkthrough video follows):**
1. A brand-new client logs in → **Ch.03 Where to Start**
2. They upload docs & get asked questions → **Ch.02 Collaboration**, **Ch.09 Complexity**
3. AI extracts values with confidence → **Ch.10 Trustworthy AI**, **Ch.08 Affordances**
4. CPA opens the return, traces a number to its source → **Ch.01 Traceability**
5. CPA works their queue, sees what's urgent → **Ch.07 Dashboard**
6. Everyone reads the same status → **Ch.06 Status**
7. Moving between docs/tasks/messages never loses place → **Ch.04 Navigation**
8. Same shell adapts to each role → **Ch.05 Role-Aware**

---

## 2. Tech stack (quality-first)

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | Real routing = deep-linking & context (Ch.04) for free; great DX; hosts on Vercel in minutes |
| Styling | **Tailwind CSS** | Fast, consistent design system; enforces the affordance language (Ch.08) |
| Components | **shadcn/ui** (Radix under the hood) | Accessible, polished primitives (dialogs, tabs, tooltips, command palette) without reinventing them |
| Motion | **Framer Motion** | Small touches (panel transitions, confidence reveals) that make it *feel* real |
| Icons | **lucide-react** | Clean, consistent icon set |
| State | **React state + Zustand** (light) | Role switching, "current return" context, unsaved edits |
| Data | **A single `/lib/mock/` module** | All fake data + a fake "AI" stub function. No backend. |
| Hosting | **Vercel** | Free, instant, gives you the hosted link the submission requires |

Rationale for going heavier: you asked not to compromise on quality. Next.js gives
real URLs/navigation (critical for Ch.04 & Ch.05), and shadcn/ui gets you to a
professional look fast so your time goes into *interaction design*, which is what's graded.

---

## 3. The mock data foundation (build this FIRST)

Everything hangs off one well-designed fake dataset. This is the highest-leverage
work — get it right and all 10 challenges become "just" views over it.

Core entities (all hardcoded in `/lib/mock/`):

- **Users / Roles** — individual taxpayer, business owner, preparer, reviewer, firm
  admin, seasonal staff. Include one user who is *both* a firm employee and has a
  personal return (Ch.05 edge case).
- **Returns** — ~8–12 returns at different stages/statuses (Ch.06, Ch.07). One is our
  "hero" return, richly detailed.
- **Documents** — hundreds of mock docs for the hero return (Ch.09 scale). Each has
  pages/sections so a value can point to an exact location (Ch.01).
- **Return fields** — each field carries: value, source doc + page, transformation/
  calc applied, and a **state**: `ai-generated | verified | locked | editable | needs-approval` (Ch.08).
- **AI outputs** — a stub `runAI(field)` returning fake `{ value, confidence, reasoning,
  evidence[], uncertainty, suggestedAction }` (Ch.10).
- **Threads / messages** — a few threads tied to specific docs/fields, tagged
  `internal` vs `client-visible`, with an owner-of-next-action (Ch.02).
- **Tasks / requests** — outstanding items with owner, urgency, due date (Ch.02, Ch.07).
- **Relationships** — doc ↔ field ↔ task ↔ message links, hardcoded (Ch.04).

---

## 4. App architecture

```
/app
  /(shell)                 # shared layout: global nav, role switcher, breadcrumbs
    /dashboard             # Ch.07 CPA dashboard
    /onboarding            # Ch.03 first-run client experience
    /returns/[id]          # the hero return
      /review              # Ch.01 traceability (side-by-side field ↔ document)
      /documents           # Ch.09 complexity: search/filter/hierarchy over 100s of docs
      /messages            # Ch.02 collaboration
      /status              # Ch.06 status & progress
  /lib/mock                # all fake data + runAI() stub
  /components
    /affordances           # Ch.08 the state-badge / editable-field system
    /ai                    # Ch.10 confidence chips, explanation panels, correction flow
    /nav                   # Ch.04 breadcrumbs, "related objects" rail, back-to-workflow
    /role                  # Ch.05 role switcher, permission hints
```

**Cross-cutting systems (build once, reuse everywhere):**
- **Affordance system (Ch.08):** a `<Field>` component whose look is driven by its
  `state`. Editable = subtle underline/hover; AI-generated = purple chip; verified =
  check; locked = lock icon + reason on hover; needs-approval = amber. Used on *every*
  screen so it proves itself across contexts.
- **AI trust system (Ch.10):** a reusable confidence chip + expandable "Why?" panel
  (what it did, evidence, uncertainty, suggested action, and an inline **correct-it**
  control that doesn't yank you out of the page).
- **Navigation/context system (Ch.04):** breadcrumbs + a persistent "Related" rail
  showing linked doc/task/message, + deep links (real URLs) + "return to where you were."
- **Role system (Ch.05):** a top-bar switcher (Preparer / Client minimum) that reshapes
  nav and permissions from the *same* shell.

---

## 5. Challenge-by-challenge coverage checklist

| # | Challenge | Where it lives | "Done" means |
|---|---|---|---|
| 01 | Source Traceability | `/returns/[id]/review` | Click a field → doc opens to exact page, shows transformation |
| 02 | Collaboration | `/returns/[id]/messages` | Threads tied to docs/fields; internal vs client-visible; next-action owner; outstanding requests |
| 03 | Where to Start | `/onboarding` | New client knows next action in <10s; progress + urgency clear; UI changes after onboarding |
| 04 | Navigation | shell + "Related" rail | Move across doc/task/question/message without losing place; breadcrumbs; deep links |
| 05 | Role-Aware | role switcher | Nav/permissions change by role; multi-role context switch; employee-with-personal-return case |
| 06 | Status & Progress | `/returns/[id]/status` | Same status reads the same for client & staff; what's done/next/blocking/owner; less detail for client |
| 07 | Dashboard | `/dashboard` | Ranked "work on this now"; manager vs preparer; usable at hundreds of returns |
| 08 | Clickable vs Editable | `/components/affordances`, everywhere | Consistent visual language across ≥3 screens for each data state |
| 09 | Complexity | `/returns/[id]/documents` | Progressive disclosure, search/filter/hierarchy over hundreds of items; summary↔detail |
| 10 | Trustworthy AI | `/components/ai`, review screen | What/why/evidence/uncertainty/action + correction flow; not overwhelming |

---

## 6. Build phases (suggested order)

**Phase 0 — Foundation (do not skip):**
- Scaffold Next.js + Tailwind + shadcn/ui, deploy an empty app to Vercel Day 1 so
  hosting is never a last-minute problem.
- Build the mock dataset (`/lib/mock`) and the `runAI()` stub.

**Phase 1 — The two systems that touch everything:**
- Affordance `<Field>` system (Ch.08).
- AI trust components (Ch.10).

**Phase 2 — The hero return screens:**
- Review / traceability (Ch.01) — the most impressive single screen; invest here.
- Documents at scale (Ch.09).
- Status (Ch.06).

**Phase 3 — Surrounding workflow:**
- Dashboard (Ch.07).
- Messages/collaboration (Ch.02).
- Onboarding (Ch.03).

**Phase 4 — Connective tissue:**
- Navigation/context + Related rail + breadcrumbs (Ch.04).
- Role switcher (Ch.05).

**Phase 5 — Polish + submission:**
- Wire edge cases (blocked return, low-confidence AI value, locked field, multi-role user).
- Record the walkthrough video following the demo spine (§1).
- Write the README (what's real vs simulated).

Rule of thumb: **breadth of a believable click-path beats depth on one screen.** Get
all 10 visibly present, then deepen the hero screens (01 + 10).

---

## 7. What's real vs simulated (for the README)

**Real:** the entire frontend, navigation, routing/deep-links, role switching, the
affordance & AI-trust interaction systems, search/filter/sort logic, prioritization
ranking, and all state transitions in the UI.

**Simulated:** document OCR/parsing (docs & extracted values are hardcoded), the AI
itself (`runAI()` returns fabricated confidence/reasoning JSON), auth (role switch is
a dropdown, no real login), and any persistence (in-memory only).

---

## 8. Submission checklist

- [ ] Hosted, clickable prototype link (Vercel) covering all 10.
- [ ] Video walkthrough narrating what you built, the decisions, and how it works —
      follow the demo spine in §1.
- [ ] README: what's wired up vs simulated + a few defensible design-decision notes.
- [ ] At least one edge case wired per challenge (not just happy path).
