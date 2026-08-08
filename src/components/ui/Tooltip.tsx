'use client';

import * as RTooltip from '@radix-ui/react-tooltip';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function TooltipProvider({ children }: { children: ReactNode }) {
  return (
    <RTooltip.Provider delayDuration={180} skipDelayDuration={300}>
      {children}
    </RTooltip.Provider>
  );
}

/**
 * Used everywhere a control has to explain itself — a locked field's reason,
 * a disabled permission, a status badge's shared definition.
 *
 * Radix gives us focus/keyboard parity for free, which matters here: the
 * explanation half of an affordance must not be mouse-only, or keyboard
 * users get a product full of unexplained dead ends.
 */
export function Tooltip({
  content,
  children,
  side = 'top',
  align = 'center',
  width = 'w-64',
}: {
  content: ReactNode;
  children: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  width?: string;
}) {
  if (!content) return <>{children}</>;
  return (
    <RTooltip.Root>
      <RTooltip.Trigger asChild>{children}</RTooltip.Trigger>
      <RTooltip.Portal>
        <RTooltip.Content
          side={side}
          align={align}
          sideOffset={6}
          collisionPadding={12}
          className={cn(
            'z-50 rounded-lg bg-ink-900 px-3 py-2 text-xs leading-relaxed text-ink-100 shadow-pop',
            'data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0',
            width,
          )}
        >
          {content}
          <RTooltip.Arrow className="fill-ink-900" width={10} height={5} />
        </RTooltip.Content>
      </RTooltip.Portal>
    </RTooltip.Root>
  );
}
