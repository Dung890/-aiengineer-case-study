'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Check,
  Upload,
  MessageSquare,
  ShieldCheck,
  Stamp,
  Phone,
  CircleDot,
  UserRound,
  Building2,
} from 'lucide-react';
import type { Task, TaskKind } from '@/lib/types';
import { getTasks } from '@/lib/mock';
import { resolveRefs } from '@/lib/graph';
import { ROLES } from '@/lib/permissions';
import { useDemo } from '@/lib/store';
import { useUrlState } from '@/lib/useUrlState';
import { cn, dueLabel } from '@/lib/utils';
import { Badge, Button, Card, EmptyState, SectionLabel } from '@/components/ui/primitives';

const KIND_ICON: Record<TaskKind, typeof Upload> = {
  upload: Upload,
  answer: MessageSquare,
  review: ShieldCheck,
  approve: Stamp,
  verify: ShieldCheck,
  call: Phone,
};

export default function TasksPage() {
  const params = useParams<{ id: string }>();
  const returnId = params.id;
  const role = useDemo((s) => s.activeRole);
  const taskStatus = useDemo((s) => s.taskStatus);
  const setTaskStatus = useDemo((s) => s.setTaskStatus);
  const audience = ROLES[role].audience;

  const [urlState, setParams] = useUrlState({ task: '' });
  const all = getTasks(returnId).map((t) => ({ ...t, status: taskStatus[t.id] ?? t.status }));

  const mine = all.filter((t) => t.owner === audience && t.status !== 'done');
  const theirs = all.filter((t) => t.owner !== audience && t.status !== 'done');
  const done = all.filter((t) => t.status === 'done');

  if (!all.length) {
    return (
      <div className="flex-1 p-6">
        <Card>
          <EmptyState icon={Check} title="No tasks" body="Nothing is outstanding on this return." />
        </Card>
      </div>
    );
  }

  return (
    <div className="scrollbar-slim flex-1 overflow-y-auto px-6 py-5">
      <div className="mx-auto max-w-3xl space-y-5">
        <Section
          label={audience === 'client' ? 'Your to-do list' : 'Assigned to you'}
          icon={audience === 'client' ? UserRound : Building2}
          tasks={mine}
          returnId={returnId}
          highlight={urlState.task}
          onSelect={(id) => setParams({ task: id })}
          onComplete={(id) => setTaskStatus(id, 'done')}
          emptyTitle="Nothing needs you"
          emptyBody={
            audience === 'client'
              ? 'We’ll let you know as soon as we need something.'
              : 'Everything assigned to you here is done.'
          }
          actionable
        />

        {theirs.length ? (
          <Section
            label={audience === 'client' ? 'What your CPA is doing' : 'Waiting on the client'}
            icon={audience === 'client' ? Building2 : UserRound}
            tasks={theirs}
            returnId={returnId}
            highlight={urlState.task}
            onSelect={(id) => setParams({ task: id })}
            emptyTitle=""
          />
        ) : null}

        {done.length ? (
          <Section
            label={`Done · ${done.length}`}
            icon={Check}
            tasks={done}
            returnId={returnId}
            highlight={urlState.task}
            onSelect={(id) => setParams({ task: id })}
            emptyTitle=""
            muted
          />
        ) : null}
      </div>
    </div>
  );
}

function Section({
  label,
  icon: Icon,
  tasks,
  returnId,
  highlight,
  onSelect,
  onComplete,
  emptyTitle,
  emptyBody,
  actionable = false,
  muted = false,
}: {
  label: string;
  icon: typeof Upload;
  tasks: Task[];
  returnId: string;
  highlight?: string;
  onSelect: (id: string) => void;
  onComplete?: (id: string) => void;
  emptyTitle: string;
  emptyBody?: string;
  actionable?: boolean;
  muted?: boolean;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <Icon className="size-4 text-ink-400" />
        <SectionLabel>{label}</SectionLabel>
      </div>
      <Card className={cn('overflow-hidden', muted && 'opacity-70')}>
        {tasks.length ? (
          <div className="divide-y divide-ink-100">
            {tasks.map((t) => (
              <TaskRow
                key={t.id}
                task={t}
                returnId={returnId}
                highlighted={t.id === highlight}
                onSelect={() => onSelect(t.id)}
                onComplete={onComplete ? () => onComplete(t.id) : undefined}
                actionable={actionable}
              />
            ))}
          </div>
        ) : emptyTitle ? (
          <EmptyState icon={Check} title={emptyTitle} body={emptyBody} />
        ) : null}
      </Card>
    </section>
  );
}

function TaskRow({
  task,
  returnId,
  highlighted,
  onSelect,
  onComplete,
  actionable,
}: {
  task: Task;
  returnId: string;
  highlighted: boolean;
  onSelect: () => void;
  onComplete?: () => void;
  actionable: boolean;
}) {
  const Icon = KIND_ICON[task.kind];
  const links = resolveRefs(task.links, returnId);
  const due = task.dueDate ? dueLabel(task.dueDate) : null;
  const isDone = task.status === 'done';

  return (
    <div
      onClick={onSelect}
      className={cn(
        'px-4 py-3 transition',
        highlighted ? 'bg-brand-50 ring-1 ring-inset ring-brand-200' : 'hover:bg-ink-50',
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg',
            isDone
              ? 'bg-ink-100 text-ink-400'
              : task.priority === 'urgent'
                ? 'bg-danger-50 text-danger-600'
                : 'bg-ink-100 text-ink-600',
          )}
        >
          {isDone ? <Check className="size-3.5" /> : <Icon className="size-3.5" />}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p
              className={cn(
                'text-sm font-medium',
                isDone ? 'text-ink-500 line-through' : 'text-ink-900',
              )}
            >
              {task.title}
            </p>
            {task.status === 'blocked' ? <Badge tone="neutral">Not yet</Badge> : null}
            {task.priority === 'urgent' && !isDone ? (
              <Badge tone="danger" dot>
                Urgent
              </Badge>
            ) : null}
          </div>

          {task.detail ? (
            <p className="mt-0.5 text-xs leading-relaxed text-ink-500">{task.detail}</p>
          ) : null}

          {/* Ch.04: every task reaches the objects it concerns. */}
          {links.length ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {links.map((l) => (
                <Link
                  key={`${l.type}-${l.id}`}
                  href={l.href}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 rounded-md bg-ink-100 px-2 py-0.5 text-[11px] text-ink-600 transition hover:bg-ink-200 hover:text-ink-900"
                >
                  <CircleDot className="size-2.5" />
                  {l.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {due && !isDone ? (
            <span
              className={cn(
                'text-[11px]',
                due.tone === 'danger'
                  ? 'font-medium text-danger-700'
                  : due.tone === 'caution'
                    ? 'text-caution-700'
                    : 'text-ink-500',
              )}
            >
              {due.text}
            </span>
          ) : null}
          {actionable && onComplete && !isDone && task.status !== 'blocked' ? (
            <Button
              size="sm"
              variant="secondary"
              icon={Check}
              onClick={(e) => {
                e.stopPropagation();
                onComplete();
              }}
            >
              Done
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
