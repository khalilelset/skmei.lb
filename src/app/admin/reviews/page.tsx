'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Avatar,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
} from '@mui/icons-material';
import DataTable, { Column } from '@/components/admin/DataTable';
import TableSkeleton from '@/components/admin/TableSkeleton';
import { formatDate } from '@/lib/utils';

interface Review {
  id: string;
  customer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
  products: { id: string; name: string; slug: string } | null;
}

// ─── Star display ─────────────────────────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
      {[1, 2, 3, 4, 5].map((s) =>
        s <= rating
          ? <StarIcon key={s} sx={{ fontSize: 16, color: '#F59E0B' }} />
          : <StarBorderIcon key={s} sx={{ fontSize: 16, color: '#D1D5DB' }} />
      )}
      <Typography variant="caption" sx={{ ml: 0.5, color: 'text.secondary' }}>
        {rating}/5
      </Typography>
    </Box>
  );
}

// ─── Rating filter chips ──────────────────────────────────────────────────────
const STAR_COLORS: Record<number, string> = {
  5: '#16a34a', 4: '#65a30d', 3: '#ca8a04', 2: '#ea580c', 1: '#dc2626',
};

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    fetch('/api/admin/reviews')
      .then((r) => r.json())
      .then((d) => { setReviews(d.reviews ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(
    () => filterRating ? reviews.filter((r) => r.rating === filterRating) : reviews,
    [reviews, filterRating]
  );

  // Count per star
  const starCounts = useMemo(() => {
    const m: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => { m[r.rating] = (m[r.rating] ?? 0) + 1; });
    return m;
  }, [reviews]);

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '—';

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    await fetch(`/api/admin/reviews/${deleteId}`, { method: 'DELETE' });
    setReviews((prev) => prev.filter((r) => r.id !== deleteId));
    setDeleteId(null);
    setIsDeleting(false);
  };

  const columns: Column[] = [
    {
      id: 'customer_name',
      label: 'Customer',
      format: (_v, r: Review) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: '#DC2626', fontSize: 13 }}>
            {r.customer_name[0]?.toUpperCase()}
          </Avatar>
          <Typography variant="body2" fontWeight={500}>{r.customer_name}</Typography>
        </Box>
      ),
    },
    {
      id: 'products',
      label: 'Product',
      format: (_v, r: Review) => (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 200 }} noWrap>
          {r.products?.name ?? '—'}
        </Typography>
      ),
    },
    {
      id: 'rating',
      label: 'Rating',
      format: (_v, r: Review) => <Stars rating={r.rating} />,
    },
    {
      id: 'comment',
      label: 'Comment',
      format: (_v, r: Review) =>
        r.comment
          ? <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{r.comment}</Typography>
          : <Typography variant="caption" color="text.disabled" fontStyle="italic">No comment</Typography>,
    },
    {
      id: 'created_at',
      label: 'Date',
      format: (_v, r: Review) => (
        <Typography variant="caption" color="text.secondary">{formatDate(r.created_at)}</Typography>
      ),
    },
    {
      id: 'actions',
      label: '',
      format: (_v, r: Review) => (
        <Tooltip title="Delete review">
          <IconButton size="small" onClick={() => setDeleteId(r.id)} sx={{ color: 'error.main' }}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>Product Reviews</Typography>

      {/* ── Summary Cards ──────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Paper sx={{ p: 2, borderRadius: 3, minWidth: 120, textAlign: 'center' }}>
          <Typography variant="h4" fontWeight={800} sx={{ color: '#F59E0B' }}>{avgRating}</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 0.5 }}>
            {[1,2,3,4,5].map((s) => (
              <StarIcon key={s} sx={{ fontSize: 14, color: Number(avgRating) >= s ? '#F59E0B' : '#D1D5DB' }} />
            ))}
          </Box>
          <Typography variant="caption" color="text.secondary">{reviews.length} reviews</Typography>
        </Paper>

        {[5,4,3,2,1].map((star) => (
          <Paper
            key={star}
            onClick={() => setFilterRating(filterRating === star ? null : star)}
            sx={{
              p: 2, borderRadius: 3, minWidth: 80, textAlign: 'center', cursor: 'pointer',
              border: filterRating === star ? `2px solid ${STAR_COLORS[star]}` : '2px solid transparent',
              '&:hover': { borderColor: STAR_COLORS[star] },
              transition: 'border-color 0.15s',
            }}
          >
            <Typography variant="h5" fontWeight={700} sx={{ color: STAR_COLORS[star] }}>
              {starCounts[star] ?? 0}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.5 }}>
              {Array.from({ length: star }).map((_, i) => (
                <StarIcon key={i} sx={{ fontSize: 12, color: '#F59E0B' }} />
              ))}
            </Box>
            <Typography variant="caption" color="text.secondary">
              {star} star{star > 1 ? 's' : ''}
            </Typography>
          </Paper>
        ))}

        {filterRating && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Chip
              label={`Filtering: ${filterRating} ★`}
              onDelete={() => setFilterRating(null)}
              size="small"
              sx={{ bgcolor: STAR_COLORS[filterRating], color: '#fff', '& .MuiChip-deleteIcon': { color: 'rgba(255,255,255,0.7)' } }}
            />
          </Box>
        )}
      </Box>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      {loading ? (
        <TableSkeleton rows={8} columns={6} />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          emptyMessage={filterRating ? `No ${filterRating}-star reviews` : 'No reviews yet'}
        />
      )}

      {/* ── Delete Confirm ─────────────────────────────────────────────────── */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderTop: '3px solid #DC2626' } }}>
        <DialogTitle>Delete Review?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This will permanently remove the review and recalculate the product rating.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)} disabled={isDeleting}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={isDeleting}>
            {isDeleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
