'use client';

import * as Popover from '@radix-ui/react-popover';
import { ShieldCheck, Check, Lock } from 'lucide-react';
import { ROLES, accessSummary } from '@/lib/permissions';
import { useDemo } from '@/lib/store';
import { cn } from '@/lib/utils';

/* ==================================================================
   Ch.05 — permissions, communicated (in-app)
   ------------------------------------------------------------------
   The home-page matrix answers "who can do what" across all six roles.
   This answers the same question from *inside* a role: as the person
   you currently are, here is what you can do and — crucially — what you
   can't, each "can't" carrying the very reason a disabled control would
   show. A permission you can see but not use teaches you how the firm
   works; a hidden one teaches nothing.
   ================================================================== */

export function AccessPanel({ collapsed = false }: { collapsed?: boolean }) {
  const role = useDemo((s) => s.activeRole);
  const lines = accessSummary(role);
  const canDo = lines.filter((l) => l.granted);
  const cannot = lines.filter((l) => !l.granted);

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          className={cn(
            'flex w-full items-center gap-2 rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-left text-[11px] font-medium text-ink-600 transition hover:border-ink-300 hover:bg-ink-50',
          )}
        >
          <ShieldCheck className="size-3.5 shrink-0 text-ink-400" />
          {!collapsed ? (
            <span className="flex-1 truncate">
              Your access · {canDo.length}/{lines.length}
            </span>
          ) : null}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          side="top"
          align="start"
          sideOffset={8}
          className="z-50 w-80 rounded-xl border border-ink-200 bg-white p-3 shadow-pop"
        >
          <p className="text-[11px] leading-relaxed text-ink-500">
            As <span className="font-semibold text-ink-800">{ROLES[role].label}</span>, here is what
            you can and can’t do. Every restriction says why.
          </p>

          <div className="mt-3 space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">Can</p>
            {canDo.map((l) => (
              <div key={l.capability} className="flex items-center gap-2">
                <Check className="size-3.5 shrink-0 text-brand-700" />
                <span className="text-xs text-ink-800">{l.label}</span>
              </div>
            ))}
          </div>

          {cannot.length ? (
            <div className="mt-3 space-y-2 border-t border-ink-100 pt-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">
                Can’t
              </p>
              {cannot.map((l) => (
                <div key={l.capability} className="flex items-start gap-2">
                  <Lock className="mt-0.5 size-3.5 shrink-0 text-ink-300" />
                  <span className="min-w-0">
                    <span className="block text-xs text-ink-500">{l.label}</span>
                    <span className="block text-[11px] leading-snug text-ink-400">{l.reason}</span>
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
