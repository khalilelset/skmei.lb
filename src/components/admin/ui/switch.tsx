'use client';

import * as React from 'react';
import { Switch as SwitchPrimitive, Checkbox as CheckboxPrimitive } from 'radix-ui';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'peer inline-flex h-[22px] w-[38px] shrink-0 items-center rounded-full p-[2px] outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-adm-accent/25 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-adm-accent data-[state=unchecked]:bg-adm-line-2',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="pointer-events-none block size-[18px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,.2)] transition-transform duration-300 ease-adm-spring data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0" />
    </SwitchPrimitive.Root>
  );
}

function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        'peer grid size-[18px] shrink-0 place-items-center rounded-[5px] border border-adm-line-2 bg-adm-surface outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-adm-accent/25 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-adm-accent data-[state=checked]:bg-adm-accent data-[state=checked]:text-white',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator>
        <Check className="size-3.5" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Switch, Checkbox };
