import { useState } from 'react';
import { useTableStore } from '../store/tableStore';
import { Plus, MoreVertical, Copy, Trash2, Edit3, Check, X, GripVertical } from 'lucide-react';

export function Sidebar() {
  const { tables, activeTableId, addTable, setActiveTable, removeTable, duplicateTable, renameTable } = useTableStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(null);

  const startRename = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
    setContextMenu(null);
  };

  const commitRename = () => {
    if (editingId && editName.trim()) {
      renameTable(editingId, editName.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="w-56 min-w-[224px] bg-[var(--surface-0)] border-r border-[var(--border)] flex flex-col h-full">
      <div className="p-3 border-b border-[var(--border)]">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Tables</span>
          <button
            onClick={() => addTable()}
            className="toolbar-btn !w-6 !h-6"
            title="New table"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {tables.map((table) => (
          <div
            key={table.id}
            className={`sidebar-item group relative ${activeTableId === table.id ? 'active' : ''}`}
            onClick={() => setActiveTable(table.id)}
          >
            <GripVertical className="w-3.5 h-3.5 opacity-0 group-hover:opacity-40 cursor-grab shrink-0" />
            {editingId === table.id ? (
              <div className="flex-1 flex items-center gap-1">
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename();
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  className="input-field !py-0.5 !px-1 text-xs flex-1"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
                <button onClick={(e) => { e.stopPropagation(); commitRename(); }} className="toolbar-btn !w-5 !h-5">
                  <Check className="w-3 h-3 text-green-600" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); setEditingId(null); }} className="toolbar-btn !w-5 !h-5">
                  <X className="w-3 h-3 text-red-500" />
                </button>
              </div>
            ) : (
              <>
                <span className="flex-1 truncate text-sm">{table.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setContextMenu(contextMenu?.id === table.id ? null : { id: table.id, x: e.clientX, y: e.clientY });
                  }}
                  className="toolbar-btn !w-5 !h-5 opacity-0 group-hover:opacity-100"
                >
                  <MoreVertical className="w-3 h-3" />
                </button>
              </>
            )}

            {contextMenu?.id === table.id && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
                <div
                  className="absolute left-full top-0 ml-1 z-50 bg-[var(--surface-0)] border border-[var(--border)] rounded-lg shadow-float p-1 min-w-[140px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="context-menu-item w-full"
                    onClick={() => startRename(table.id, table.name)}
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Rename
                  </button>
                  <button
                    className="context-menu-item w-full"
                    onClick={() => { duplicateTable(table.id); setContextMenu(null); }}
                  >
                    <Copy className="w-3.5 h-3.5" /> Duplicate
                  </button>
                  <div className="context-menu-separator" />
                  <button
                    className="context-menu-item w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={() => { removeTable(table.id); setContextMenu(null); }}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ))}

        {tables.length === 0 && (
          <div className="text-center py-8 text-[var(--text-tertiary)] text-sm">
            No tables yet
          </div>
        )}
      </div>

      <div className="p-2 border-t border-[var(--border)]">
        <div className="text-[10px] text-[var(--text-tertiary)] text-center">
          {tables.length} table{tables.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}
