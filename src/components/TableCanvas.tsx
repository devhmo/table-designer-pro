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

  // Selection drag state
  const [selectStart, setSelectStart] = useState<{ row: number; col: number } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  // Touch state for long-press and double-tap
  const [touchTimer, setTouchTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [lastTap, setLastTap] = useState<{ row: number; col: number; time: number } | null>(null);

  // Drag & drop state
  const [dragType, setDragType] = useState<'row' | 'col' | null>(null);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

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

  const handleColResizeTouchStart = (e: React.TouchEvent, index: number) => {
    e.stopPropagation();
    const touch = e.touches[0];
    setResizingCol({ index, startX: touch.clientX, startWidth: table.columns[index].width });
  };

  const handleRowResizeStart = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingRow({ index, startY: e.clientY, startHeight: table.rows[index].height });
  };

  const handleRowResizeTouchStart = (e: React.TouchEvent, index: number) => {
    e.stopPropagation();
    const touch = e.touches[0];
    setResizingRow({ index, startY: touch.clientY, startHeight: table.rows[index].height });
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
      setResizingCol(null);
      setResizingRow(null);
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (resizingCol) {
        const touch = e.touches[0];
        const delta = touch.clientX - resizingCol.startX;
        store.resizeColumn(resizingCol.index, resizingCol.startWidth + delta);
      }
      if (resizingRow) {
        const touch = e.touches[0];
        const delta = touch.clientY - resizingRow.startY;
        store.resizeRow(resizingRow.index, resizingRow.startHeight + delta);
      }
    };
    const handleTouchEnd = () => {
      setResizingCol(null);
      setResizingRow(null);
    };
    if (resizingCol || resizingRow) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [resizingCol, resizingRow, store]);

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
  const handleCellMouseDown = useCallback((rowIdx: number, colIdx: number, e: React.MouseEvent) => {
    if (e.button === 2) return;
    e.stopPropagation();
    store.setEditingColumnHeader(null);
    setContextMenu(null);

    if (e.shiftKey && store.activeCell) {
      store.setSelection({
        startRow: store.activeCell.row, startCol: store.activeCell.col,
        endRow: rowIdx, endCol: colIdx,
      });
    } else {
      // If clicking the already-active cell, enter edit mode
      if (store.activeCell?.row === rowIdx && store.activeCell?.col === colIdx && !store.editingCell) {
        store.setEditingCell({ row: rowIdx, col: colIdx });
      } else {
        store.setActiveCell({ row: rowIdx, col: colIdx });
        store.setSelection(null);
        store.setEditingCell(null);
      }
      setSelectStart({ row: rowIdx, col: colIdx });
      setIsSelecting(true);
    }
  }, [store]);

  // ── Touch handlers for mobile ──
  const handleCellTouchStart = useCallback((rowIdx: number, colIdx: number, e: React.TouchEvent) => {
    e.stopPropagation();
    store.setEditingColumnHeader(null);
    setContextMenu(null);

    const now = Date.now();

    // Double-tap detection
    if (lastTap && lastTap.row === rowIdx && lastTap.col === colIdx && now - lastTap.time < 350) {
      // Double tap → edit
      const cell = table.cells[`${table.rows[rowIdx].id}:${table.columns[colIdx].id}`];
      if (!cell?.locked) {
        store.setEditingCell({ row: rowIdx, col: colIdx });
      }
      setLastTap(null);
      if (touchTimer) { clearTimeout(touchTimer); setTouchTimer(null); }
      return;
    }

    setLastTap({ row: rowIdx, col: colIdx, time: now });

    // Single tap → select (delayed to check for double-tap)
    const timer = setTimeout(() => {
      store.setActiveCell({ row: rowIdx, col: colIdx });
      store.setSelection(null);
      store.setEditingCell(null);
      setSelectStart({ row: rowIdx, col: colIdx });
      setIsSelecting(true);
    }, 200);
    setTouchTimer(timer);

    // Long-press → context menu
    const longPressTimer = setTimeout(() => {
      store.setActiveCell({ row: rowIdx, col: colIdx });
      const touch = e.touches[0];
      setContextMenu({ x: touch.clientX, y: touch.clientY, row: rowIdx, col: colIdx });
    }, 600);
    setTouchTimer(longPressTimer);
  }, [store, table, lastTap, touchTimer]);

  const handleCellTouchMove = useCallback((rowIdx: number, colIdx: number) => {
    if (isSelecting && selectStart) {
      // Cancel long-press if finger moves
      if (touchTimer) { clearTimeout(touchTimer); setTouchTimer(null); }
      store.setSelection({
        startRow: selectStart.row, startCol: selectStart.col,
        endRow: rowIdx, endCol: colIdx,
      });
    }
  }, [isSelecting, selectStart, store, touchTimer]);

  const handleCellTouchEnd = useCallback(() => {
    setIsSelecting(false);
    setSelectStart(null);
  }, []);

  const handleCellMouseEnter = useCallback((rowIdx: number, colIdx: number) => {
    if (isSelecting && selectStart) {
      store.setSelection({
        startRow: selectStart.row, startCol: selectStart.col,
        endRow: rowIdx, endCol: colIdx,
      });
    }
  }, [isSelecting, selectStart, store]);

  useEffect(() => {
    const handleMouseUp = () => {
      setIsSelecting(false);
      setSelectStart(null);
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const handleCellDoubleClick = useCallback((rowIdx: number, colIdx: number) => {
    const cell = table.cells[`${table.rows[rowIdx].id}:${table.columns[colIdx].id}`];
    if (cell?.locked) return;
    store.setEditingCell({ row: rowIdx, col: colIdx });
  }, [table, store]);

  const handleContextMenu = useCallback((e: React.MouseEvent, rowIdx: number, colIdx: number) => {
    e.preventDefault();
    e.stopPropagation();
    store.setActiveCell({ row: rowIdx, col: colIdx });
    setContextMenu({ x: e.clientX, y: e.clientY, row: rowIdx, col: colIdx });
  }, [store]);

  const isSelected = useCallback((rowIdx: number, colIdx: number) => {
    const sel = store.selection;
    if (!sel) return false;
    const r1 = Math.min(sel.startRow, sel.endRow);
    const r2 = Math.max(sel.startRow, sel.endRow);
    const c1 = Math.min(sel.startCol, sel.endCol);
    const c2 = Math.max(sel.startCol, sel.endCol);
    return rowIdx >= r1 && rowIdx <= r2 && colIdx >= c1 && colIdx <= c2;
  }, [store.selection]);

  const isActive = useCallback((rowIdx: number, colIdx: number) => {
    return store.activeCell?.row === rowIdx && store.activeCell?.col === colIdx;
  }, [store.activeCell]);

  // ── Style Helpers (FIXED: no double background) ──
  const getCellStyle = useCallback((cell: any): React.CSSProperties => {
    if (!cell) return {};
    const s = cell.style;
    const style: React.CSSProperties = {};

    // Background: gradient takes priority, then bgColor
    if (s.gradient) {
      style.background = s.gradient;
    } else if (s.bgColor) {
      style.backgroundColor = s.bgColor;
    }

    if (s.fontFamily) style.fontFamily = s.fontFamily;
    if (s.fontSize) style.fontSize = s.fontSize;
    if (s.fontWeight) style.fontWeight = s.fontWeight;
    if (s.italic) style.fontStyle = 'italic';
    if (s.underline && s.strikethrough) style.textDecoration = 'underline line-through';
    else if (s.underline) style.textDecoration = 'underline';
    else if (s.strikethrough) style.textDecoration = 'line-through';
    if (s.textColor) style.color = s.textColor;
    if (s.textAlign) style.textAlign = s.textAlign;
    if (s.verticalAlign) style.verticalAlign = s.verticalAlign;
    if (s.padding !== undefined) style.padding = s.padding;
    if (s.opacity !== undefined) style.opacity = s.opacity;
    if (s.lineHeight) style.lineHeight = s.lineHeight;
    if (s.letterSpacing) style.letterSpacing = s.letterSpacing;
    if (s.textTransform) style.textTransform = s.textTransform;
    if (s.borderRadius !== undefined) style.borderRadius = s.borderRadius;
    if (s.boxShadow) style.boxShadow = s.boxShadow;

    const bs = (side: any) => side ? `${side.width}px ${side.style} ${side.color}` : undefined;
    if (s.borderTop) style.borderTop = bs(s.borderTop);
    if (s.borderBottom) style.borderBottom = bs(s.borderBottom);
    if (s.borderLeft) style.borderLeft = bs(s.borderLeft);
    if (s.borderRight) style.borderRight = bs(s.borderRight);
    return style;
  }, []);

  // ── Theme-based border style for cells ──
  const getThemeBorder = useCallback((): React.CSSProperties => {
    return {
      borderBottom: `${theme.borderWidth}px ${theme.borderStyle} ${theme.borderColor}`,
      borderRight: `${theme.borderWidth}px ${theme.borderStyle} ${theme.borderColor}`,
    };
  }, [theme]);

  const renderCellContent = useCallback((cell: any) => {
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
          <input type="checkbox" checked={content.checked || false} readOnly className="w-4 h-4 rounded"
            onClick={(e) => e.stopPropagation()} />
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
  }, []);

  // ── Context Menu ──
  const handleContextAction = useCallback((action: string) => {
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
  }, [contextMenu, store]);

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener('click', close);
    window.addEventListener('touchstart', close);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('touchstart', close);
    };
  }, [contextMenu]);

  // ── Context Menu Position (viewport-aware) ──
  const getContextMenuPos = () => {
    if (!contextMenu) return { left: 0, top: 0 };
    const menuW = 200;
    const menuH = 380;
    let x = contextMenu.x;
    let y = contextMenu.y;
    if (x + menuW > window.innerWidth) x = window.innerWidth - menuW - 8;
    if (y + menuH > window.innerHeight) y = window.innerHeight - menuH - 8;
    if (x < 8) x = 8;
    if (y < 8) y = 8;
    return { left: x, top: y };
  };

  const themeBorder = getThemeBorder();

  return (
    <div
      ref={canvasRef}
      className="table-canvas bg-[var(--surface-1)]"
      onClick={(e) => {
        if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('table-canvas')) {
          setContextMenu(null);
          store.setEditingColumnHeader(null);
        }
      }}
    >
      <div
        className="inline-block min-w-full p-4"
        style={{ zoom: `${scale}` }}
      >
        <div className="inline-block rounded-lg overflow-hidden shadow-sm border border-[var(--border)]"
          style={{ borderRadius: theme.borderRadius }}
        >
          <table className="border-collapse" style={{ fontFamily: theme.fontFamily, fontSize: theme.fontSize }}>
            {/* Column headers */}
            <thead>
              <tr>
                <th className="sticky top-0 z-20 bg-[var(--surface-2)]"
                  style={{
                    width: 32, minWidth: 32, height: 28,
                    ...themeBorder,
                  }}
                  onClick={(e) => { e.stopPropagation(); store.selectAll(); }}>
                  <div className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-[var(--surface-3)]">
                    <div className="w-2 h-2 rounded-sm bg-[var(--text-tertiary)]" />
                  </div>
                </th>
                {table.columns.map((col, ci) => (
                  <th
                    key={col.id}
                    className={`sticky top-0 z-20 text-xs font-medium text-left relative group select-none
                      ${col.frozen ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-[var(--surface-2)]'}
                      ${col.hidden ? 'hidden' : ''}
                      ${dragOver === ci && dragType === 'col' ? 'ring-2 ring-blue-400 ring-inset' : ''}`}
                    style={{
                      width: col.width, minWidth: col.minWidth, height: 28,
                      ...themeBorder,
                      borderBottom: `${theme.borderWidth + 1}px ${theme.borderStyle} ${theme.borderColor}`,
                      background: theme.headerBg,
                      color: theme.headerText,
                      fontWeight: theme.headerFontWeight as any,
                    }}
                    draggable
                    onDragStart={(e) => handleDragStart(e, 'col', ci)}
                    onDragOver={(e) => handleDragOver(e, 'col', ci)}
                    onDrop={(e) => handleDrop(e, 'col', ci)}
                    onDragEnd={handleDragEnd}
                  >
                    <div
                      className="px-2 h-full flex items-center cursor-pointer hover:opacity-80"
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
                          <span>{col.name}</span>
                          {col.frozen && <SnowflakeIcon />}
                        </>
                      )}
                    </div>
                    <div
                      className={`col-resize-handle absolute right-0 top-0 bottom-0 w-2 z-30 ${resizingCol?.index === ci ? 'active' : ''}`}
                      onMouseDown={(e) => handleColResizeStart(e, ci)}
                      onTouchStart={(e) => handleColResizeTouchStart(e, ci)}
                    />
                  </th>
                ))}
                <th className="sticky top-0 z-20 bg-[var(--surface-2)]" style={{ width: 32, minWidth: 32, height: 28, ...themeBorder }}>
                  <button className="toolbar-btn !w-6 !h-6 mx-auto" onClick={() => store.addColumn()} title="Add column">
                    <Plus className="w-3 h-3" />
                  </button>
                </th>
              </tr>
            </thead>

            <tbody>
              {table.rows.map((row, ri) => (
                <tr key={row.id} className={`${row.hidden ? 'hidden' : ''} ${dragOver === ri && dragType === 'row' ? 'ring-2 ring-blue-400 ring-inset' : ''}`}>
                  {/* Row header — drag handle + resize */}
                  <td
                    className={`sticky left-0 z-10 text-xs text-center cursor-grab select-none active:cursor-grabbing relative
                      ${row.frozen ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-[var(--surface-2)]'}`}
                    style={{
                      width: 32, minWidth: 32, height: row.height,
                      ...themeBorder,
                    }}
                    draggable
                    onDragStart={(e) => handleDragStart(e, 'row', ri)}
                    onDragOver={(e) => handleDragOver(e, 'row', ri)}
                    onDrop={(e) => handleDrop(e, 'row', ri)}
                    onDragEnd={handleDragEnd}
                    onClick={() => store.selectRow(ri)}
                  >
                    <span className="text-[var(--text-tertiary)]">{ri + 1}</span>
                    {row.frozen && <SnowflakeIcon />}
                    {/* Row resize handle */}
                    <div
                      className={`row-resize-handle absolute bottom-0 left-0 right-0 h-1.5 z-30 ${resizingRow?.index === ri ? 'active' : ''}`}
                      onMouseDown={(e) => handleRowResizeStart(e, ri)}
                      onTouchStart={(e) => handleRowResizeTouchStart(e, ri)}
                    />
                  </td>

                  {table.columns.map((col, colIdx) => {
                    if (col.hidden) return null;
                    const cellKey = `${row.id}:${col.id}`;

                    if (coveredKeys.has(cellKey)) return null;

                    const cell = table.cells[cellKey];
                    const cellStyle = getCellStyle(cell);
                    const isEditing = store.editingCell?.row === ri && store.editingCell?.col === colIdx;
                    const selected = isSelected(ri, colIdx);
                    const active = isActive(ri, colIdx);

                    // Determine background: cell style > theme alternate > theme cell bg
                    let cellBg: string | undefined;
                    if (cell?.style.gradient) {
                      cellBg = undefined; // gradient is in cellStyle
                    } else if (cell?.style.bgColor) {
                      cellBg = undefined; // bgColor is in cellStyle
                    } else {
                      cellBg = ri % 2 === 1 ? theme.alternateRowBg : theme.cellBg;
                    }

                    return (
                      <td
                        key={col.id}
                        className={`relative
                          ${store.showGrid ? '' : 'border-transparent'}
                          ${selected && !active ? 'cell-selected' : ''}
                          ${active ? 'cell-active' : ''}
                          ${cell?.locked ? 'bg-gray-50 dark:bg-gray-800/50' : ''}`}
                        style={{
                          height: row.height,
                          width: col.width,
                          minWidth: col.minWidth,
                          color: theme.cellText,
                          ...(cellBg ? { backgroundColor: cellBg } : {}),
                          ...themeBorder,
                          ...cellStyle,
                        }}
                        colSpan={cell?.colspan && cell.colspan > 1 ? cell.colspan : undefined}
                        rowSpan={cell?.rowspan && cell.rowspan > 1 ? cell.rowspan : undefined}
                        onMouseDown={(e) => handleCellMouseDown(ri, colIdx, e)}
                        onMouseEnter={() => handleCellMouseEnter(ri, colIdx)}
                        onDoubleClick={() => handleCellDoubleClick(ri, colIdx)}
                        onContextMenu={(e) => handleContextMenu(e, ri, colIdx)}
                        onTouchStart={(e) => handleCellTouchStart(ri, colIdx, e)}
                        onTouchMove={() => handleCellTouchMove(ri, colIdx)}
                        onTouchEnd={handleCellTouchEnd}
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

                  <td className="" style={{ width: 32, height: row.height, ...themeBorder }} />
                </tr>
              ))}

              {/* Add row button */}
              <tr>
                <td colSpan={table.columns.length + 2} className="bg-[var(--surface-2)] text-center"
                  style={{ height: 32, ...themeBorder }}>
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
          style={getContextMenuPos()}
          onClick={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
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
