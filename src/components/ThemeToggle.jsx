/**
 * ThemeToggle.jsx
 * Sun / Moon button that switches dark ↔ light theme.
 */

import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      style={{
        width: 36,
        height: 36,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-surface-2)',
        border: '1px solid var(--border-color)',
        color: theme === 'dark' ? '#f59e0b' : '#6366f1',
        transition: 'all var(--transition-fast)',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.background = 'var(--bg-surface-hover)';
        e.currentTarget.style.transform = 'rotate(15deg)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.background = 'var(--bg-surface-2)';
        e.currentTarget.style.transform = 'rotate(0deg)';
      }}
    >
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
