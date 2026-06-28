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
      if (cs?.padding) styles.push(`padding:${cs.padding}px`);
      if (cs?.borderRadius) styles.push(`border-radius:${cs.borderRadius}px`);
      if (cs?.opacity !== undefined && cs.opacity < 1) styles.push(`opacity:${cs.opacity}`);
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

export async function tableToExcel(table: TableData): Promise<void> {
  const XLSX = await import('xlsx');
  const visibleCols = table.columns.filter(c => !c.hidden);
  const data: string[][] = [visibleCols.map(c => c.name)];
  for (const row of table.rows.filter(r => !r.hidden)) {
    const rowData = visibleCols.map(col => {
      const cell = table.cells[`${row.id}:${col.id}`];
      return cell?.content.text || '';
    });
    data.push(rowData);
  }
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = visibleCols.map(col => ({ wch: Math.max(10, Math.round(col.width / 8)) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, table.name.substring(0, 31));
  XLSX.writeFile(wb, `${table.name}.xlsx`);
}

export async function tableToImage(table: TableData, format: 'png' | 'jpeg' = 'png'): Promise<void> {
  const html2canvas = (await import('html2canvas')).default;

  // Create a self-contained HTML with inline styles (no CSS variables)
  const container = document.createElement('div');
  container.innerHTML = tableToHTML(table);
  container.style.position = 'fixed';
  container.style.left = '-99999px';
  container.style.top = '0';
  container.style.width = '1400px';
  container.style.padding = '20px';
  container.style.background = '#f8fafc';
  container.style.fontFamily = table.theme.fontFamily;
  document.body.appendChild(container);

  // Wait for fonts and layout
  await new Promise(resolve => setTimeout(resolve, 100));

  try {
    const target = container.querySelector('table') || container;
    const canvas = await html2canvas(target as HTMLElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#f8fafc',
      logging: false,
    });

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, `image/${format}`, format === 'jpeg' ? 0.92 : undefined);
    });

    if (!blob) throw new Error('Failed to create image blob');

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${table.name}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } finally {
    document.body.removeChild(container);
  }
}

export async function tableToSVG(table: TableData): Promise<void> {
  const html2canvas = (await import('html2canvas')).default;

  const container = document.createElement('div');
  container.innerHTML = tableToHTML(table);
  container.style.position = 'fixed';
  container.style.left = '-99999px';
  container.style.top = '0';
  container.style.width = '1400px';
  container.style.padding = '20px';
  container.style.background = '#f8fafc';
  document.body.appendChild(container);

  await new Promise(resolve => setTimeout(resolve, 100));

  try {
    const target = container.querySelector('table') || container;
    const canvas = await html2canvas(target as HTMLElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#f8fafc',
      logging: false,
    });

    const dataUrl = canvas.toDataURL('image/png');
    const width = canvas.width;
    const height = canvas.height;

    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
  width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <image width="${width}" height="${height}" xlink:href="${dataUrl}"/>
</svg>`;

    downloadFile(svgContent, `${table.name}.svg`, 'image/svg+xml');
  } finally {
    document.body.removeChild(container);
  }
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
