'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Sidebar from '@/components/admin/Sidebar';
import TopBar from '@/components/admin/TopBar';

// Create custom MUI theme matching brand colors
const theme = createTheme({
  palette: {
    primary: {
      main: '#DC2626', // brand-red
    },
    secondary: {
      main: '#000000', // brand-black
    },
    background: {
      default: '#F9FAFB',
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: 'var(--font-montserrat), system-ui, sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        },
      },
    },
  },
});

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Login page renders without any MUI wrapper (pure Tailwind, no hydration conflicts)
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
        {/* Top Bar */}
        <TopBar onMenuClick={handleDrawerToggle} />

        {/* Sidebar - Desktop */}
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <Sidebar open={true} onClose={() => {}} variant="permanent" />
        </Box>

        {/* Sidebar - Mobile */}
        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
          <Sidebar open={mobileOpen} onClose={handleDrawerToggle} variant="temporary" />
        </Box>

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: { md: 'calc(100% - 240px)' },
            minHeight: '100vh',
          }}
        >
          {/* Toolbar spacer */}
          <Toolbar />

          {/* Page Content */}
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            {children}
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
