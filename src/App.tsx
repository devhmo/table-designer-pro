import { useEffect } from 'react';
import { useTableStore } from './store/tableStore';
import { useKeyboard } from './hooks/useKeyboard';
import { Sidebar } from './components/Sidebar';
import { Toolbar } from './components/Toolbar';
import { TableCanvas } from './components/TableCanvas';
import { StylePanel } from './components/StylePanel';
import { Dashboard } from './components/Dashboard';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  const { isDarkMode, tables, activeTableId, sidebarOpen } = useTableStore();
  useKeyboard();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  // Restore dark mode on mount
  useEffect(() => {
    const stored = useTableStore.getState();
    if (stored.isDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const hasActiveTable = activeTableId && tables.some(t => t.id === activeTableId);

  // If no table is selected, show Dashboard
  if (!hasActiveTable) {
    return (
      <div className="flex flex-col h-screen bg-[var(--surface-1)]">
        <ErrorBoundary>
          <Dashboard />
        </ErrorBoundary>
      </div>
    );
  }

  // Table is selected → show workspace
  return (
    <div className="flex flex-col h-screen bg-[var(--surface-1)]">
      <ErrorBoundary>
        <Toolbar />
      </ErrorBoundary>
      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && (
          <ErrorBoundary>
            <Sidebar />
          </ErrorBoundary>
        )}
        <div className="flex-1 flex overflow-hidden">
          <ErrorBoundary>
            <TableCanvas />
          </ErrorBoundary>
          <ErrorBoundary>
            <StylePanel />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}
