'use client';
import { Dialog, type DialogProps, useMediaQuery, useTheme } from '@mui/material';

export default function MobileDialog({ children, PaperProps, ...props }: DialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  return (
    <Dialog
      {...props}
      fullScreen={isMobile}
      PaperProps={{
        ...PaperProps,
        sx: { borderRadius: isMobile ? 0 : 2, ...PaperProps?.sx },
      }}
    >
      {children}
    </Dialog>
  );
}
