'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FileText,
  MessageSquare,
  ListChecks,
  Sparkles,
  ScrollText,
  Link2,
  type LucideIcon,
} from 'lucide-react';
import type { ObjectRef, ObjectType } from '@/lib/types';
import { relatedGrouped } from '@/lib/graph';
import { useDemo } from '@/lib/store';
import { ROLES } from '@/lib/permissions';
import { THREAD_BY_ID } from '@/lib/mock';
import { Card } from '@/components/ui/primitives';

const TYPE_ICON: Record<ObjectType, LucideIcon> = {
  return: ScrollText,
  document: FileText,
  field: ScrollText,
  thread: MessageSquare,
  task: ListChecks,
  insight: Sparkles,
};

/**
 * Ch.04 — "showing how different objects connect to each other".
 *
 * One component, driven by the graph in lib/graph.ts, rendered at the bottom
 * of every detail view. Because the edges are derived rather than hand-listed
 * per screen, a document added to a task automatically appears here — the rail
 * cannot fall out of sync with the data the way a curated list would.
 *
 * Following a link stashes where you came from, so the header can offer a
 * genuine "back to what you were doing" instead of browser history roulette.
 */
export function RelatedRail({
  refObject,
  returnId,
  title = 'Connected to this',
}: {
  refObject: ObjectRef;
  returnId: string;
  title?: string;
}) {
  const pathname = usePathname();
  const role = useDemo((s) => s.activeRole);
  const setLastWorkflow = useDemo((s) => s.setLastWorkflow);
  const audience = ROLES[role].audience;

  const groups = relatedGrouped(refObject, returnId)
    .map((g) => ({
      ...g,
      // The wall holds here too: a client must never see an internal thread
      // surface in a "related" list.
      items: g.items.filter(
        (i) => !(i.type === 'thread' && audience === 'client' && THREAD_BY_ID[i.id]?.visibility === 'internal'),
      ),
    }))
    .filter((g) => g.items.length);

  if (!groups.length) return null;

  return (
    <Card>
      <div className="flex items-center gap-2 border-b border-ink-200 px-4 py-2.5">
        <Link2 className="size-3.5 text-ink-400" />
        <h3 className="text-xs font-semibold text-ink-900">{title}</h3>
      </div>

      <div className="divide-y divide-ink-100">
        {groups.map((g) => (
          <div key={g.type} className="px-4 py-2.5">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-400">
              {g.label}
            </p>
            <div className="space-y-0.5">
              {g.items.map((item) => {
                const Icon = TYPE_ICON[item.type];
                return (
                  <Link
                    key={`${item.type}-${item.id}`}
                    href={item.href}
                    onClick={() =>
                      setLastWorkflow({ label: refObject.label ?? 'where you were', href: pathname })
                    }
                    className="group flex items-center gap-2 rounded-md px-1.5 py-1 transition hover:bg-ink-100"
                  >
                    <Icon className="size-3.5 shrink-0 text-ink-400" />
                    <span className="min-w-0 flex-1 truncate text-xs text-ink-700 group-hover:text-ink-900">
                      {item.label}
                    </span>
                    {item.sublabel ? (
                      <span className="shrink-0 text-[10px] text-ink-400">{item.sublabel}</span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
