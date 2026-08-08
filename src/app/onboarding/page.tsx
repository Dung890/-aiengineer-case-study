'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Leaf,
  Upload,
  MessageSquare,
  Phone,
  Check,
  ArrowRight,
  Lock,
  ShieldCheck,
  Clock,
  Sparkles,
} from 'lucide-react';
import type { Task, TaskKind } from '@/lib/types';
import { ONBOARDING_TASKS } from '@/lib/mock/tasks';
import { USER_BY_ID } from '@/lib/mock/users';
import { useDemo } from '@/lib/store';
import { cn, dueLabel } from '@/lib/utils';
import { Badge, Button, Card } from '@/components/ui/primitives';
import { Tooltip } from '@/components/ui/Tooltip';

/* ==================================================================
   Ch.03 — Where to start
   ------------------------------------------------------------------
   Target: a brand-new client knows their next action within 10 seconds.

   Four decisions get us there:

   1. NO NAVIGATION AT ALL. This screen sits outside the app shell. A
      first-time user with a sidebar has five things to evaluate before
      they can act; with no sidebar they have one. Navigation appears
      only once it has somewhere useful to go.

   2. EXACTLY ONE ACTION IS LIVE. Later steps are visible — so the
      shape of the commitment is honest — but locked, and each says
      *why* it is locked. Visible-but-deferred beats hidden: hidden
      complexity resurfaces as a nasty surprise.

   3. THE ASK IS ONE DOCUMENT. Not "upload your documents". One W-2 is
      a two-minute job, and finishing something is what produces the
      second visit.

   4. A NAMED HUMAN, IMMEDIATELY. This product's premise is a concierge
      relationship, so the concierge appears on screen one, not buried
      in a settings page.
   ================================================================== */

const KIND_ICON: Record<TaskKind, typeof Upload> = {
  upload: Upload,
  answer: MessageSquare,
  review: ShieldCheck,
  approve: ShieldCheck,
  verify: ShieldCheck,
  call: Phone,
};

export default function OnboardingPage() {
  const done = useDemo((s) => s.onboardingDone);
  const complete = useDemo((s) => s.completeOnboardingStep);
  const [justFinished, setJustFinished] = useState<string | null>(null);

  const concierge = USER_BY_ID['u-jordan']!;

  const tasks: Task[] = ONBOARDING_TASKS.map((t) => ({
    ...t,
    status: done.includes(t.id) || t.status === 'done' ? 'done' : t.status,
  }));

  const remaining = tasks.filter((t) => t.status !== 'done');
  const next = remaining.find((t) => t.status === 'open');
  const finishedCount = tasks.filter((t) => t.status === 'done').length;
  const allDone = finishedCount === tasks.length;

  return (
    <div className="min-h-screen bg-ink-100">
      {/* Header carries identity and nothing else — no nav to evaluate. */}
      <header className="border-b border-ink-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
          <span className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-brand-700 text-white">
              <Leaf className="size-4" />
            </span>
            <span className="text-sm font-semibold tracking-tight text-ink-900">Green Growth</span>
          </span>
          <span className="text-xs text-ink-500">2025 tax return</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8">
        {allDone ? (
          <CompleteState />
        ) : (
          <>
            {/* ---------- the single next action ---------- */}
            <p className="text-sm text-ink-500">Welcome, Priya.</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink-900">
              {next ? next.title : 'You’re all set'}
            </h1>
            {next?.detail ? (
              <p className="mt-2 text-sm leading-relaxed text-ink-600">{next.detail}</p>
            ) : null}

            {next ? (
              <Card className="mt-5 border-brand-300 p-5 ring-1 ring-brand-200">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-700 text-white">
                    {(() => {
                      const Icon = KIND_ICON[next.kind];
                      return <Icon className="size-5" />;
                    })()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink-900">
                      {next.kind === 'upload'
                        ? 'Drag it in, or take a photo — we’ll read it for you.'
                        : 'It takes about two minutes.'}
                    </p>
                    {next.dueDate ? (
                      <p className="mt-0.5 text-xs text-ink-500">{dueLabel(next.dueDate).text}</p>
                    ) : null}
                  </div>
                  <Button
                    variant="primary"
                    icon={next.kind === 'upload' ? Upload : ArrowRight}
                    onClick={() => {
                      complete(next.id);
                      setJustFinished(next.id);
                    }}
                  >
                    {next.kind === 'upload' ? 'Upload' : 'Start'}
                  </Button>
                </div>
              </Card>
            ) : null}

            {justFinished ? (
              <p className="mt-3 flex items-center gap-1.5 text-xs text-positive-700">
                <Check className="size-3.5" />
                Saved. Green Growth is reading it now — we’ll tell you if anything looks off.
              </p>
            ) : null}

            {/* ---------- progress + what's coming ---------- */}
            <div className="mt-8">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                  Getting set up
                </p>
                <p className="tabular text-[11px] text-ink-500">
                  {finishedCount} of {tasks.length}
                </p>
              </div>

              <div className="mb-4 flex gap-1">
                {tasks.map((t) => (
                  <span
                    key={t.id}
                    className={cn(
                      'h-1 flex-1 rounded-full',
                      t.status === 'done' ? 'bg-brand-600' : 'bg-ink-200',
                    )}
                  />
                ))}
              </div>

              <Card className="divide-y divide-ink-100 overflow-hidden">
                {tasks.map((t) => {
                  const Icon = KIND_ICON[t.kind];
                  const isNext = t.id === next?.id;
                  const isDone = t.status === 'done';
                  const isLocked = t.status === 'blocked';

                  return (
                    <div
                      key={t.id}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3',
                        isNext && 'bg-brand-50',
                        !isNext && !isDone && 'opacity-60',
                      )}
                    >
                      <span
                        className={cn(
                          'grid size-7 shrink-0 place-items-center rounded-lg',
                          isDone
                            ? 'bg-brand-600 text-white'
                            : isNext
                              ? 'bg-white text-brand-700 ring-1 ring-brand-300'
                              : 'bg-ink-100 text-ink-400',
                        )}
                      >
                        {isDone ? (
                          <Check className="size-3.5" />
                        ) : isLocked ? (
                          <Lock className="size-3.5" />
                        ) : (
                          <Icon className="size-3.5" />
                        )}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            'block text-sm',
                            isDone ? 'text-ink-500 line-through' : 'text-ink-800',
                          )}
                        >
                          {t.title}
                        </span>
                      </span>

                      {isNext ? (
                        <Badge tone="brand">Now</Badge>
                      ) : isLocked ? (
                        /* A locked step always explains itself. */
                        <Tooltip content="We’ll book this once your documents are in — there’s nothing useful to talk about before then.">
                          <span>
                            <Badge tone="neutral" icon={Clock}>
                              Later
                            </Badge>
                          </span>
                        </Tooltip>
                      ) : null}
                    </div>
                  );
                })}
              </Card>
            </div>
          </>
        )}

        {/* ---------- the human ---------- */}
        <Card className="mt-6 p-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ai-600 text-sm font-semibold text-white">
              {concierge.initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink-900">{concierge.name}</p>
              <p className="text-xs text-ink-500">
                Your tax concierge · usually replies within a few hours
              </p>
            </div>
            <Button variant="secondary" size="sm" icon={MessageSquare}>
              Message
            </Button>
          </div>
        </Card>

        <p className="mt-6 text-center text-[11px] leading-relaxed text-ink-400">
          Nothing is filed without your approval. You&apos;ll see every figure and where it came
          from before anything is sent to the IRS.
        </p>
      </main>
    </div>
  );
}

/**
 * The brief asks how the interface changes once onboarding is done. It stops
 * being a checklist and becomes the product — and we say so explicitly rather
 * than silently swapping the furniture underneath someone.
 */
function CompleteState() {
  return (
    <>
      <div className="flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-full bg-positive-100 text-positive-700">
          <Check className="size-4" />
        </span>
        <p className="text-sm font-medium text-positive-700">Setup complete</p>
      </div>

      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink-900">
        That’s everything we needed to start.
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-600">
        Jordan is preparing your return now. From here the checklist goes away — you get your
        return, your documents and your messages instead.
      </p>

      <Card className="mt-5 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
          What happens next
        </p>
        <ul className="mt-3 space-y-2.5">
          {[
            ['Green Growth reads your documents', 'Usually a few minutes.', Sparkles],
            ['Jordan reviews everything it found', 'You’ll get questions if anything is unclear.', ShieldCheck],
            ['You approve before we file', 'Nothing goes to the IRS until you say so.', Check],
          ].map(([title, body, Icon]) => {
            const I = Icon as typeof Check;
            return (
              <li key={title as string} className="flex gap-2.5">
                <I className="mt-0.5 size-4 shrink-0 text-ink-400" />
                <span>
                  <span className="block text-sm text-ink-800">{title as string}</span>
                  <span className="block text-xs text-ink-500">{body as string}</span>
                </span>
              </li>
            );
          })}
        </ul>

        <Link href="/returns/ret-priya-1040" className="mt-5 block">
          <Button variant="primary" className="w-full" icon={ArrowRight}>
            Go to my return
          </Button>
        </Link>
      </Card>
    </>
  );
}
