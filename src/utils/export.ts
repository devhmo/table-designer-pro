import type { TableData } from '../types';

export function tableToHTML(table: TableData): string {
  const { theme } = table;
  let html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>${escapeHtml(table.name)}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(theme.fontFamily)}:wght@300;400;500;600;700&display=swap');
  body { font-family: '${theme.fontFamily}', sans-serif; margin: 20px; background: #f8fafc; }
  table { border-collapse: separate; border-spacing: 0; border-radius: ${theme.borderRadius}px; overflow: hidden; width: 100%; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  th { background: ${theme.headerBg}; color: ${theme.headerText}; font-weight: ${theme.headerFontWeight}; padding: 12px 16px; text-align: left; border-bottom: ${theme.borderWidth}px ${theme.borderStyle} ${theme.borderColor}; font-size: ${theme.fontSize}px; }
  td { padding: 10px 16px; border-bottom: ${theme.borderWidth}px ${theme.borderStyle} ${theme.borderColor}; font-size: ${theme.fontSize}px; color: ${theme.cellText}; background: ${theme.cellBg}; }
  tr:nth-child(even) td { background: ${theme.alternateRowBg || theme.cellBg}; }
  tr:last-child td { border-bottom: none; }
</style></head><body>
<h2 style="font-family:${theme.fontFamily};color:#1e293b;">${escapeHtml(table.name)}</h2>
<table><thead><tr>`;

  for (const col of table.columns) {
    if (!col.hidden) html += `<th>${escapeHtml(col.name)}</th>`;
  }
  html += '</tr></thead><tbody>';
  for (const row of table.rows) {
    if (row.hidden) continue;
    html += '<tr>';
    for (const col of table.columns) {
      if (col.hidden) continue;
      const cell = table.cells[`${row.id}:${col.id}`];
      const text = cell?.content.html || escapeHtml(cell?.content.text || '');
      const attrs: string[] = [];
      if (cell?.colspan && cell.colspan > 1) attrs.push(`colspan="${cell.colspan}"`);
      if (cell?.rowspan && cell.rowspan > 1) attrs.push(`rowspan="${cell.rowspan}"`);
      const styles: string[] = [];
      const cs = cell?.style;
      if (cs?.textAlign) styles.push(`text-align:${cs.textAlign}`);
      if (cs?.textColor) styles.push(`color:${cs.textColor}`);
      if (cs?.bgColor) styles.push(`background:${cs.bgColor}`);
      if (cs?.fontWeight) styles.push(`font-weight:${cs.fontWeight}`);
      if (cs?.italic) styles.push(`font-style:italic`);
      if (cs?.fontSize) styles.push(`font-size:${cs.fontSize}px`);
      if (cs?.fontFamily) styles.push(`font-family:${cs.fontFamily}`);
      if (styles.length) attrs.push(`style="${styles.join(';')}"`);
      html += `<td ${attrs.join(' ')}>${text}</td>`;
    }
    html += '</tr>';
  }
  html += '</tbody></table></body></html>';
  return html;
}

export function tableToCSV(table: TableData): string {
  const visibleCols = table.columns.filter(c => !c.hidden);
  const header = visibleCols.map(c => `"${c.name}"`).join(',');
  const rows = table.rows.filter(r => !r.hidden).map(row => {
    return visibleCols.map(col => {
      const cell = table.cells[`${row.id}:${col.id}`];
      const text = (cell?.content.text || '').replace(/"/g, '""');
      return `"${text}"`;
    }).join(',');
  });
  return [header, ...rows].join('\n');
}

export function tableToMarkdown(table: TableData): string {
  const visibleCols = table.columns.filter(c => !c.hidden);
  const header = '| ' + visibleCols.map(c => c.name).join(' | ') + ' |';
  const sep = '| ' + visibleCols.map(() => '---').join(' | ') + ' |';
  const rows = table.rows.filter(r => !r.hidden).map(row => {
    return '| ' + visibleCols.map(col => {
      const cell = table.cells[`${row.id}:${col.id}`];
      return (cell?.content.text || '').replace(/\|/g, '\\|');
    }).join(' | ') + ' |';
  });
  return [header, sep, ...rows].join('\n');
}

export function tableToJSON(table: TableData): string {
  const visibleCols = table.columns.filter(c => !c.hidden);
  const data = table.rows.filter(r => !r.hidden).map(row => {
    const obj: Record<string, any> = {};
    visibleCols.forEach(col => {
      const cell = table.cells[`${row.id}:${col.id}`];
      obj[col.name] = cell?.content.text || '';
    });
    return obj;
  });
  return JSON.stringify({ name: table.name, data }, null, 2);
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
