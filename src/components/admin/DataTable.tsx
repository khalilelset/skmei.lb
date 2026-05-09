'use client';

import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TableSortLabel, Box, Typography, Chip, useMediaQuery, useTheme,
} from '@mui/material';
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';
import { useState } from 'react';

export interface Column {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  format?: (value: any, row?: any) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onRowClick?: (row: any) => void;
  emptyMessage?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MobileCard({ row, columns, onRowClick }: { row: any; columns: Column[]; onRowClick?: (row: any) => void }) {
  const imageCol  = columns.find((c) => c.label === 'Image');
  const actionsCol = columns.find((c) => c.label === 'Actions');
  const mainCols  = columns.filter((c) => c.label !== 'Image' && c.label !== 'Actions');

  return (
    <Paper
      onClick={() => onRowClick?.(row)}
      elevation={0}
      sx={{
        mb: 1.5, borderRadius: 2,
        border: '1px solid rgba(0,0,0,0.09)',
        cursor: onRowClick ? 'pointer' : 'default',
        overflow: 'hidden',
        '&:active': { boxShadow: '0 0 0 2px rgba(220,38,38,0.5)' },
      }}
    >
      {/* Top row: image + primary info + actions */}
      <Box sx={{ display: 'flex', gap: 1.5, p: 1.5, alignItems: 'center' }}>
        {imageCol && (
          <Box sx={{ flexShrink: 0 }}>
            {imageCol.format ? imageCol.format(row[imageCol.id], row) : row[imageCol.id]}
          </Box>
        )}

        <Box sx={{ flex: 1, minWidth: 0 }}>
          {mainCols.slice(0, 2).map((col, i) => (
            <Box key={col.id} sx={{ mb: i === 0 ? 0.25 : 0 }}>
              {col.format ? col.format(row[col.id], row) : (
                <Typography sx={{ fontSize: i === 0 ? '0.875rem' : '0.8rem', fontWeight: i === 0 ? 600 : 400, color: i === 0 ? 'text.primary' : 'text.secondary' }}>
                  {row[col.id] ?? '—'}
                </Typography>
              )}
            </Box>
          ))}
        </Box>

        {actionsCol && (
          <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
            {actionsCol.format ? actionsCol.format(row[actionsCol.id], row) : null}
          </Box>
        )}
      </Box>

      {/* Extra fields */}
      {mainCols.length > 2 && (
        <Box sx={{
          px: 1.5, pb: 1.25, pt: 0.75,
          borderTop: '1px solid rgba(0,0,0,0.06)',
          display: 'flex', flexWrap: 'wrap', gap: 1.25,
        }}>
          {mainCols.slice(2).map((col) => (
            <Box key={col.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.62rem', color: 'text.disabled' }}>
                {col.label}:
              </Typography>
              <Box sx={{ fontSize: '0.8rem' }}>
                {col.format ? col.format(row[col.id], row) : (row[col.id] ?? '—')}
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
}

export default function DataTable({ columns, data, onRowClick, emptyMessage = 'No data available' }: DataTableProps) {
  const [orderBy, setOrderBy] = useState<string>('');
  const [order, setOrder]     = useState<'asc' | 'desc'>('asc');
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleSort = (columnId: string) => {
    setOrder(orderBy === columnId && order === 'asc' ? 'desc' : 'asc');
    setOrderBy(columnId);
  };

  const sortedData = [...data].sort((a, b) => {
    if (!orderBy) return 0;
    const av = a[orderBy], bv = b[orderBy];
    if (av < bv) return order === 'asc' ? -1 : 1;
    if (av > bv) return order === 'asc' ? 1 : -1;
    return 0;
  });

  if (data.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">{emptyMessage}</Typography>
      </Paper>
    );
  }

  /* ── Mobile: card view ── */
  if (isMobile) {
    const sortableCols = columns.filter((c) => c.sortable !== false && c.label !== 'Image' && c.label !== 'Actions');
    return (
      <Box>
        {sortableCols.length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', alignItems: 'center', mb: 2 }}>
            <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 700, mr: 0.25 }}>Sort:</Typography>
            {sortableCols.map((col) => {
              const active = orderBy === col.id;
              return (
                <Chip
                  key={col.id}
                  label={col.label}
                  size="small"
                  onClick={() => handleSort(col.id)}
                  icon={active ? (order === 'asc' ? <ArrowUpward sx={{ fontSize: '13px !important' }} /> : <ArrowDownward sx={{ fontSize: '13px !important' }} />) : undefined}
                  sx={{
                    bgcolor: active ? '#DC2626' : 'rgba(0,0,0,0.06)',
                    color: active ? 'white' : 'text.secondary',
                    fontWeight: active ? 700 : 500,
                    fontSize: '0.7rem',
                    '& .MuiChip-icon': { color: 'white' },
                  }}
                />
              );
            })}
          </Box>
        )}
        {sortedData.map((row, i) => (
          <MobileCard key={i} row={row} columns={columns} onRowClick={onRowClick} />
        ))}
      </Box>
    );
  }

  /* ── Desktop: table ── */
  return (
    <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
      <Table sx={{ minWidth: 650 }}>
        <TableHead>
          <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
            {columns.map((column) => (
              <TableCell key={column.id} align={column.align || 'left'} style={{ minWidth: column.minWidth }} sx={{ fontWeight: 600 }}>
                {column.sortable !== false ? (
                  <TableSortLabel active={orderBy === column.id} direction={orderBy === column.id ? order : 'asc'} onClick={() => handleSort(column.id)}>
                    {column.label}
                  </TableSortLabel>
                ) : column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedData.map((row, index) => (
            <TableRow
              key={index} hover
              onClick={() => onRowClick?.(row)}
              sx={{
                cursor: onRowClick ? 'pointer' : 'default',
                bgcolor: index % 2 === 1 ? 'rgba(0,0,0,0.018)' : undefined,
                '&:hover': onRowClick ? { bgcolor: 'rgba(220,38,38,0.04) !important' } : {},
              }}
            >
              {columns.map((column) => (
                <TableCell key={column.id} align={column.align || 'left'}>
                  {column.format ? column.format(row[column.id], row) : row[column.id]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
