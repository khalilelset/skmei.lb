'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ShoppingBag, Watch } from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandFooter,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/admin/ui/command';
import { NAV_GROUPS } from './nav';

export function CommandMenu({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const q = query.trim();

  const go = (href: string) => {
    onOpenChange(false);
    setQuery('');
    router.push(href);
  };

  return (
    <CommandDialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setQuery(''); }} label="Search the admin">
      <CommandInput value={query} onValueChange={setQuery} placeholder="Search pages, or type an order number or customer name…" />
      <CommandList>
        <CommandEmpty>No pages match. Press Enter to search orders.</CommandEmpty>
        {q && (
          <CommandGroup heading="Search">
            <CommandItem value={`search-orders ${q}`} onSelect={() => go(`/admin/orders?q=${encodeURIComponent(q)}`)}>
              <ShoppingBag />
              Search orders for “{q}”
            </CommandItem>
            <CommandItem value={`search-products ${q}`} onSelect={() => go(`/admin/products?q=${encodeURIComponent(q)}`)}>
              <Watch />
              Search products for “{q}”
            </CommandItem>
          </CommandGroup>
        )}
        {NAV_GROUPS.map((group) => (
          <CommandGroup key={group.label} heading={group.label}>
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem key={item.href} value={`page ${item.label}`} onSelect={() => go(item.href)}>
                  <Icon />
                  {item.label}
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
      </CommandList>
      <CommandFooter>
        <span>↑ ↓ to move</span>
        <span>Enter to open</span>
        <span>Esc to close</span>
      </CommandFooter>
    </CommandDialog>
  );
}
