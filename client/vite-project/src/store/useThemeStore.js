import { create } from 'zustand';

const resolveEffective = (mode) => {
  if (mode === 'dark' || mode === 'light') return mode;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const applyToDOM = (mode) => {
  const effective = resolveEffective(mode);
  document.documentElement.setAttribute('data-theme', effective);
};

export const useThemeStore = create((set, get) => ({
  theme: localStorage.getItem('theme') || 'default',

  cycleTheme: () => {
    const current = get().theme;
    const next =
      current === 'default' ? 'dark' : current === 'dark' ? 'light' : 'default';
    localStorage.setItem('theme', next);
    applyToDOM(next);
    set({ theme: next });
  },

  applyTheme: () => {
    applyToDOM(get().theme);
  },
}));
