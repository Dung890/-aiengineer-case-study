'use client';

import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TONE_CHIP, TONE_DOT, type Tone } from '@/lib/design';

/* ------------------------------------------------------------------ */
/* Card                                                                */
/* ------------------------------------------------------------------ */

export function Card({
  className,
  children,
  ...rest
}: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'rounded-card border border-ink-200 bg-white shadow-panel',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4 border-b border-ink-200 px-5 py-4',
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-ink-900">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-xs text-ink-500">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Badge                                                               */
/* ------------------------------------------------------------------ */

export function Badge({
  tone = 'neutral',
  dot = false,
  icon: Icon,
  children,
  className,
}: {
  tone?: Tone;
  dot?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium leading-5 whitespace-nowrap',
        TONE_CHIP[tone],
        className,
      )}
    >
      {dot ? <span className={cn('size-1.5 rounded-full', TONE_DOT[tone])} /> : null}
      {Icon ? <Icon className="size-3" /> : null}
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Button                                                              */
/* ------------------------------------------------------------------ */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'ai';
type ButtonSize = 'sm' | 'md';

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-700 text-white hover:bg-brand-800 active:bg-brand-900 disabled:bg-ink-300 disabled:text-ink-500',
  secondary:
    'bg-white text-ink-800 ring-1 ring-ink-300 hover:bg-ink-50 active:bg-ink-100 disabled:text-ink-400 disabled:ring-ink-200',
  ghost:
    'text-ink-600 hover:bg-ink-100 hover:text-ink-900 active:bg-ink-200 disabled:text-ink-400',
  danger:
    'bg-danger-600 text-white hover:bg-danger-700 active:bg-danger-800 disabled:bg-ink-300',
  ai: 'bg-ai-600 text-white hover:bg-ai-700 active:bg-ai-800 disabled:bg-ink-300',
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'h-7 px-2.5 text-xs gap-1.5 rounded-md',
  md: 'h-9 px-3.5 text-sm gap-2 rounded-lg',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  className,
  children,
  ...rest
}: ComponentProps<'button'> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium transition-colors',
        'disabled:cursor-not-allowed',
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        className,
      )}
      {...rest}
    >
      {Icon ? <Icon className={size === 'sm' ? 'size-3.5' : 'size-4'} /> : null}
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Layout helpers                                                      */
/* ------------------------------------------------------------------ */

export function SectionLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'text-[11px] font-semibold uppercase tracking-wider text-ink-500',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Avatar({
  initials,
  className,
  tone = 'bg-brand-700',
}: {
  initials: string;
  className?: string;
  tone?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white',
        tone,
        className,
      )}
    >
      {initials}
    </span>
  );
}

/** Empty states matter at volume — a filtered list that returns nothing
 *  should say what to do next, not just sit there blank. */
export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      {Icon ? (
        <span className="mb-3 inline-flex size-10 items-center justify-center rounded-full bg-ink-100 text-ink-400">
          <Icon className="size-5" />
        </span>
      ) : null}
      <p className="text-sm font-medium text-ink-800">{title}</p>
      {body ? <p className="mt-1 max-w-sm text-xs text-ink-500">{body}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

/** A horizontal meter used for confidence and progress. */
export function Meter({
  value,
  className,
  barClassName,
}: {
  value: number; // 0–1
  className?: string;
  barClassName?: string;
}) {
  return (
    <span
      className={cn('block h-1.5 w-full overflow-hidden rounded-full bg-ink-200', className)}
    >
      <span
        className={cn('block h-full rounded-full transition-all', barClassName)}
        style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }}
      />
    </span>
  );
}
