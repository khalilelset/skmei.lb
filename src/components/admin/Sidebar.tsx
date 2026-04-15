'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Toolbar,
  Typography,
  Divider,
} from '@mui/material';
import { Store as StoreIcon, Logout as LogoutIcon } from '@mui/icons-material';
import {
  Dashboard as DashboardIcon,
  ShoppingCart as OrdersIcon,
  Inventory as ProductsIcon,
  People as CustomersIcon,
  LocalOffer as CouponsIcon,
  Instagram as InstagramIcon,
  StarRate as FeedbackIcon,
  Category as CategoryIcon,
  BarChart as AnalyticsIcon,
  Reviews as ReviewsIcon,
  Storefront as BrandIcon,
} from '@mui/icons-material';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  variant?: 'permanent' | 'temporary';
}

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { text: 'Dashboard', icon: <DashboardIcon fontSize="small" />, href: '/admin' },
      { text: 'Analytics', icon: <AnalyticsIcon fontSize="small" />, href: '/admin/analytics' },
    ],
  },
  {
    label: 'Commerce',
    items: [
      { text: 'Orders',     icon: <OrdersIcon fontSize="small" />,   href: '/admin/orders' },
      { text: 'Products',   icon: <ProductsIcon fontSize="small" />, href: '/admin/products' },
      { text: 'Customers',  icon: <CustomersIcon fontSize="small" />, href: '/admin/customers' },
      { text: 'Coupons',    icon: <CouponsIcon fontSize="small" />,  href: '/admin/coupons' },
      { text: 'Categories', icon: <CategoryIcon fontSize="small" />, href: '/admin/categories' },
      { text: 'Brands',     icon: <BrandIcon fontSize="small" />,    href: '/admin/brands' },
    ],
  },
  {
    label: 'Content',
    items: [
      { text: 'Instagram', icon: <InstagramIcon fontSize="small" />, href: '/admin/instagram' },
      { text: 'Reviews',   icon: <ReviewsIcon fontSize="small" />,   href: '/admin/reviews' },
      { text: 'Feedback',  icon: <FeedbackIcon fontSize="small" />,  href: '/admin/feedback' },
    ],
  },
];

const DRAWER_WIDTH = 260;

export default function Sidebar({ open, onClose, variant = 'permanent' }: SidebarProps) {
  const pathname = usePathname();

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#111111' }}>
      {/* Logo/Brand — dark bg with white logo */}
      <Toolbar sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)', minHeight: '64px !important', bgcolor: '#000' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
          <Box sx={{ position: 'relative', width: 130, height: 34 }}>
            <Image
              src="/images/logo/white.png"
              alt="SKMEI.LB"
              fill
              style={{ objectFit: 'contain', objectPosition: 'left' }}
              priority
            />
          </Box>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Admin Panel
          </Typography>
        </Box>
      </Toolbar>

      {/* Navigation Menu — grouped */}
      <Box sx={{ flex: 1, overflowY: 'auto', py: 2 }}>
        {NAV_GROUPS.map((group, gi) => (
          <Box key={group.label} sx={{ mb: gi < NAV_GROUPS.length - 1 ? 2 : 0 }}>
            {/* Group label */}
            <Typography
              sx={{
                px: 2.5,
                mb: 0.5,
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.25)',
              }}
            >
              {group.label}
            </Typography>
            <List disablePadding>
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <ListItem key={item.text} disablePadding sx={{ mb: 0.25 }}>
                    <ListItemButton
                      component={Link}
                      href={item.href}
                      onClick={variant === 'temporary' ? onClose : undefined}
                      sx={{
                        mx: 1,
                        borderRadius: '8px',
                        bgcolor: isActive ? '#DC2626' : 'transparent',
                        '&:hover': {
                          bgcolor: isActive ? '#b91c1c' : 'rgba(255,255,255,0.06)',
                        },
                        py: 0.875,
                        transition: 'background-color 0.18s ease',
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 36,
                          color: isActive ? '#fff' : 'rgba(255,255,255,0.45)',
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.text}
                        primaryTypographyProps={{
                          fontSize: 13,
                          fontWeight: isActive ? 700 : 500,
                          color: isActive ? '#fff' : 'rgba(255,255,255,0.65)',
                          letterSpacing: '0.01em',
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      {/* Footer */}
      <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.08)', p: 1.5, space: 1 }}>
        {/* Visit Store */}
        <ListItemButton
          component={Link}
          href="/"
          sx={{
            borderRadius: '8px',
            mb: 0.5,
            bgcolor: '#DC2626',
            color: '#fff',
            '&:hover': { bgcolor: '#b91c1c' },
            py: 1,
          }}
        >
          <ListItemIcon sx={{ minWidth: 36, color: '#fff' }}>
            <StoreIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Visit Store"
            primaryTypographyProps={{ fontSize: 13, fontWeight: 700, color: '#fff' }}
          />
        </ListItemButton>

        {/* Logout */}
        <ListItemButton
          component={Link}
          href="/api/admin/auth/logout"
          sx={{
            borderRadius: '8px',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
            py: 0.75,
          }}
        >
          <ListItemIcon sx={{ minWidth: 36, color: 'rgba(255,255,255,0.35)' }}>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Logout"
            primaryTypographyProps={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.45)' }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          bgcolor: '#111111',
          borderRight: '1px solid rgba(255,255,255,0.08)',
        },
      }}
      ModalProps={{
        keepMounted: true,
      }}
    >
      {drawerContent}
    </Drawer>
  );
}
