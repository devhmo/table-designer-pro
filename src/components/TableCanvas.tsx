import { useRef, useState, useEffect, useCallback } from 'react';
import { useTableStore, getCoveredCellKeys } from '../store/tableStore';
import { CellEditor } from './CellEditor';
import { Plus } from 'lucide-react';

export function TableCanvas() {
  const store = useTableStore();
  const table = store.getActiveTable();
  const canvasRef = useRef<HTMLDivElement>(null);
  const colRenameRef = useRef<HTMLInputElement>(null);

  const [resizingCol, setResizingCol] = useState<{ index: number; startX: number; startWidth: number } | null>(null);
  const [resizingRow, setResizingRow] = useState<{ index: number; startY: number; startHeight: number } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; row: number; col: number } | null>(null);
  const [selecting, setSelecting] = useState(false);

  // Drag & drop state
  const [dragType, setDragType] = useState<'row' | 'col' | null>(null);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  // Build covered cell set for merge rendering
  const coveredKeys = table ? getCoveredCellKeys(table) : new Set<string>();

  if (!table) return null;
  const { theme } = table;
  const scale = store.zoom / 100;

  // ── Column Resize ──
  const handleColResizeStart = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingCol({ index, startX: e.clientX, startWidth: table.columns[index].width });
  };

  const handleRowResizeStart = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingRow({ index, startY: e.clientY, startHeight: table.rows[index].height });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (resizingCol) {
        const delta = e.clientX - resizingCol.startX;
        store.resizeColumn(resizingCol.index, resizingCol.startWidth + delta);
      }
      if (resizingRow) {
        const delta = e.clientY - resizingRow.startY;
        store.resizeRow(resizingRow.index, resizingRow.startHeight + delta);
      }
    };
    const handleMouseUp = () => {
      if (resizingCol) { store.pushHistory('Resize column'); setResizingCol(null); }
      if (resizingRow) { store.pushHistory('Resize row'); setResizingRow(null); }
    };
    if (resizingCol || resizingRow) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingCol, resizingRow]);

  // ── Column Rename ──
  useEffect(() => {
    if (store.editingColumnHeader !== null && colRenameRef.current) {
      colRenameRef.current.focus();
      colRenameRef.current.select();
    }
  }, [store.editingColumnHeader]);

  const commitColRename = (index: number, name: string) => {
    if (name.trim()) store.renameColumn(index, name.trim());
    store.setEditingColumnHeader(null);
  };

  // ── Drag & Drop ──
  const handleDragStart = (e: React.DragEvent, type: 'row' | 'col', index: number) => {
    setDragType(type);
    setDragFrom(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `${type}:${index}`);
    // Use a transparent drag image
    const ghost = document.createElement('div');
    ghost.style.opacity = '0';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };

  const handleDragOver = (e: React.DragEvent, type: 'row' | 'col', index: number) => {
    e.preventDefault();
    if (dragType === type) {
      e.dataTransfer.dropEffect = 'move';
      setDragOver(index);
    }
  };

  const handleDrop = (e: React.DragEvent, type: 'row' | 'col', index: number) => {
    e.preventDefault();
    if (dragType === type && dragFrom !== null && dragFrom !== index) {
      if (type === 'row') store.moveRow(dragFrom, index);
      else store.moveColumn(dragFrom, index);
    }
    setDragType(null);
    setDragFrom(null);
    setDragOver(null);
  };

  const handleDragEnd = () => {
    setDragType(null);
    setDragFrom(null);
    setDragOver(null);
  };

  // ── Cell Interactions ──
  const handleCellMouseDown = (rowIdx: number, colIdx: number, e: React.MouseEvent) => {
    if (e.button === 2) return;
    e.stopPropagation();
    store.setEditingColumnHeader(null);

    if (e.shiftKey && store.activeCell) {
      store.setSelection({
        startRow: store.activeCell.row, startCol: store.activeCell.col,
        endRow: rowIdx, endCol: colIdx,
      });
    } else {
      store.setActiveCell({ row: rowIdx, col: colIdx });
      store.setSelection(null);
      store.setEditingCell(null);
      setSelecting(true);
    }
  };

  const handleCellMouseEnter = (rowIdx: number, colIdx: number) => {
    if (selecting && store.activeCell) {
      store.setSelection({
        startRow: store.activeCell.row, startCol: store.activeCell.col,
        endRow: rowIdx, endCol: colIdx,
      });
    }
  };

  useEffect(() => {
    const handleMouseUp = () => setSelecting(false);
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const handleCellDoubleClick = (rowIdx: number, colIdx: number) => {
    const cell = table.cells[`${table.rows[rowIdx].id}:${table.columns[colIdx].id}`];
    if (cell?.locked) return;
    store.setEditingCell({ row: rowIdx, col: colIdx });
  };

  const handleContextMenu = (e: React.MouseEvent, rowIdx: number, colIdx: number) => {
    e.preventDefault();
    e.stopPropagation();
    store.setActiveCell({ row: rowIdx, col: colIdx });
    setContextMenu({ x: e.clientX, y: e.clientY, row: rowIdx, col: colIdx });
  };

  const isSelected = (rowIdx: number, colIdx: number) => {
    const sel = store.selection;
    if (!sel) return false;
    const r1 = Math.min(sel.startRow, sel.endRow);
    const r2 = Math.max(sel.startRow, sel.endRow);
    const c1 = Math.min(sel.startCol, sel.endCol);
    const c2 = Math.max(sel.startCol, sel.endCol);
    return rowIdx >= r1 && rowIdx <= r2 && colIdx >= c1 && colIdx <= c2;
  };

  const isActive = (rowIdx: number, colIdx: number) => {
    return store.activeCell?.row === rowIdx && store.activeCell?.col === colIdx;
  };

  // ── Style Helpers ──
  const getCellStyle = (cell: any): React.CSSProperties => {
    if (!cell) return {};
    const s = cell.style;
    const style: React.CSSProperties = {};
    if (s.fontFamily) style.fontFamily = s.fontFamily;
    if (s.fontSize) style.fontSize = s.fontSize;
    if (s.fontWeight) style.fontWeight = s.fontWeight;
    if (s.italic) style.fontStyle = 'italic';
    if (s.underline && s.strikethrough) style.textDecoration = 'underline line-through';
    else if (s.underline) style.textDecoration = 'underline';
    else if (s.strikethrough) style.textDecoration = 'line-through';
    if (s.textColor) style.color = s.textColor;
    if (s.bgColor) style.backgroundColor = s.bgColor;
    if (s.textAlign) style.textAlign = s.textAlign;
    if (s.verticalAlign) style.verticalAlign = s.verticalAlign;
    if (s.padding) style.padding = s.padding;
    if (s.opacity !== undefined) style.opacity = s.opacity;
    if (s.lineHeight) style.lineHeight = s.lineHeight;
    if (s.letterSpacing) style.letterSpacing = s.letterSpacing;
    if (s.textTransform) style.textTransform = s.textTransform;
    if (s.borderRadius) style.borderRadius = s.borderRadius;
    if (s.boxShadow) style.boxShadow = s.boxShadow;
    if (s.gradient) style.background = s.gradient;
    const bs = (side: any) => side ? `${side.width}px ${side.style} ${side.color}` : undefined;
    if (s.borderTop) style.borderTop = bs(s.borderTop);
    if (s.borderBottom) style.borderBottom = bs(s.borderBottom);
    if (s.borderLeft) style.borderLeft = bs(s.borderLeft);
    if (s.borderRight) style.borderRight = bs(s.borderRight);
    return style;
  };

  const renderCellContent = (cell: any) => {
    if (!cell) return null;
    const { content } = cell;
    switch (content.type) {
      case 'text':
        return content.html ? (
          <span dangerouslySetInnerHTML={{ __html: content.html }} />
        ) : (
          <span>{content.text}</span>
        );
      case 'image':
        return content.src ? (
          <img src={content.src} alt="" className="max-w-full max-h-full object-contain" />
        ) : null;
      case 'link':
        return content.href ? (
          <a href={content.href} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
            {content.text || content.href}
          </a>
        ) : <span>{content.text}</span>;
      case 'badge':
        return (
          <span className="badge" style={{ backgroundColor: content.color || '#3b82f6', color: '#fff' }}>
            {content.label || content.text}
          </span>
        );
      case 'tag':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
            style={{ backgroundColor: (content.color || '#3b82f6') + '20', color: content.color || '#3b82f6' }}>
            {content.label || content.text}
          </span>
        );
      case 'checkbox':
        return (
          <input type="checkbox" checked={content.checked || false} readOnly className="w-4 h-4 rounded" />
        );
      case 'progress':
        return (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="h-2 rounded-full transition-all"
              style={{ width: `${content.value || 0}%`, backgroundColor: content.color || '#3b82f6' }} />
          </div>
        );
      case 'rating':
        const stars = content.value || 0;
        return (
          <span className="text-yellow-400">{'★'.repeat(stars)}{'☆'.repeat(5 - stars)}</span>
        );
      default:
        return <span>{content.text}</span>;
    }
  };

  // ── Context Menu ──
  const handleContextAction = (action: string) => {
    if (!contextMenu) return;
    const { row, col } = contextMenu;
    switch (action) {
      case 'insertRowAbove': store.addRow(row - 1); break;
      case 'insertRowBelow': store.addRow(row); break;
      case 'insertColLeft': store.addColumn(col - 1); break;
      case 'insertColRight': store.addColumn(col); break;
      case 'deleteRow': store.deleteRow(row); break;
      case 'deleteCol': store.deleteColumn(col); break;
      case 'duplicateRow': store.duplicateRow(row); break;
      case 'duplicateCol': store.duplicateColumn(col); break;
      case 'merge': if (store.selection) store.mergeCells(store.selection); break;
      case 'split': store.splitCell(row, col); break;
      case 'lock': store.toggleCellLock(row, col); break;
      case 'copyStyle': store.copyStyle(); break;
      case 'pasteStyle': store.pasteStyle(); break;
    }
    setContextMenu(null);
  };

  return (
    <div
      ref={canvasRef}
      className="table-canvas bg-[var(--surface-1)]"
      onClick={() => { setContextMenu(null); store.setEditingColumnHeader(null); }}
    >
      <div
        className="inline-block min-w-full p-4"
        style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
      >
        <div className="inline-block rounded-lg overflow-hidden shadow-sm border border-[var(--border)]"
          style={{ borderRadius: theme.borderRadius }}
        >
          <table className="border-collapse" style={{ fontFamily: theme.fontFamily, fontSize: theme.fontSize }}>
            {/* Column headers */}
            <thead>
              <tr>
                <th className="sticky top-0 z-20 bg-[var(--surface-2)] border-b border-r border-[var(--border)]"
                  style={{ width: 32, minWidth: 32, height: 28 }}
                  onClick={(e) => { e.stopPropagation(); store.selectAll(); }}>
                  <div className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-[var(--surface-3)]">
                    <div className="w-2 h-2 rounded-sm bg-[var(--text-tertiary)]" />
                  </div>
                </th>
                {table.columns.map((col, ci) => (
                  <th
                    key={col.id}
                    className={`sticky top-0 z-20 text-xs font-medium text-left border-b border-r border-[var(--border)] relative group select-none
                      ${col.frozen ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-[var(--surface-2)]'}
                      ${col.hidden ? 'hidden' : ''}
                      ${dragOver === ci && dragType === 'col' ? 'ring-2 ring-blue-400 ring-inset' : ''}`}
                    style={{ width: col.width, minWidth: col.minWidth, height: 28 }}
                    draggable
                    onDragStart={(e) => handleDragStart(e, 'col', ci)}
                    onDragOver={(e) => handleDragOver(e, 'col', ci)}
                    onDrop={(e) => handleDrop(e, 'col', ci)}
                    onDragEnd={handleDragEnd}
                  >
                    <div
                      className="px-2 h-full flex items-center cursor-pointer hover:bg-[var(--surface-3)]"
                      onClick={() => store.selectColumn(ci)}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        store.setEditingColumnHeader(ci);
                      }}
                    >
                      {store.editingColumnHeader === ci ? (
                        <input
                          ref={colRenameRef}
                          className="input-field !py-0 !px-1 text-xs w-full"
                          defaultValue={col.name}
                          onBlur={(e) => commitColRename(ci, e.currentTarget.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitColRename(ci, e.currentTarget.value);
                            if (e.key === 'Escape') store.setEditingColumnHeader(null);
                            e.stopPropagation();
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <>
                          <span className="text-[var(--text-secondary)]">{col.name}</span>
                          {col.frozen && <SnowflakeIcon />}
                        </>
                      )}
                    </div>
                    <div
                      className={`col-resize-handle absolute right-0 top-0 bottom-0 w-1.5 z-30 ${resizingCol?.index === ci ? 'active' : ''}`}
                      onMouseDown={(e) => handleColResizeStart(e, ci)}
                    />
                  </th>
                ))}
                <th className="sticky top-0 z-20 bg-[var(--surface-2)] border-b border-[var(--border)]" style={{ width: 32, minWidth: 32, height: 28 }}>
                  <button className="toolbar-btn !w-6 !h-6 mx-auto" onClick={() => store.addColumn()} title="Add column">
                    <Plus className="w-3 h-3" />
                  </button>
                </th>
              </tr>
            </thead>

            <tbody>
              {table.rows.map((row, ri) => (
                <tr key={row.id} className={`${row.hidden ? 'hidden' : ''} ${dragOver === ri && dragType === 'row' ? 'ring-2 ring-blue-400 ring-inset' : ''}`}>
                  {/* Row header — drag handle */}
                  <td
                    className={`sticky left-0 z-10 text-xs text-center border-b border-r border-[var(--border)] cursor-grab select-none active:cursor-grabbing
                      ${row.frozen ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-[var(--surface-2)]'}`}
                    style={{ width: 32, minWidth: 32, height: row.height }}
                    draggable
                    onDragStart={(e) => handleDragStart(e, 'row', ri)}
                    onDragOver={(e) => handleDragOver(e, 'row', ri)}
                    onDrop={(e) => handleDrop(e, 'row', ri)}
                    onDragEnd={handleDragEnd}
                    onClick={() => store.selectRow(ri)}
                  >
                    <span className="text-[var(--text-tertiary)]">{ri + 1}</span>
                    {row.frozen && <SnowflakeIcon />}
                  </td>

                  {table.columns.map((col, colIdx) => {
                    if (col.hidden) return null;
                    const cellKey = `${row.id}:${col.id}`;

                    // Skip covered cells (consumed by a merge)
                    if (coveredKeys.has(cellKey)) return null;

                    const cell = table.cells[cellKey];
                    const cellStyle = getCellStyle(cell);
                    const isEditing = store.editingCell?.row === ri && store.editingCell?.col === colIdx;
                    const selected = isSelected(ri, colIdx);
                    const active = isActive(ri, colIdx);

                    return (
                      <td
                        key={col.id}
                        className={`border-b border-r relative
                          ${store.showGrid ? 'border-[var(--border)]' : 'border-transparent'}
                          ${selected && !active ? 'cell-selected' : ''}
                          ${active ? 'cell-active' : ''}
                          ${cell?.locked ? 'bg-gray-50 dark:bg-gray-800/50' : ''}`}
                        style={{
                          height: row.height,
                          width: col.width,
                          minWidth: col.minWidth,
                          background: cell?.style.bgColor || cell?.style.gradient || (ri % 2 === 1 ? theme.alternateRowBg : theme.cellBg),
                          color: theme.cellText,
                          ...cellStyle,
                        }}
                        colSpan={cell?.colspan && cell.colspan > 1 ? cell.colspan : undefined}
                        rowSpan={cell?.rowspan && cell.rowspan > 1 ? cell.rowspan : undefined}
                        onMouseDown={(e) => handleCellMouseDown(ri, colIdx, e)}
                        onMouseEnter={() => handleCellMouseEnter(ri, colIdx)}
                        onDoubleClick={() => handleCellDoubleClick(ri, colIdx)}
                        onContextMenu={(e) => handleContextMenu(e, ri, colIdx)}
                      >
                        {isEditing ? (
                          <CellEditor rowIndex={ri} colIndex={colIdx} cell={cell} />
                        ) : (
                          <div className="px-2 py-1 h-full overflow-hidden text-sm flex items-center"
                            style={{
                              justifyContent: cellStyle.textAlign === 'center' ? 'center' : cellStyle.textAlign === 'right' ? 'flex-end' : 'flex-start',
                              alignItems: cellStyle.verticalAlign === 'top' ? 'flex-start' : cellStyle.verticalAlign === 'bottom' ? 'flex-end' : 'center',
                            }}>
                            {renderCellContent(cell)}
                          </div>
                        )}
                      </td>
                    );
                  })}

                  <td className="border-b border-[var(--border)]" style={{ width: 32, height: row.height }} />
                </tr>
              ))}

              {/* Add row button */}
              <tr>
                <td colSpan={table.columns.length + 2} className="bg-[var(--surface-2)] border-[var(--border)] text-center" style={{ height: 32 }}>
                  <button className="toolbar-btn !w-6 !h-6 mx-auto" onClick={() => store.addRow()} title="Add row">
                    <Plus className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-[var(--surface-0)] border border-[var(--border)] rounded-lg shadow-float p-1 min-w-[180px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="context-menu-item w-full" onClick={() => handleContextAction('insertRowAbove')}>Insert Row Above</button>
          <button className="context-menu-item w-full" onClick={() => handleContextAction('insertRowBelow')}>Insert Row Below</button>
          <button className="context-menu-item w-full" onClick={() => handleContextAction('insertColLeft')}>Insert Column Left</button>
          <button className="context-menu-item w-full" onClick={() => handleContextAction('insertColRight')}>Insert Column Right</button>
          <div className="context-menu-separator" />
          <button className="context-menu-item w-full" onClick={() => handleContextAction('duplicateRow')}>Duplicate Row</button>
          <button className="context-menu-item w-full" onClick={() => handleContextAction('duplicateCol')}>Duplicate Column</button>
          <div className="context-menu-separator" />
          <button className="context-menu-item w-full" onClick={() => handleContextAction('merge')}>Merge Cells</button>
          <button className="context-menu-item w-full" onClick={() => handleContextAction('split')}>Split Cell</button>
          <div className="context-menu-separator" />
          <button className="context-menu-item w-full" onClick={() => handleContextAction('copyStyle')}>Copy Style</button>
          <button className="context-menu-item w-full" onClick={() => handleContextAction('pasteStyle')}>Paste Style</button>
          <button className="context-menu-item w-full" onClick={() => handleContextAction('lock')}>Toggle Lock</button>
          <div className="context-menu-separator" />
          <button className="context-menu-item w-full text-red-500" onClick={() => handleContextAction('deleteRow')}>Delete Row</button>
          <button className="context-menu-item w-full text-red-500" onClick={() => handleContextAction('deleteCol')}>Delete Column</button>
        </div>
      )}
    </div>
  );
}

function SnowflakeIcon() {
  return (
    <svg className="w-2.5 h-2.5 ml-1 text-blue-400 inline" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 0a.5.5 0 0 1 .5.5v5.793l2.146-2.147a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 1 1 .708-.708L7.5 6.293V.5A.5.5 0 0 1 8 0zm-3.354 10.354a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 0 1 .708-.708L4.5 9.293V8a.5.5 0 0 1 1 0v1.293l1.354-1.354a.5.5 0 0 1 .708.708l-2.414 2.414-.146.146z"/>
    </svg>
  );
}
