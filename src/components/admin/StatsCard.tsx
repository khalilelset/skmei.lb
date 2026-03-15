import { Card, CardContent, Typography, Box } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  iconBgColor?: string;
  iconColor?: string;
}

export default function StatsCard({
  title,
  value,
  change,
  icon,
  iconBgColor = 'rgba(220, 38, 38, 0.1)',
  iconColor = '#DC2626',
}: StatsCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: { xs: 1, sm: 2 } }}>
          <Box sx={{ minWidth: 0, flex: 1, pr: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontSize: { xs: '0.7rem', sm: '0.875rem' }, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {title}
            </Typography>
            <Typography sx={{ fontWeight: 700, color: 'text.primary', fontSize: { xs: '1.25rem', sm: '1.75rem' }, lineHeight: 1.2 }}>
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              width: { xs: 36, sm: 48 },
              height: { xs: 36, sm: 48 },
              flexShrink: 0,
              borderRadius: 2,
              bgcolor: iconBgColor,
              color: iconColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
        </Box>

        {change !== undefined && change !== 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {isPositive && <TrendingUp sx={{ fontSize: 16, color: 'success.main' }} />}
            {isNegative && <TrendingDown sx={{ fontSize: 16, color: 'error.main' }} />}
            <Typography variant="body2" sx={{ color: isPositive ? 'success.main' : 'error.main', fontWeight: 500 }}>
              {isPositive ? '+' : ''}{change}%
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5, fontSize: '0.75rem' }}>
              vs last month
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
