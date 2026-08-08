'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  ArrowRightLeft,
  Leaf,
  Check,
  Minus,
  UserRound,
  Building2,
  ChevronDown,
  Info,
} from 'lucide-react';
import { ROLES, ROLE_ORDER, CAPABILITY_CATALOG, can } from '@/lib/permissions';
import { useDemo } from '@/lib/store';
import { USER_BY_ID } from '@/lib/mock/users';
import type { Role } from '@/lib/types';
import { cn } from '@/lib/utils';

/* ==================================================================
   The home page (Ch.05) — two doors, plus a demo bypass
   ------------------------------------------------------------------
   Real tax platforms don't let you pick a role from a list of six.
   Roles come from HOW you arrive:

     · Clients self-serve or are invited. They start as an individual;
       "business owner" isn't a checkbox — it emerges when a business
       is added (which is exactly Marcus's story).
     · Staff never self-register. A firm administrator provisions them,
       and a reviewer is a preparer with a verified credential.

   So the front door asks one honest question — client, or firm? — and
   the two sides register differently. Underneath sits a demo tray that
   jumps straight to any hardcoded persona, because a reviewer of this
   prototype shouldn't have to fill a form to see the reviewer view.
   ================================================================== */

const ENTRY: Record<Role, { userId: string; href: string }> = {
  preparer: { userId: 'u-jordan', href: '/dashboard' },
  reviewer: { userId: 'u-lin', href: '/dashboard' },
  admin: { userId: 'u-dana', href: '/dashboard' },
  seasonal: { userId: 'u-sam', href: '/dashboard' },
  individual: { userId: 'u-priya', href: '/account' },
  business_owner: { userId: 'u-marcus', href: '/account' },
};

export default function Home() {
  const router = useRouter();
  const setRole = useDemo((s) => s.setRole);
  const [showMatrix, setShowMatrix] = useState(false);

  function enter(role: Role, over?: { userId: string; href: string }) {
    const dest = over ?? ENTRY[role];
    setRole(role, dest.userId);
    router.push(dest.href);
  }

  return (
    <main className="min-h-full bg-ink-50 px-6 py-12 sm:py-16">
      <div className="mx-auto w-full max-w-4xl">
        {/* Wordmark + honest framing */}
        <div className="flex items-center gap-2 text-ink-900">
          <span className="grid size-7 place-items-center rounded-lg bg-brand-700 text-white">
            <Leaf className="size-4" />
          </span>
          <span className="text-sm font-semibold tracking-tight">Green Growth</span>
          <span className="ml-1 rounded-full bg-ink-200 px-2 py-0.5 text-[11px] font-medium text-ink-600">
            Prototype
          </span>
        </div>

        <h1 className="mt-8 text-2xl font-semibold leading-tight tracking-tight text-ink-900 sm:text-3xl">
          Who are you here as?
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-600">
          The same platform serves clients and the firm that prepares their
          returns — so it greets each differently. This is a prototype with no
          real login; either door works, or skip to any role in the demo tray
          below.
        </p>

        {/* ---- Two doors ---- */}
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <ClientDoor onEnter={enter} />
          <FirmDoor onEnter={enter} />
        </div>

        {/* ---- Demo bypass ---- */}
        <DemoTray onEnter={enter} />

        {/* ---- Permissions, communicated (collapsible to keep this clean) ---- */}
        <div className="mt-10">
          <button
            onClick={() => setShowMatrix((v) => !v)}
            className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-500 transition hover:text-ink-800"
          >
            <ChevronDown className={cn('size-3.5 transition', showMatrix && 'rotate-180')} />
            Who can do what
          </button>
          {showMatrix ? (
            <div className="mt-3">
              <AccessMatrix />
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* Client door — self-serve: sign in, or create an account            */
/* ------------------------------------------------------------------ */

function ClientDoor({
  onEnter,
}: {
  onEnter: (role: Role, over?: { userId: string; href: string }) => void;
}) {
  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const register = mode === 'register';

  return (
    <div className="flex flex-col overflow-hidden rounded-card border border-ink-200 bg-white shadow-panel">
      <div className="flex items-start gap-3 border-b border-ink-200 p-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-600 text-white">
          <UserRound className="size-4" />
        </span>
        <div>
          <p className="text-sm font-semibold text-ink-900">I&apos;m a client</p>
          <p className="text-xs text-ink-500">Here to do my taxes</p>
        </div>
      </div>

      <div className="flex">
        {(['signin', 'register'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              'flex-1 border-b-2 px-3 py-2.5 text-xs font-medium transition',
              mode === m
                ? 'border-brand-700 text-ink-900'
                : 'border-transparent text-ink-500 hover:text-ink-800',
            )}
          >
            {m === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          // Demo: a new client lands in the first-run flow (Ch.03); a returning
          // client opens their return. Nothing is authenticated.
          if (register) onEnter('individual', { userId: 'u-priya', href: '/onboarding' });
          else onEnter('business_owner');
        }}
        className="flex flex-1 flex-col gap-3 p-4"
      >
        {register ? <Field label="Full name" type="text" placeholder="Marcus Delgado" /> : null}
        <Field label="Email" type="email" placeholder="you@example.com" />
        <Field label="Password" type="password" placeholder="••••••••" />

        <button
          type="submit"
          className="mt-auto flex w-full items-center justify-center gap-2 rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-800"
        >
          {register ? 'Create account' : 'Sign in'}
          <ArrowRight className="size-4" />
        </button>

        <p className="rounded-lg bg-ink-50 px-3 py-2 text-[11px] leading-relaxed text-ink-500">
          {register ? (
            <>
              <span className="font-medium text-ink-600">You start as an individual filer.</span>{' '}
              Add a business later and you become a <em>business owner</em> — it&apos;s never a
              checkbox. (Demo: opens onboarding, no account is created.)
            </>
          ) : (
            <>
              <span className="font-medium text-ink-600">Demo — no real login.</span> Signing in
              opens Marcus&apos;s account — profile, filings and documents — as a client who files
              personally and for his studio.
            </>
          )}
        </p>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Firm door — sign-in only; accounts are provisioned by an admin      */
/* ------------------------------------------------------------------ */

function FirmDoor({
  onEnter,
}: {
  onEnter: (role: Role, over?: { userId: string; href: string }) => void;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-card border border-ink-200 bg-white shadow-panel">
      <div className="flex items-start gap-3 border-b border-ink-200 p-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ai-600 text-white">
          <Building2 className="size-4" />
        </span>
        <div>
          <p className="text-sm font-semibold text-ink-900">I work at a firm</p>
          <p className="text-xs text-ink-500">Preparer, reviewer, admin or seasonal</p>
        </div>
      </div>

      {/* No register tab — the whole point: staff can't self-provision. */}
      <div className="border-b-2 border-brand-700 px-3 py-2.5 text-xs font-medium text-ink-900">
        Sign in
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onEnter('preparer'); // returning staff → their dashboard
        }}
        className="flex flex-1 flex-col gap-3 p-4"
      >
        <Field label="Work email" type="email" placeholder="you@greengrowth.com" />
        <Field label="Password" type="password" placeholder="••••••••" />

        <button
          type="submit"
          className="mt-auto flex w-full items-center justify-center gap-2 rounded-lg bg-ink-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-ink-800"
        >
          Sign in
          <ArrowRight className="size-4" />
        </button>

        <p className="flex items-start gap-1.5 rounded-lg bg-ink-50 px-3 py-2 text-[11px] leading-relaxed text-ink-500">
          <Info className="mt-0.5 size-3 shrink-0 text-ink-400" />
          <span>
            <span className="font-medium text-ink-600">No public sign-up.</span> Staff accounts are
            created by the firm administrator, and reviewer powers require a verified CPA/EA
            credential — your role rides on your account, you don&apos;t pick it.
          </span>
        </p>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Demo bypass — jump straight to any hardcoded persona                */
/* ------------------------------------------------------------------ */

function DemoTray({
  onEnter,
}: {
  onEnter: (role: Role, over?: { userId: string; href: string }) => void;
}) {
  return (
    <div className="mt-4 rounded-card border border-dashed border-ink-300 bg-white/60 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
        Demo — skip the forms, enter as
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {ROLE_ORDER.map((role) => {
          const p = ROLES[role];
          const Icon = p.icon;
          return (
            <button
              key={role}
              onClick={() => onEnter(role)}
              className="group inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white py-1.5 pl-1.5 pr-3 text-xs font-medium text-ink-700 shadow-panel transition hover:border-ink-300 hover:shadow-pop"
              title={p.blurb}
            >
              <span className={cn('grid size-6 place-items-center rounded-full text-white', p.accent)}>
                <Icon className="size-3.5" />
              </span>
              {p.label}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-ink-100 pt-3">
        <span className="inline-flex items-center gap-1 text-[11px] text-ink-500">
          <ArrowRightLeft className="size-3 text-ink-400" />
          One person, both hats:
        </span>
        <button
          onClick={() => onEnter('preparer', { userId: 'u-rosa', href: '/dashboard' })}
          className="inline-flex items-center gap-1.5 rounded-full bg-ink-100 px-3 py-1 text-[11px] font-medium text-ink-700 transition hover:bg-ink-200"
        >
          Rosa — staff
        </button>
        <button
          onClick={() => onEnter('individual', { userId: 'u-rosa', href: '/returns/ret-rosa-1040' })}
          className="inline-flex items-center gap-1.5 rounded-full bg-ink-100 px-3 py-1 text-[11px] font-medium text-ink-700 transition hover:bg-ink-200"
        >
          Rosa — her own return
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Field({
  label,
  type,
  placeholder,
}: {
  label: string;
  type: string;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink-600">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        className="h-9 w-full rounded-lg border border-ink-300 bg-white px-3 text-sm outline-none placeholder:text-ink-400 focus:border-brand-600"
      />
    </label>
  );
}

/** Ch.05 — permissions, communicated. Roles across the top, capabilities down
 *  the side; a check means "can", a dash means "cannot". */
function AccessMatrix() {
  return (
    <div className="overflow-x-auto rounded-card border border-ink-200 bg-white shadow-panel">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-ink-200">
            <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Capability</th>
            {ROLE_ORDER.map((role) => {
              const Icon = ROLES[role].icon;
              return (
                <th key={role} className="px-2 py-3 text-center">
                  <span className="flex flex-col items-center gap-1">
                    <span
                      className={cn(
                        'grid size-6 place-items-center rounded-full text-white',
                        ROLES[role].accent,
                      )}
                    >
                      <Icon className="size-3.5" />
                    </span>
                    <span className="text-[10px] font-medium leading-tight text-ink-600">
                      {ROLES[role].label}
                    </span>
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {CAPABILITY_CATALOG.map(({ capability, label }) => (
            <tr key={capability} className="border-b border-ink-100 last:border-0">
              <td className="px-4 py-2.5 text-xs text-ink-700">{label}</td>
              {ROLE_ORDER.map((role) => (
                <td key={role} className="px-2 py-2.5 text-center">
                  {can(role, capability) ? (
                    <Check className="mx-auto size-4 text-brand-700" />
                  ) : (
                    <Minus className="mx-auto size-4 text-ink-300" />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
