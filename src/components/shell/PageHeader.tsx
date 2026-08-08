'use client';

import Link from 'next/link';
import { ChevronRight, Undo2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useDemo } from '@/lib/store';
import { cn } from '@/lib/utils';

export interface Crumb {
  label: string;
  href?: string;
}

/**
 * Ch.04 — orientation.
 *
 * Two distinct things live here and they are often confused:
 *
 *   · BREADCRUMBS answer "where am I in the structure" — they are the
 *     hierarchy, and they never change based on how you arrived.
 *   · RETURN-TO-WORKFLOW answers "how do I get back to what I was
 *     doing" — that IS path-dependent, so it is a separate control with
 *     a different shape, sitting apart from the crumbs.
 *
 * Collapsing the two into one back button is the usual mistake, and
 * it's why "back" so often lands somewhere unexpected.
 */
export function PageHeader({
  crumbs,
  title,
  subtitle,
  actions,
  tabs,
  dense = false,
}: {
  crumbs?: Crumb[];
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  tabs?: ReactNode;
  dense?: boolean;
}) {
  const lastWorkflow = useDemo((s) => s.lastWorkflow);
  const setLastWorkflow = useDemo((s) => s.setLastWorkflow);

  return (
    <header className="shrink-0 border-b border-ink-200 bg-white">
      <div className={cn('px-6', dense ? 'pt-3' : 'pt-4')}>
        {crumbs?.length ? (
          <nav aria-label="Breadcrumb" className="mb-1.5 flex items-center gap-1 text-xs">
            {crumbs.map((c, i) => (
              <span key={`${c.label}-${i}`} className="flex items-center gap-1">
                {i > 0 ? <ChevronRight className="size-3 text-ink-300" /> : null}
                {c.href ? (
                  <Link href={c.href} className="text-ink-500 transition hover:text-ink-800">
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-ink-700">{c.label}</span>
                )}
              </span>
            ))}
          </nav>
        ) : null}

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-tight text-ink-900">{title}</h1>
            {subtitle ? <p className="mt-0.5 text-sm text-ink-500">{subtitle}</p> : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {lastWorkflow ? (
              <Link
                href={lastWorkflow.href}
                onClick={() => setLastWorkflow(null)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-ink-300 bg-white px-2.5 py-1.5 text-xs text-ink-600 transition hover:bg-ink-50 hover:text-ink-900"
              >
                <Undo2 className="size-3.5" />
                Back to {lastWorkflow.label}
              </Link>
            ) : null}
            {actions}
          </div>
        </div>
      </div>

      {tabs ? <div className="px-6">{tabs}</div> : <div className={dense ? 'h-3' : 'h-4'} />}
    </header>
  );
}
