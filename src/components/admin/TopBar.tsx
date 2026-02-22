'use client';

import Image from 'next/image';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountIcon,
} from '@mui/icons-material';

interface TopBarProps {
  onMenuClick: () => void;
  showMenuButton?: boolean;
}

export default function TopBar({ onMenuClick, showMenuButton = true }: TopBarProps) {
  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        bgcolor: 'white',
        color: 'text.primary',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      }}
    >
      <Toolbar>
        {/* Mobile Menu Button */}
        {showMenuButton && (
          <IconButton
            color="inherit"
            edge="start"
            onClick={onMenuClick}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
        )}

        {/* Logo on mobile / Title on desktop */}
        <Box sx={{ flexGrow: 1 }}>
          {/* Mobile: show logo */}
          <Box sx={{ display: { xs: 'block', md: 'none' }, position: 'relative', width: 120, height: 32 }}>
            <Image
              src="/images/logo/black.png"
              alt="SKMEI.LB"
              fill
              style={{ objectFit: 'contain', objectPosition: 'left' }}
              priority
            />
          </Box>
          {/* Desktop: show text title */}
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#000000' }}>
              Admin Dashboard
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Manage your SKMEI watch store
            </Typography>
          </Box>
        </Box>

        {/* Right Side Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton sx={{ color: 'text.secondary' }}>
              <NotificationsIcon />
            </IconButton>
          </Tooltip>

          {/* User Profile */}
          <Tooltip title="Admin Profile">
            <IconButton sx={{ ml: 1 }}>
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: '#DC2626',
                  fontSize: 16,
                  fontWeight: 600,
                }}
              >
                A
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
