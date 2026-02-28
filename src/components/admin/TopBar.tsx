'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Tooltip,
} from '@mui/material';
import { Menu as MenuIcon, Logout as LogoutIcon } from '@mui/icons-material';

interface TopBarProps {
  onMenuClick: () => void;
  showMenuButton?: boolean;
}

export default function TopBar({ onMenuClick, showMenuButton = true }: TopBarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

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
      <Toolbar sx={{ position: 'relative' }}>

        {/* Left — mobile menu button */}
        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          {showMenuButton && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={onMenuClick}
              sx={{ display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
          )}
          {/* Desktop: subtitle text */}
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Manage your SKMEI watch store
            </Typography>
          </Box>
        </Box>

        {/* Center — logo (absolute so it's truly centered) */}
        <Box
          sx={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Box sx={{ position: 'relative', width: 130, height: 34 }}>
            <Image
              src="/images/logo/white.png"
              alt="SKMEI.LB"
              fill
              style={{ objectFit: 'contain' }}
              priority
            />
          </Box>
        </Box>

        {/* Right — logout */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flex: 1 }}>
          <Tooltip title="Logout">
            <IconButton
              onClick={handleLogout}
              size="small"
              sx={{
                color: 'text.secondary',
                '&:hover': { color: '#DC2626', bgcolor: 'rgba(220,38,38,0.06)' },
                transition: 'all 0.2s',
              }}
            >
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

      </Toolbar>
    </AppBar>
  );
}
