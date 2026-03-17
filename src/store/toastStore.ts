import { create } from 'zustand';

export interface CartToastData {
  id: string;
  productName: string;
  productImage: string;
  productPrice: number;
  quantity: number;
}

interface ToastState {
  toasts: CartToastData[];
  show: (data: Omit<CartToastData, 'id'>) => void;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  show: (data) => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts.slice(-2), { ...data, id }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 3500);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
