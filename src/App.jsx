/**
 * App.jsx
 * Application root — wraps everything in providers and renders Dashboard.
 */

import { Toaster } from 'react-hot-toast';
import { AppProviders } from './context/AppContext';
import { Dashboard }    from './components/Dashboard';
import './styles/global.css';

export default function App() {
  return (
    <AppProviders>
      <Dashboard />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            fontSize: 13,
          },
        }}
      />
    </AppProviders>
  );
}
