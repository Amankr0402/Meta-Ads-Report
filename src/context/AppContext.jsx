/**
 * AppContext.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Combined context provider that wraps the entire app.
 * Import <AppProviders> in main.jsx and wrap <App />.
 *
 * Provider order (outermost → innermost):
 *   ThemeProvider → FilterProvider
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { ThemeProvider } from './ThemeContext';
import { FilterProvider } from './FilterContext';

export function AppProviders({ children }) {
  return (
    <ThemeProvider>
      <FilterProvider>
        {children}
      </FilterProvider>
    </ThemeProvider>
  );
}
