import {
  Award,
  Camera,
  ChartLine,
  Gift,
  Glasses,
  Layers,
  LayoutDashboard,
  MessageSquare,
  ShoppingBag,
  Star,
  Ticket,
  Users,
  Watch,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  showPendingCount?: boolean;
}

export const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
      { label: 'Analytics', href: '/admin/analytics', icon: ChartLine },
    ],
  },
  {
    label: 'Commerce',
    items: [
      { label: 'Orders', href: '/admin/orders', icon: ShoppingBag, showPendingCount: true },
      { label: 'Products', href: '/admin/products', icon: Watch },
      { label: 'Sunglasses', href: '/admin/sunglasses', icon: Glasses },
      { label: 'Customers', href: '/admin/customers', icon: Users },
      { label: 'Coupons', href: '/admin/coupons', icon: Ticket },
      { label: 'Categories', href: '/admin/categories', icon: Layers },
      { label: 'Brands', href: '/admin/brands', icon: Award },
      { label: 'Boxes', href: '/admin/boxes', icon: Gift },
    ],
  },
  {
    label: 'Content',
    items: [
      { label: 'Instagram', href: '/admin/instagram', icon: Camera },
      { label: 'Reviews', href: '/admin/reviews', icon: Star },
      { label: 'Feedback', href: '/admin/feedback', icon: MessageSquare },
    ],
  },
];

export const NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

export function isActive(href: string, pathname: string) {
  return href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(`${href}/`);
}

export function pageTitle(pathname: string) {
  return NAV_ITEMS.find((i) => isActive(i.href, pathname))?.label ?? 'Admin';
}

/** Pages call this after changing an order so the sidebar's pending badge refreshes. */
export const ORDERS_CHANGED_EVENT = 'admin:orders-changed';
