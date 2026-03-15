import { Skeleton, Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

interface TableSkeletonProps {
  columns?: number;
  rows?: number;
}

export default function TableSkeleton({ columns = 5, rows = 7 }: TableSkeletonProps) {
  return (
    <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
      <Table sx={{ minWidth: 650 }}>
        <TableHead>
          <TableRow sx={{ bgcolor: 'rgba(0, 0, 0, 0.02)' }}>
            {Array.from({ length: columns }).map((_, i) => (
              <TableCell key={i} sx={{ fontWeight: 600 }}>
                <Skeleton variant="text" width={80} height={20} />
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <TableCell key={colIndex}>
                  <Skeleton
                    variant="text"
                    width={colIndex === 0 ? 100 : colIndex === columns - 1 ? 60 : '80%'}
                    height={20}
                  />
                  {colIndex === 1 && (
                    <Skeleton variant="text" width="50%" height={16} sx={{ mt: 0.5 }} />
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export function StatsCardSkeleton() {
  return (
    <Paper sx={{ p: 3, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Skeleton variant="text" width={120} height={18} />
        <Skeleton variant="circular" width={48} height={48} />
      </Box>
      <Skeleton variant="text" width={100} height={40} sx={{ mb: 1 }} />
      <Skeleton variant="text" width={80} height={16} />
    </Paper>
  );
}
