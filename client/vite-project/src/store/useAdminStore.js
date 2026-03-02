import { create } from 'zustand';
import { getAnalyticsOverview } from '../utils/api';

export const useAdminStore = create((set) => ({
  activeTab: 'analytics',
  overview: null,
  loading: true,

  setActiveTab: (tab) => set({ activeTab: tab }),

  loadOverview: async () => {
    try {
      const data = await getAnalyticsOverview();
      set({ overview: data });
    } catch {
      // overview stays null; caller can redirect on auth failure
    } finally {
      set({ loading: false });
    }
  },

  resetAdmin: () => set({ activeTab: 'analytics', overview: null, loading: true }),
}));
