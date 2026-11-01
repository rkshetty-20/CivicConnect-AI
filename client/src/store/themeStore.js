// src/store/themeStore.js
import create from 'zustand';

/**
 * Theme store using Zustand.
 * Stores the current theme ("light" or "dark") and provides a toggle.
 */
const useThemeStore = create((set) => ({
  theme: 'light',
  toggleTheme: () =>
    set((state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      // Update data-theme attribute on html element for CSS variables
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', newTheme);
      }
      return { theme: newTheme };
    }),
}));

export default useThemeStore;
