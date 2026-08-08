'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  EyeOff,
  Eye,
  Send,
  Paperclip,
  CircleCheck,
  Clock,
  UserRound,
  Building2,
  MessageSquare,
  FileText,
  ScrollText,
  ListChecks,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import type { Audience, Message, ObjectType, Thread } from '@/lib/types';
import { visibleThreads, USER_BY_ID, outstandingRequests, getReturn } from '@/lib/mock';
import { hrefFor, resolveRef } from '@/lib/graph';
import { ROLES, can, denialReason } from '@/lib/permissions';
import { useDemo } from '@/lib/store';
import { useUrlState } from '@/lib/useUrlState';
import { cn, dueLabel, relativeTime } from '@/lib/utils';
import { Avatar, Badge, Button, Card, EmptyState, SectionLabel } from '@/components/ui/primitives';
import { Tooltip } from '@/components/ui/Tooltip';

/* ==================================================================
   Ch.02 — Client & CPA collaboration
   ------------------------------------------------------------------
   Three things keep this from being an inbox:

   1. Every thread is ANCHORED to a document, a return line or a task,
      and the anchor is rendered as a link at the top of the thread. You
      cannot start a conversation about nothing.
   2. OUTSTANDING REQUESTS are a derived view, not a second list someone
      has to maintain. A thread with an unfulfilled `request` IS the
      request.
   3. Threads are sorted by WHOSE MOVE IT IS, not by recency. Recency
      sorting is what makes an inbox feel infinite; ownership sorting
      makes it finish.

   The internal/external wall is enforced in the data layer
   (`visibleThreads`), not here, so a client view physically cannot
   render an internal note even if this component asked for one.
   ================================================================== */

const ANCHOR_ICON: Record<ObjectType, typeof FileText> = {
  document: FileText,
  field: ScrollText,
  task: ListChecks,
  thread: MessageSquare,
  insight: MessageSquare,
  return: ScrollText,
};

/* Ch.02 requirement 5 — the sidebar is organised by the object a thread is
   about, not dumped into one flat email list. Threads group under the kind of
   thing they're anchored to. */
const THREAD_GROUPS: Array<{ type: ObjectType; label: string }> = [
  { type: 'document', label: 'Documents' },
  { type: 'field', label: 'Line items' },
  { type: 'task', label: 'Tasks' },
];

export default function MessagesPage() {
  const params = useParams<{ id: string }>();
  const returnId = params.id;
  const role = useDemo((s) => s.activeRole);
  const activeUserId = useDemo((s) => s.activeUserId);
  const extraMessages = useDemo((s) => s.extraMessages);
  const addMessage = useDemo((s) => s.addMessage);
  const audience = ROLES[role].audience;

  /* Ch.02 — making the wall visible. A firm user can flip into the client's
     view without changing role: internal-only threads and internal notes
     vanish on the spot, which is the most direct way to *demonstrate* that a
     client can never see firm chatter. */
  const [previewClient, setPreviewClient] = useState(false);
  const previewing = audience === 'firm' && previewClient;
  const effAudience: Audience = previewing ? 'client' : audience;
  const clientName = getReturn(returnId)?.clientName ?? 'the client';

  const threads = useMemo(() => visibleThreads(returnId, effAudience), [returnId, effAudience]);
  const [urlState, setParams] = useUrlState({ thread: threads[0]?.id ?? '' });
  const selectedId = urlState.thread || threads[0]?.id;
  const selected = threads.find((t) => t.id === selectedId) ?? threads[0];

  const requests = outstandingRequests(threads);

  // Whose move it is, first.
  const sorted = useMemo(
    () =>
      [...threads].sort((a, b) => {
        const aMine = a.nextActionOwner === effAudience && a.status !== 'resolved' ? 0 : 1;
        const bMine = b.nextActionOwner === effAudience && b.status !== 'resolved' ? 0 : 1;
        if (aMine !== bMine) return aMine - bMine;
        const aDone = a.status === 'resolved' ? 1 : 0;
        const bDone = b.status === 'resolved' ? 1 : 0;
        if (aDone !== bDone) return aDone - bDone;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }),
    [threads, effAudience],
  );

  if (!threads.length) {
    return (
      <div className="flex-1 p-6">
        <Card>
          <EmptyState
            icon={MessageSquare}
            title="No conversations yet"
            body="Messages about your return will appear here, attached to the document or figure they concern."
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Firm-only: flip into the client's view to see the wall in action. */}
      {audience === 'firm' ? (
        <div
          className={cn(
            'flex shrink-0 items-center justify-between gap-3 border-b px-4 py-2 text-xs',
            previewing
              ? 'border-caution-300 bg-caution-50 text-caution-900'
              : 'border-ink-200 bg-white text-ink-600',
          )}
        >
          <span className="flex items-center gap-2">
            {previewing ? (
              <>
                <Eye className="size-3.5 shrink-0 text-caution-700" />
                Previewing as <span className="font-semibold">{clientName}</span> — internal notes
                and firm-only threads are hidden.
              </>
            ) : (
              <>
                <ShieldCheck className="size-3.5 shrink-0 text-ink-400" />
                Firm view — you see internal notes and every thread. {clientName} does not.
              </>
            )}
          </span>
          <button
            onClick={() => setPreviewClient((v) => !v)}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition',
              previewing
                ? 'bg-caution-600 text-white hover:bg-caution-700'
                : 'bg-ink-900 text-white hover:bg-ink-800',
            )}
          >
            {previewing ? 'Back to firm view' : 'Preview as client'}
          </button>
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1">
      {/* ================= thread list ================= */}
      <div className="scrollbar-slim flex w-80 shrink-0 flex-col overflow-y-auto border-r border-ink-200 bg-white">
        {requests.length ? (
          <div className="border-b border-ink-200 bg-caution-50 px-4 py-3">
            <SectionLabel className="mb-1.5 text-caution-800">
              Outstanding requests · {requests.length}
            </SectionLabel>
            <div className="space-y-1.5">
              {requests.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setParams({ thread: t.id })}
                  className="block w-full text-left"
                >
                  <p className="truncate text-xs font-medium text-caution-900 hover:underline">
                    {t.request!.what}
                  </p>
                  <p className="text-[11px] text-caution-700">
                    {dueLabel(t.request!.dueDate).text}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {THREAD_GROUPS.map((g) => {
          const groupThreads = sorted.filter((t) => t.anchor.type === g.type);
          if (!groupThreads.length) return null;
          const Icon = ANCHOR_ICON[g.type];
          return (
            <div key={g.type}>
              <div className="flex items-center gap-1.5 border-b border-ink-200 bg-ink-50 px-4 py-1.5">
                <Icon className="size-3 text-ink-400" />
                <SectionLabel>
                  {g.label} · {groupThreads.length}
                </SectionLabel>
              </div>
              <div className="divide-y divide-ink-100">
                {groupThreads.map((t) => (
                  <ThreadRow
                    key={t.id}
                    thread={t}
                    audience={effAudience}
                    active={t.id === selected?.id}
                    onClick={() => setParams({ thread: t.id })}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {(() => {
          const known = new Set(THREAD_GROUPS.map((g) => g.type));
          const rest = sorted.filter((t) => !known.has(t.anchor.type));
          if (!rest.length) return null;
          return (
            <div>
              <div className="flex items-center gap-1.5 border-b border-ink-200 bg-ink-50 px-4 py-1.5">
                <MessageSquare className="size-3 text-ink-400" />
                <SectionLabel>Other · {rest.length}</SectionLabel>
              </div>
              <div className="divide-y divide-ink-100">
                {rest.map((t) => (
                  <ThreadRow
                    key={t.id}
                    thread={t}
                    audience={effAudience}
                    active={t.id === selected?.id}
                    onClick={() => setParams({ thread: t.id })}
                  />
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      {/* ================= thread detail ================= */}
      {selected ? (
        <ThreadDetail
          key={selected.id}
          thread={selected}
          returnId={returnId}
          audience={effAudience}
          activeUserId={activeUserId}
          canPostInternal={can(role, 'view_internal_notes') && !previewing}
          internalDenial={denialReason(role, 'view_internal_notes')}
          extra={extraMessages[selected.id] ?? []}
          onSend={(body, internal) => addMessage(selected.id, body, internal)}
        />
      ) : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ThreadRow({
  thread,
  audience,
  active,
  onClick,
}: {
  thread: Thread;
  audience: Audience;
  active: boolean;
  onClick: () => void;
}) {
  const yourMove = thread.nextActionOwner === audience && thread.status !== 'resolved';
  const last = thread.messages[thread.messages.length - 1];

  return (
    <button
      onClick={onClick}
      className={cn(
        'block w-full px-4 py-3 text-left transition',
        active ? 'bg-brand-50 ring-1 ring-inset ring-brand-200' : 'hover:bg-ink-50',
      )}
    >
      <div className="flex items-start gap-2">
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            {thread.visibility === 'internal' ? (
              <Tooltip content="Internal only — the client cannot see this thread.">
                <EyeOff className="size-3 shrink-0 text-ai-600" />
              </Tooltip>
            ) : null}
            <span className="truncate text-sm font-medium text-ink-900">{thread.subject}</span>
          </span>
          <span className="mt-0.5 block truncate text-[11px] text-ink-500">
            {last ? `${USER_BY_ID[last.authorId]?.name.split(' ')[0]}: ${last.body}` : ''}
          </span>
        </span>
        {thread.status === 'resolved' ? (
          <CircleCheck className="mt-0.5 size-3.5 shrink-0 text-positive-600" />
        ) : yourMove ? (
          <span className="mt-1 size-2 shrink-0 rounded-full bg-caution-500" />
        ) : null}
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <Badge tone={yourMove ? 'caution' : thread.status === 'resolved' ? 'positive' : 'neutral'}>
          {thread.status === 'resolved'
            ? 'Resolved'
            : yourMove
              ? 'Your move'
              : thread.nextActionOwner === 'client'
                ? 'With client'
                : 'With the firm'}
        </Badge>
        {/* Every thread declares who can see it — the wall, stated plainly. */}
        {thread.visibility === 'internal' ? (
          <Badge tone="ai" icon={Lock}>
            Internal
          </Badge>
        ) : (
          <Badge tone="neutral" icon={Eye}>
            Client-visible
          </Badge>
        )}
        <span className="text-[10px] text-ink-400">{relativeTime(thread.updatedAt)}</span>
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */

function ThreadDetail({
  thread,
  returnId,
  audience,
  activeUserId,
  canPostInternal,
  internalDenial,
  extra,
  onSend,
}: {
  thread: Thread;
  returnId: string;
  audience: Audience;
  activeUserId: string;
  canPostInternal: boolean;
  internalDenial: string;
  extra: Message[];
  onSend: (body: string, internal: boolean) => void;
}) {
  const [draft, setDraft] = useState('');
  const [internal, setInternal] = useState(false);

  const anchor = resolveRef(thread.anchor, returnId);
  const AnchorIcon = ANCHOR_ICON[thread.anchor.type];
  const messages = [...thread.messages, ...extra].sort(
    (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
  );

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-ink-100">
      {/* --- anchor: what this conversation is about --- */}
      <div className="shrink-0 border-b border-ink-200 bg-white px-5 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-900">
              {thread.visibility === 'internal' ? (
                <Badge tone="ai" icon={EyeOff}>
                  Internal only
                </Badge>
              ) : null}
              {thread.subject}
            </h2>
            {anchor ? (
              <Link
                href={anchor.href}
                className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-ink-100 px-2 py-1 text-[11px] text-ink-600 transition hover:bg-ink-200 hover:text-ink-900"
              >
                <AnchorIcon className="size-3" />
                About: {anchor.label}
              </Link>
            ) : null}
          </div>
          <div className="shrink-0 text-right">
            <Badge
              tone={
                thread.status === 'resolved'
                  ? 'positive'
                  : thread.nextActionOwner === audience
                    ? 'caution'
                    : 'neutral'
              }
              icon={thread.nextActionOwner === 'client' ? UserRound : Building2}
            >
              {thread.status === 'resolved'
                ? 'Resolved'
                : thread.nextActionOwner === 'client'
                  ? 'Client to act'
                  : 'Firm to act'}
            </Badge>
          </div>
        </div>

        {thread.request && !thread.request.fulfilled ? (
          <div className="mt-2.5 flex items-center gap-2 rounded-lg border border-caution-300 bg-caution-50 px-3 py-2">
            <Clock className="size-3.5 shrink-0 text-caution-700" />
            <p className="min-w-0 flex-1 text-xs text-caution-900">
              <span className="font-medium">Requested:</span> {thread.request.what}
            </p>
            <span className="shrink-0 text-[11px] font-medium text-caution-800">
              {dueLabel(thread.request.dueDate).text}
            </span>
          </div>
        ) : null}
      </div>

      {/* --- messages --- */}
      <div className="scrollbar-slim flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {messages.map((m) => {
          const author = USER_BY_ID[m.authorId];
          const mine = m.authorId === activeUserId;
          return (
            <div key={m.id} className={cn('flex gap-2.5', mine && 'flex-row-reverse')}>
              <Avatar
                initials={author?.initials ?? '??'}
                tone={
                  ROLES[(author?.roles[0] ?? 'individual') as keyof typeof ROLES]?.accent ??
                  'bg-ink-500'
                }
              />
              <div className={cn('min-w-0 max-w-lg', mine && 'items-end')}>
                <div
                  className={cn(
                    'flex items-center gap-2',
                    mine && 'flex-row-reverse',
                  )}
                >
                  <span className="text-xs font-medium text-ink-800">
                    {author?.name ?? 'Unknown'}
                  </span>
                  <span className="text-[10px] text-ink-400">{relativeTime(m.sentAt)}</span>
                  {m.internalOnly ? (
                    <Tooltip content="An internal aside inside a shared thread. The client sees the rest of this conversation but not this message.">
                      <span>
                        <Badge tone="ai" icon={EyeOff}>
                          Internal
                        </Badge>
                      </span>
                    </Tooltip>
                  ) : null}
                </div>
                <div
                  className={cn(
                    'mt-1 rounded-xl px-3 py-2 text-sm leading-relaxed',
                    m.internalOnly
                      ? 'border border-dashed border-ai-300 bg-ai-50 text-ai-900'
                      : mine
                        ? 'bg-brand-700 text-white'
                        : 'border border-ink-200 bg-white text-ink-800',
                  )}
                >
                  {m.body}
                </div>
                {m.attachments?.length ? (
                  <div className={cn('mt-1.5 flex flex-wrap gap-1.5', mine && 'justify-end')}>
                    {m.attachments.map((a) => (
                      <Link
                        key={a.documentId}
                        href={hrefFor({ type: 'document', id: a.documentId }, returnId)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-ink-200 bg-white px-2 py-1 text-[11px] text-ink-600 transition hover:border-brand-300 hover:text-ink-900"
                      >
                        <Paperclip className="size-3" />
                        {a.name}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* --- composer --- */}
      <div className="shrink-0 border-t border-ink-200 bg-white p-3">
        {/* The internal/external switch is in the composer, not a setting —
            the decision has to be made at the moment of writing. */}
        {canPostInternal ? (
          <div className="mb-2 flex items-center gap-1">
            <ComposerMode active={!internal} onClick={() => setInternal(false)} icon={UserRound}>
              Reply to client
            </ComposerMode>
            <ComposerMode active={internal} onClick={() => setInternal(true)} icon={EyeOff}>
              Internal note
            </ComposerMode>
          </div>
        ) : (
          <div className="mb-2 flex items-center gap-1.5 text-[11px] text-ink-400">
            <Lock className="size-3" />
            <Tooltip content={internalDenial}>
              <span className="cursor-help">Internal notes aren’t available to your role</span>
            </Tooltip>
          </div>
        )}

        <div
          className={cn(
            'flex items-end gap-2 rounded-lg border p-2 transition',
            internal ? 'border-ai-300 bg-ai-50' : 'border-ink-300 bg-white',
          )}
        >
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && draft.trim()) {
                onSend(draft.trim(), internal);
                setDraft('');
              }
            }}
            rows={2}
            placeholder={
              internal
                ? 'Visible to firm staff only…'
                : audience === 'client'
                  ? 'Reply to your CPA…'
                  : 'Reply to the client…'
            }
            className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-ink-400"
          />
          <Button
            variant={internal ? 'ai' : 'primary'}
            size="sm"
            icon={Send}
            disabled={!draft.trim()}
            onClick={() => {
              onSend(draft.trim(), internal);
              setDraft('');
            }}
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}

function ComposerMode({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof UserRound;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium transition',
        active ? 'bg-ink-900 text-white' : 'text-ink-500 hover:bg-ink-100 hover:text-ink-800',
      )}
    >
      <Icon className="size-3" />
      {children}
    </button>
  );
}
