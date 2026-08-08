import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* ------------------------------------------------------------------ */
/* Money                                                               */
/* ------------------------------------------------------------------ */

/**
 * Whole-dollar formatting. Tax returns round to the dollar, and dropping
 * the cents removes a lot of visual noise from dense figure columns.
 */
export function money(value: number, opts: { sign?: boolean; cents?: boolean } = {}) {
  const { sign = false, cents = false } = opts;
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  }).format(Math.abs(value));
  if (value < 0) return `(${formatted})`;
  return sign ? `+${formatted}` : formatted;
}

/** Compact form for dashboard tiles where space is tight. */
export function moneyCompact(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${Math.round(value / 1_000)}k`;
  return money(value);
}

/* ------------------------------------------------------------------ */
/* Dates                                                               */
/* ------------------------------------------------------------------ */

/**
 * The prototype is deterministic: every relative date is measured from this
 * fixed "today" so screenshots, the demo video and the hosted build always
 * tell the same story.
 */
export const TODAY = new Date('2026-03-12T09:00:00Z');

export function daysUntil(iso: string) {
  const then = new Date(iso).getTime();
  return Math.round((then - TODAY.getTime()) / 86_400_000);
}

export function formatDate(iso: string, style: 'short' | 'long' = 'short') {
  const d = new Date(iso);
  // Always format in UTC. Dates in the dataset are stored as midnight UTC, so
  // formatting in the viewer's local zone renders "Apr 14" for a 15 April
  // deadline anywhere west of Greenwich — a bug that makes a tax product look
  // untrustworthy in exactly the place it can least afford to.
  return d.toLocaleDateString('en-US', {
    timeZone: 'UTC',
    month: style === 'long' ? 'long' : 'short',
    day: 'numeric',
    year: d.getUTCFullYear() === TODAY.getUTCFullYear() ? undefined : 'numeric',
  });
}

/** "3 days ago" / "in 2 weeks" — always relative to the frozen TODAY. */
export function relativeTime(iso: string) {
  const diffMs = new Date(iso).getTime() - TODAY.getTime();
  const diffDays = Math.round(diffMs / 86_400_000);
  const abs = Math.abs(diffDays);

  if (abs === 0) {
    const diffHours = Math.round(diffMs / 3_600_000);
    if (Math.abs(diffHours) < 1) return 'just now';
    return diffHours < 0 ? `${Math.abs(diffHours)}h ago` : `in ${diffHours}h`;
  }
  if (abs === 1) return diffDays < 0 ? 'yesterday' : 'tomorrow';
  if (abs < 7) return diffDays < 0 ? `${abs} days ago` : `in ${abs} days`;
  if (abs < 30) {
    const w = Math.round(abs / 7);
    return diffDays < 0 ? `${w}w ago` : `in ${w}w`;
  }
  const m = Math.round(abs / 30);
  return diffDays < 0 ? `${m}mo ago` : `in ${m}mo`;
}

/** Deadline phrasing that leads with urgency rather than a bare date. */
export function dueLabel(iso: string) {
  const d = daysUntil(iso);
  if (d < 0) return { text: `${Math.abs(d)} days overdue`, tone: 'danger' as const };
  if (d === 0) return { text: 'Due today', tone: 'danger' as const };
  if (d === 1) return { text: 'Due tomorrow', tone: 'caution' as const };
  if (d <= 7) return { text: `Due in ${d} days`, tone: 'caution' as const };
  return { text: `Due ${formatDate(iso)}`, tone: 'neutral' as const };
}

/* ------------------------------------------------------------------ */
/* Misc                                                                */
/* ------------------------------------------------------------------ */

export function pluralize(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

export function initialsOf(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
}
