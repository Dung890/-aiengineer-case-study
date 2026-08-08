'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useRouter } from 'next/navigation';
import { ChevronDown, ArrowRightLeft, CircleCheck } from 'lucide-react';
import { ROLES, ROLE_ORDER } from '@/lib/permissions';
import { useDemo } from '@/lib/store';
import { USERS, USER_BY_ID } from '@/lib/mock/users';
import type { Role } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/primitives';

/* ==================================================================
   Ch.05 — switching between roles
   ------------------------------------------------------------------
   In production this is an account menu, not a role picker. For a
   prototype the switcher IS the demonstration, so it is deliberately
   prominent and labelled as a demo control — an honest seam rather
   than a pretend login screen.

   The genuinely interesting case is at the bottom: Rosa is staff AND a
   client. Switching to her personal return swaps the whole shell
   without changing identity, which is the case study's stated edge.
   ================================================================== */

/** Which sample account best embodies each role. */
const ROLE_ACCOUNT: Record<Role, string> = {
  individual: 'u-priya',
  business_owner: 'u-marcus',
  preparer: 'u-jordan',
  reviewer: 'u-lin',
  admin: 'u-dana',
  seasonal: 'u-sam',
};

export function RoleSwitcher({ collapsed = false }: { collapsed?: boolean }) {
  const router = useRouter();
  const activeRole = useDemo((s) => s.activeRole);
  const activeUserId = useDemo((s) => s.activeUserId);
  const setRole = useDemo((s) => s.setRole);

  const user = USER_BY_ID[activeUserId]!;
  const profile = ROLES[activeRole];

  function choose(role: Role, userId: string, href: string) {
    setRole(role, userId);
    router.push(href);
  }

  const firmRoles = ROLE_ORDER.filter((r) => ROLES[r].audience === 'firm');
  const clientRoles = ROLE_ORDER.filter((r) => ROLES[r].audience === 'client');
  const rosa = USERS.find((u) => u.id === 'u-rosa')!;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className={cn(
            'flex w-full items-center gap-2.5 rounded-lg border border-ink-200 bg-white p-2 text-left transition hover:border-ink-300 hover:bg-ink-50',
          )}
        >
          <Avatar initials={user.initials} tone={profile.accent} />
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold text-ink-900">
                  {user.name}
                </span>
                <span className="block truncate text-[11px] text-ink-500">{profile.label}</span>
              </span>
              <ChevronDown className="size-4 shrink-0 text-ink-400" />
            </>
          )}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          side="top"
          align="start"
          sideOffset={8}
          className="z-50 w-80 rounded-xl border border-ink-200 bg-white p-1.5 shadow-pop"
        >
          <div className="flex items-center gap-2 px-2.5 py-2">
            <ArrowRightLeft className="size-3.5 text-ink-400" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
              Demo — switch role
            </span>
          </div>

          <Group label="Firm">
            {firmRoles.map((role) => (
              <RoleRow
                key={role}
                role={role}
                active={activeRole === role && activeUserId === ROLE_ACCOUNT[role]}
                onSelect={() => choose(role, ROLE_ACCOUNT[role], '/dashboard')}
              />
            ))}
          </Group>

          <Group label="Client">
            {clientRoles.map((role) => (
              <RoleRow
                key={role}
                role={role}
                active={activeRole === role && activeUserId === ROLE_ACCOUNT[role]}
                onSelect={() => choose(role, ROLE_ACCOUNT[role], '/account')}
              />
            ))}
          </Group>

          <DropdownMenu.Separator className="my-1.5 h-px bg-ink-200" />

          {/* The multi-role edge case, called out rather than buried. */}
          <div className="px-2.5 pb-1 pt-0.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
              Holds both
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-ink-500">
              Rosa is on staff and is also a client of the firm — one identity, two contexts.
            </p>
          </div>
          <DropdownMenu.Item
            onSelect={() => choose('preparer', rosa.id, '/dashboard')}
            className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 outline-none data-[highlighted]:bg-ink-100"
          >
            <Avatar initials="RI" tone="bg-ai-600" />
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-medium text-ink-900">Rosa — staff view</span>
              <span className="block text-[11px] text-ink-500">Her assigned client work</span>
            </span>
            {activeUserId === 'u-rosa' && activeRole === 'preparer' ? (
              <CircleCheck className="size-4 text-brand-600" />
            ) : null}
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={() => choose('individual', rosa.id, `/returns/${rosa.personalReturnId}`)}
            className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 outline-none data-[highlighted]:bg-ink-100"
          >
            <Avatar initials="RI" tone="bg-brand-600" />
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-medium text-ink-900">Rosa — her own return</span>
              <span className="block text-[11px] text-ink-500">
                Same person, client permissions only
              </span>
            </span>
            {activeUserId === 'u-rosa' && activeRole === 'individual' ? (
              <CircleCheck className="size-4 text-brand-600" />
            ) : null}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <DropdownMenu.Group>
      <DropdownMenu.Label className="px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
        {label}
      </DropdownMenu.Label>
      {children}
    </DropdownMenu.Group>
  );
}

function RoleRow({
  role,
  active,
  onSelect,
}: {
  role: Role;
  active: boolean;
  onSelect: () => void;
}) {
  const p = ROLES[role];
  const Icon = p.icon;
  const account = USER_BY_ID[ROLE_ACCOUNT[role]]!;

  return (
    <DropdownMenu.Item
      onSelect={onSelect}
      className="flex cursor-pointer items-start gap-2.5 rounded-lg px-2.5 py-2 outline-none data-[highlighted]:bg-ink-100"
    >
      <span
        className={cn(
          'mt-0.5 grid size-7 shrink-0 place-items-center rounded-full text-white',
          p.accent,
        )}
      >
        <Icon className="size-3.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-ink-900">{p.label}</span>
          <span className="text-[11px] text-ink-400">· {account.name.split(' ')[0]}</span>
        </span>
        <span className="mt-0.5 block text-[11px] leading-snug text-ink-500">{p.blurb}</span>
      </span>
      {active ? <CircleCheck className="mt-0.5 size-4 shrink-0 text-brand-600" /> : null}
    </DropdownMenu.Item>
  );
}
