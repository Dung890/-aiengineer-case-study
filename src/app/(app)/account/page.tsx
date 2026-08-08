'use client';

import Link from 'next/link';
import {
  Upload,
  FileText,
  MessageSquare,
  ArrowRight,
  Mail,
  Phone,
  MapPin,
  UserRound,
  Building2,
  Calendar,
  ShieldCheck,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import { USER_BY_ID, getClientReturns } from '@/lib/mock';
import { STAGES } from '@/lib/stages';
import { cn } from '@/lib/utils';
import { Avatar, Badge, Button, Card, SectionLabel } from '@/components/ui/primitives';
import { PageHeader } from '@/components/shell/PageHeader';

/* ==================================================================
   The client home — profile first, then the two things a client does
   ------------------------------------------------------------------
   A returning client lands here, not inside a return. It answers "who
   am I to the firm, and what can I do next" before dropping them into
   the machinery: their details, their filings, and the two verbs that
   matter — upload a document, or open their return.
   ================================================================== */

export default function AccountPage() {
  const userId = useDemo((s) => s.activeUserId);
  const user = USER_BY_ID[userId];
  const returns = getClientReturns(userId);
  const primary = returns[0];
  const concierge = USER_BY_ID['u-jordan']!;

  const isBusiness = returns.some((r) => r.formType !== '1040');

  if (!user) {
    return <PageHeader title="Account" subtitle="No profile for this user." />;
  }

  return (
    <>
      <PageHeader title="Your account" subtitle="Profile, filings and documents" />

      <div className="scrollbar-slim flex-1 overflow-y-auto px-6 pb-10">
        <div className="mx-auto max-w-3xl space-y-6 pt-4">
          {/* ---------- profile + details ---------- */}
          <Card className="p-5">
            <div className="flex items-center gap-4">
              <Avatar initials={user.initials} tone="bg-brand-700" className="size-14 text-base" />
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-ink-900">{user.name}</h2>
                <p className="text-sm text-ink-500">
                  {isBusiness
                    ? 'Business owner · files personally and for an entity'
                    : 'Individual filer'}
                </p>
              </div>
              <Badge tone="neutral">Client since 2023</Badge>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3.5 border-t border-ink-100 pt-4 sm:grid-cols-3">
              <Detail icon={Mail} label="Email" value={user.email} />
              <Detail icon={Phone} label="Phone" value="(415) 555-0148" />
              <Detail icon={MapPin} label="Address" value="San Francisco, CA" />
              <Detail icon={UserRound} label="Filing status" value="Single" />
              <Detail icon={Calendar} label="Tax year" value="2025" />
              <Detail icon={FileText} label="SSN" value="•••-••-4291" />
            </div>
          </Card>

          {/* ---------- the two client verbs ---------- */}
          {primary ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <ActionCard
                icon={Upload}
                title="Upload a document"
                body="Add a W-2, 1099 or receipt — we’ll read it for you."
                href={`/returns/${primary.id}/documents`}
                cta="Upload"
                tone="brand"
              />
              <ActionCard
                icon={FileText}
                title="View my return"
                body="See where your return is and what’s still needed."
                href={`/returns/${primary.id}`}
                cta="Open"
                tone="ai"
              />
            </div>
          ) : null}

          {/* ---------- filings ---------- */}
          {returns.length ? (
            <div>
              <SectionLabel className="mb-2">Your filings</SectionLabel>
              <Card className="divide-y divide-ink-100 overflow-hidden">
                {returns.map((r) => {
                  const stage = STAGES[r.stage];
                  const personal = r.formType === '1040';
                  const Icon = personal ? UserRound : Building2;
                  return (
                    <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                      <span
                        className={cn(
                          'grid size-9 shrink-0 place-items-center rounded-full text-white',
                          personal ? 'bg-brand-600' : 'bg-ai-600',
                        )}
                      >
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink-900">
                          {r.clientName} · {r.formType}
                        </p>
                        <p className="text-xs text-ink-500">{stage.clientLabel}</p>
                      </div>
                      <Link href={`/returns/${r.id}/documents`}>
                        <Button size="sm" variant="secondary" icon={Upload}>
                          Upload
                        </Button>
                      </Link>
                      <Link href={`/returns/${r.id}`}>
                        <Button size="sm" variant="secondary" icon={ArrowRight}>
                          Open
                        </Button>
                      </Link>
                    </div>
                  );
                })}
              </Card>
            </div>
          ) : null}

          {/* ---------- the human ---------- */}
          <Card className="p-4">
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
              {primary ? (
                <Link href={`/returns/${primary.id}/messages`}>
                  <Button variant="secondary" size="sm" icon={MessageSquare}>
                    Message
                  </Button>
                </Link>
              ) : null}
            </div>
          </Card>

          <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-ink-400">
            <ShieldCheck className="size-3" />
            Nothing is filed without your approval.
          </p>
        </div>
      </div>
    </>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 size-3.5 shrink-0 text-ink-400" />
      <div className="min-w-0">
        <p className="text-[11px] text-ink-500">{label}</p>
        <p className="truncate text-sm text-ink-900">{value}</p>
      </div>
    </div>
  );
}

function ActionCard({
  icon: Icon,
  title,
  body,
  href,
  cta,
  tone,
}: {
  icon: typeof Upload;
  title: string;
  body: string;
  href: string;
  cta: string;
  tone: 'brand' | 'ai';
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-card border border-ink-200 bg-white p-5 shadow-panel transition hover:border-ink-300 hover:shadow-pop"
    >
      <span
        className={cn(
          'grid size-10 place-items-center rounded-xl text-white',
          tone === 'brand' ? 'bg-brand-700' : 'bg-ai-600',
        )}
      >
        <Icon className="size-5" />
      </span>
      <p className="mt-3 text-sm font-semibold text-ink-900">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-ink-600">{body}</p>
      <span
        className={cn(
          'mt-3 inline-flex items-center gap-1 text-xs font-medium',
          tone === 'brand' ? 'text-brand-700' : 'text-ai-700',
        )}
      >
        {cta}
        <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
