import { create } from 'zustand';

export interface ToastItem {
  id: string;
  type: 'info' | 'success' | 'error' | 'warning';
  title?: string;
  message: string;
}

export type OrganType =
  | 'Heart'
  | 'Brain'
  | 'Lungs'
  | 'Stomach'
  | 'Kidneys'
  | 'Liver'
  | 'Thyroid';

interface UiState {
  theme: 'light' | 'dark';
  toasts: ToastItem[];
  isOnline: boolean;
  selectedOrgan: OrganType;
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
  setIsOnline: (status: boolean) => void;
  setSelectedOrgan: (organ: OrganType) => void;
}

export const useUiStore = create<UiState>((set) => ({
  theme: 'light',
  toasts: [],
  isOnline: navigator.onLine,
  selectedOrgan: 'Heart',

  toggleTheme: () =>
    set((state) => {
      const nextTheme = state.theme === 'light' ? 'dark' : 'light';
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return { theme: nextTheme };
    }),

  setTheme: (theme) => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ theme });
  },

  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    let shouldAdd = true;
    set((state) => {
      // De-duplicate: do not add duplicate toast if one with identical message already exists
      const isDuplicate = state.toasts.some(
        (t) => t.message === toast.message && t.type === toast.type
      );
      if (isDuplicate) {
        shouldAdd = false;
        return state;
      }
      // Maximum 3 visible: keep latest 2 and append new one
      const trimmed = state.toasts.slice(-2);
      return { toasts: [...trimmed, { ...toast, id }] };
    });

    if (shouldAdd) {
      setTimeout(() => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
      }, 4000);
    }
  },

  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  setIsOnline: (isOnline) => set({ isOnline }),

  setSelectedOrgan: (selectedOrgan) => set({ selectedOrgan }),
}));
