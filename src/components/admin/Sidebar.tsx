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
} from '@mui/material';
import { Store as StoreIcon } from '@mui/icons-material';
import {
  Dashboard as DashboardIcon,
  ShoppingCart as OrdersIcon,
  Inventory as ProductsIcon,
  People as CustomersIcon,
  LocalOffer as CouponsIcon,
  Instagram as InstagramIcon,
  StarRate as FeedbackIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  variant?: 'permanent' | 'temporary';
}

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, href: '/admin' },
  { text: 'Orders', icon: <OrdersIcon />, href: '/admin/orders' },
  { text: 'Products', icon: <ProductsIcon />, href: '/admin/products' },
  { text: 'Customers', icon: <CustomersIcon />, href: '/admin/customers' },
  { text: 'Coupons', icon: <CouponsIcon />, href: '/admin/coupons' },
  { text: 'Categories', icon: <CategoryIcon />, href: '/admin/categories' },
  { text: 'Instagram', icon: <InstagramIcon />, href: '/admin/instagram' },
  { text: 'Feedback', icon: <FeedbackIcon />, href: '/admin/feedback' },
];

const DRAWER_WIDTH = 240;

export default function Sidebar({ open, onClose, variant = 'permanent' }: SidebarProps) {
  const pathname = usePathname();

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo/Brand */}
      <Toolbar sx={{ borderBottom: '1px solid rgba(0, 0, 0, 0.12)', minHeight: '64px !important' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
          <Box sx={{ position: 'relative', width: 130, height: 34 }}>
            <Image
              src="/images/logo/black.png"
              alt="SKMEI.LB"
              fill
              style={{ objectFit: 'contain', objectPosition: 'left' }}
              priority
            />
          </Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 10, letterSpacing: 0.5 }}>
            Admin Panel
          </Typography>
        </Box>
      </Toolbar>

      {/* Navigation Menu */}
      <List sx={{ flex: 1, pt: 2 }}>
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={Link}
                href={item.href}
                onClick={variant === 'temporary' ? onClose : undefined}
                sx={{
                  mx: 1,
                  borderRadius: 2,
                  bgcolor: isActive ? 'rgba(220, 38, 38, 0.08)' : 'transparent',
                  '&:hover': {
                    bgcolor: isActive ? 'rgba(220, 38, 38, 0.12)' : 'rgba(0, 0, 0, 0.04)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: isActive ? '#DC2626' : 'text.secondary',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? '#DC2626' : 'text.primary',
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: '1px solid rgba(0, 0, 0, 0.12)' }}>
        <ListItemButton
            component={Link}
            href="/"
            sx={{
              borderRadius: 2,
              mb: 1,
              border: '1px solid rgba(220, 38, 38, 0.3)',
              color: '#DC2626',
              '&:hover': { bgcolor: 'rgba(220, 38, 38, 0.06)' },
              py: 0.75,
            }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: '#DC2626' }}>
              <StoreIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Visit Store"
              primaryTypographyProps={{ fontSize: 13, fontWeight: 500, color: '#DC2626' }}
            />
          </ListItemButton>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
          © 2025 SKMEI.LB · Authorized Dealer
        </Typography>
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
          borderRight: '1px solid rgba(0, 0, 0, 0.12)',
        },
      }}
      ModalProps={{
        keepMounted: true, // Better open performance on mobile
      }}
    >
      {drawerContent}
    </Drawer>
  );
}
