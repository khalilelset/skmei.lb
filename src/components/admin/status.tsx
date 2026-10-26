import { Badge } from '@/components/admin/ui/badge';

type Tone = 'amber' | 'blue' | 'violet' | 'indigo' | 'green' | 'neutral' | 'red';

export const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: Tone; dot: string; hint: string; countClass: string }> = {
  pending: { label: 'Pending', tone: 'amber', dot: '#F59E0B', hint: 'to confirm', countClass: 'bg-[#FEF3E2] text-[#B45309]' },
  confirmed: { label: 'Confirmed', tone: 'blue', dot: '#3B82F6', hint: 'to prepare', countClass: 'bg-[#EAF1FF] text-[#1D4ED8]' },
  processing: { label: 'Processing', tone: 'violet', dot: '#8B5CF6', hint: 'packing', countClass: 'bg-[#F3EDFF] text-[#6D28D9]' },
  shipped: { label: 'Shipped', tone: 'indigo', dot: '#6366F1', hint: 'on the road', countClass: 'bg-[#ECEEFF] text-[#4338CA]' },
  delivered: { label: 'Delivered', tone: 'green', dot: '#22C55E', hint: '', countClass: 'bg-[#E6F6EC] text-[#15803D]' },
  cancelled: { label: 'Cancelled', tone: 'neutral', dot: '#BDB3B1', hint: '', countClass: 'bg-[#F1EEED] text-[#57534E]' },
};

export function isOrderStatus(s: string): s is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(s);
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const cfg = isOrderStatus(status) ? ORDER_STATUS[status] : null;
  return (
    <Badge tone={cfg?.tone ?? 'neutral'} dot={cfg?.dot ?? '#BDB3B1'} className={className}>
      {cfg?.label ?? status.replace(/_/g, ' ')}
    </Badge>
  );
}
