import { useEffect } from 'react';
import { useTableStore } from './store/tableStore';
import { useKeyboard } from './hooks/useKeyboard';
import { Sidebar } from './components/Sidebar';
import { Toolbar } from './components/Toolbar';
import { TableCanvas } from './components/TableCanvas';
import { StylePanel } from './components/StylePanel';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  const { isDarkMode, tables, activeTableId, sidebarOpen } = useTableStore();
  useKeyboard();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  // Auto-create first table if no tables exist (fresh start or empty state)
  useEffect(() => {
    if (tables.length === 0) {
      useTableStore.getState().addTable('My First Table');
    }
  }, []);

  const hasActiveTable = activeTableId && tables.some(t => t.id === activeTableId);

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
            {hasActiveTable ? <TableCanvas /> : <WelcomeScreen />}
          </ErrorBoundary>
          {hasActiveTable && (
            <ErrorBoundary>
              <StylePanel />
            </ErrorBoundary>
          )}
        </div>
      </div>
    </div>
  );
}
