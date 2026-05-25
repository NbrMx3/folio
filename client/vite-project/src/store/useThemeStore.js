import { create } from 'zustand';

const resolveEffective = (mode) => {
  if (mode === 'dark' || mode === 'light') return mode;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const applyToDOM = (mode) => {
  const effective = resolveEffective(mode);
  document.documentElement.setAttribute('data-theme', effective);
};

const resolveVisualMode = (mode) => {
  const allowed = ['midnight', 'aurora', 'eclipse'];
  return allowed.includes(mode) ? mode : 'midnight';
};

const applyVisualModeToDOM = (mode) => {
  document.documentElement.setAttribute('data-visual-mode', resolveVisualMode(mode));
};

export const useThemeStore = create((set, get) => ({
  theme: localStorage.getItem('theme') || 'default',
  visualMode: localStorage.getItem('visualMode') || 'midnight',

  cycleTheme: () => {
    const current = get().theme;
    const next =
      current === 'default' ? 'dark' : current === 'dark' ? 'light' : 'default';
    localStorage.setItem('theme', next);
    applyToDOM(next);
    set({ theme: next });
  },

  cycleVisualMode: () => {
    const current = resolveVisualMode(get().visualMode);
    const next = current === 'midnight' ? 'aurora' : current === 'aurora' ? 'eclipse' : 'midnight';
    localStorage.setItem('visualMode', next);
    applyVisualModeToDOM(next);
    set({ visualMode: next });
  },

  applyTheme: () => {
    applyToDOM(get().theme);
    applyVisualModeToDOM(get().visualMode);
  },
}));
