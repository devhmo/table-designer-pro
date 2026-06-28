import type { TableData } from '../types';

// ── Helper ──
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getCellText(cell: any): string {
  if (!cell) return '';
  return cell.content.text || '';
}

function getCellPlainText(cell: any): string {
  if (!cell) return '';
  const text = cell.content.text || '';
  // Strip HTML tags if present
  if (cell.content.html) {
    const div = document.createElement('div');
    div.innerHTML = cell.content.html;
    return div.textContent || div.innerText || text;
  }
  return text;
}

// ── CSS Color to RGB array ──
function cssColorToRGB(color: string): [number, number, number] {
  if (!color) return [0, 0, 0];
  // Handle hex
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    if (hex.length === 3) {
      return [
        parseInt(hex[0] + hex[0], 16),
        parseInt(hex[1] + hex[1], 16),
        parseInt(hex[2] + hex[2], 16),
      ];
    }
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
    ];
  }
  // Handle rgb/rgba
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
  }
  // Named colors (common ones)
  const named: Record<string, [number, number, number]> = {
    white: [255, 255, 255], black: [0, 0, 0], red: [255, 0, 0],
    green: [0, 128, 0], blue: [0, 0, 255], yellow: [255, 255, 0],
    gray: [128, 128, 128], grey: [128, 128, 128],
    transparent: [255, 255, 255],
  };
  return named[color.toLowerCase()] || [0, 0, 0];
}

// ── PDF Export (Vector) ──
export async function tableToPDF(table: TableData): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const { theme, columns, rows, cells } = table;
  const visibleCols = columns.filter(c => !c.hidden);
  const visibleRows = rows.filter(r => !r.hidden);

  // Calculate total width to determine orientation
  const totalWidth = visibleCols.reduce((s, c) => s + c.width, 0);
  const orientation = totalWidth > 1000 ? 'landscape' as const : 'portrait' as const;

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  });

  // Title
  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text(table.name, 14, 15);

  // Subtitle
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(`Generated on ${new Date().toLocaleDateString()} • ${visibleRows.length} rows × ${visibleCols.length} columns`, 14, 21);

  // Prepare head
  const head = [visibleCols.map(col => col.name)];

  // Prepare body
  const body = visibleRows.map(row => {
    return visibleCols.map(col => {
      const cell = cells[`${row.id}:${col.id}`];
      return getCellPlainText(cell);
    });
  });

  // Theme colors
  const headerBg = cssColorToRGB(theme.headerBg);
  const headerText = cssColorToRGB(theme.headerText);
  const cellBg = cssColorToRGB(theme.cellBg);
  const cellText = cssColorToRGB(theme.cellText);
  const borderColor = cssColorToRGB(theme.borderColor);
  const altRowBg = cssColorToRGB(theme.alternateRowBg || theme.cellBg);

  // Column styles (proportional widths)
  const pageWidth = doc.internal.pageSize.getWidth() - 28; // margins
  const scaleFactor = pageWidth / (totalWidth / 96 * 25.4); // convert px to mm

  const columnStyles: Record<number, any> = {};
  visibleCols.forEach((col, i) => {
    const widthMm = (col.width / 96 * 25.4) * scaleFactor;
    columnStyles[i] = {
      cellWidth: Math.max(widthMm, 10),
      minCellWidth: 10,
    };
  });

  autoTable(doc, {
    head,
    body,
    startY: 26,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: Math.max(7, Math.min(10, theme.fontSize * 0.8)),
      cellPadding: 3,
      textColor: cellText,
      fillColor: cellBg,
      lineColor: borderColor,
      lineWidth: theme.borderWidth * 0.25, // Convert px to mm roughly
      halign: 'left',
      valign: 'middle',
      overflow: 'ellipsize',
      minCellHeight: 8,
    },
    headStyles: {
      fillColor: headerBg,
      textColor: headerText,
      fontStyle: 'bold',
      fontSize: Math.max(7, Math.min(10, theme.fontSize * 0.8)),
      cellPadding: 4,
      halign: 'left',
      valign: 'middle',
    },
    alternateRowStyles: {
      fillColor: altRowBg,
    },
    columnStyles,
    margin: { left: 14, right: 14 },
    didParseCell: (data) => {
      // Apply cell-specific styles from the table data
      if (data.section === 'body') {
        const row = visibleRows[data.row.index];
        const col = visibleCols[data.column.index];
        if (row && col) {
          const cell = cells[`${row.id}:${col.id}`];
          if (cell?.style) {
            const s = cell.style;
            if (s.textColor) {
              data.cell.styles.textColor = cssColorToRGB(s.textColor);
            }
            if (s.bgColor) {
              data.cell.styles.fillColor = cssColorToRGB(s.bgColor);
            }
            if (s.fontWeight === 'bold' || (s.fontWeight && parseInt(s.fontWeight) >= 700)) {
              data.cell.styles.fontStyle = 'bold';
            }
            if (s.italic) {
              data.cell.styles.fontStyle = data.cell.styles.fontStyle === 'bold' ? 'bolditalic' : 'italic';
            }
            if (s.textAlign) {
              data.cell.styles.halign = s.textAlign;
            }
            if (s.fontSize) {
              data.cell.styles.fontSize = Math.max(6, Math.min(12, s.fontSize * 0.8));
            }
          }
          // Handle special content types
          if (cell?.content.type === 'checkbox') {
            data.cell.text = [cell.content.checked ? '☑ Yes' : '☐ No'];
          }
          if (cell?.content.type === 'progress') {
            const val = cell.content.value || 0;
            data.cell.text = [`${val}%`];
          }
          if (cell?.content.type === 'rating') {
            const stars = cell.content.value || 0;
            data.cell.text = ['★'.repeat(stars) + '☆'.repeat(5 - stars)];
          }
          if (cell?.content.type === 'badge' || cell?.content.type === 'tag') {
            data.cell.text = [cell.content.label || cell.content.text || ''];
          }
        }
      }
    },
    didDrawPage: (data) => {
      // Footer
      const pageCount = doc.getNumberOfPages();
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `${table.name} — Page ${data.pageNumber} of ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        pageHeight - 8,
        { align: 'center' }
      );
    },
  });

  doc.save(`${table.name}.pdf`);
}

// ── CSV Export ──
export function tableToCSV(table: TableData): string {
  const visibleCols = table.columns.filter(c => !c.hidden);
  const header = visibleCols.map(c => `"${c.name}"`).join(',');
  const rows = table.rows.filter(r => !r.hidden).map(row => {
    return visibleCols.map(col => {
      const cell = table.cells[`${row.id}:${col.id}`];
      const text = getCellPlainText(cell).replace(/"/g, '""');
      return `"${text}"`;
    }).join(',');
  });
  return [header, ...rows].join('\n');
}

// ── Markdown Export ──
export function tableToMarkdown(table: TableData): string {
  const visibleCols = table.columns.filter(c => !c.hidden);
  const header = '| ' + visibleCols.map(c => c.name).join(' | ') + ' |';
  const sep = '| ' + visibleCols.map(() => '---').join(' | ') + ' |';
  const rows = table.rows.filter(r => !r.hidden).map(row => {
    return '| ' + visibleCols.map(col => {
      const cell = table.cells[`${row.id}:${col.id}`];
      return getCellPlainText(cell).replace(/\|/g, '\\|');
    }).join(' | ') + ' |';
  });
  return [header, sep, ...rows].join('\n');
}

// ── JSON Export ──
export function tableToJSON(table: TableData): string {
  const visibleCols = table.columns.filter(c => !c.hidden);
  const data = table.rows.filter(r => !r.hidden).map(row => {
    const obj: Record<string, any> = {};
    visibleCols.forEach(col => {
      const cell = table.cells[`${row.id}:${col.id}`];
      obj[col.name] = getCellPlainText(cell);
    });
    return obj;
  });
  return JSON.stringify({ name: table.name, columns: visibleCols.map(c => c.name), data }, null, 2);
}

// ── HTML Export ──
export function tableToHTML(table: TableData): string {
  const { theme } = table;
  let html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>${escapeHtml(table.name)}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(theme.fontFamily)}:wght@300;400;500;600;700&display=swap');
  * { box-sizing: border-box; }
  body { font-family: '${theme.fontFamily}', sans-serif; margin: 40px; background: #f8fafc; color: #1e293b; }
  .container { max-width: 1200px; margin: 0 auto; }
  h2 { font-size: 24px; font-weight: 700; margin-bottom: 4px; color: #0f172a; }
  .meta { font-size: 12px; color: #94a3b8; margin-bottom: 20px; }
  table { border-collapse: separate; border-spacing: 0; border-radius: ${theme.borderRadius}px; overflow: hidden; width: 100%; box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06); }
  th { background: ${theme.headerBg}; color: ${theme.headerText}; font-weight: ${theme.headerFontWeight}; padding: 10px 14px; text-align: left; border-bottom: ${theme.borderWidth}px ${theme.borderStyle} ${theme.borderColor}; font-size: ${theme.fontSize}px; white-space: nowrap; }
  td { padding: 8px 14px; border-bottom: ${theme.borderWidth}px ${theme.borderStyle} ${theme.borderColor}; font-size: ${theme.fontSize}px; color: ${theme.cellText}; background: ${theme.cellBg}; }
  tr:nth-child(even) td { background: ${theme.alternateRowBg || theme.cellBg}; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: rgba(0,0,0,0.02); }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; color: #fff; }
  .tag { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 500; }
  .progress-bar { width: 100%; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden; }
  .progress-fill { height: 100%; border-radius: 3px; transition: width 0.3s; }
  .rating { color: #facc15; letter-spacing: 1px; }
  @media print { body { margin: 20px; } .container { max-width: 100%; } }
</style></head><body>
<div class="container">
<h2>${escapeHtml(table.name)}</h2>
<p class="meta">${table.rows.filter(r => !r.hidden).length} rows × ${table.columns.filter(c => !c.hidden).length} columns • Generated ${new Date().toLocaleDateString()}</p>
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
      if (cs?.underline) styles.push(`text-decoration:underline`);
      if (cs?.strikethrough) styles.push(`text-decoration:line-through`);
      if (cs?.fontSize) styles.push(`font-size:${cs.fontSize}px`);
      if (cs?.fontFamily) styles.push(`font-family:${cs.fontFamily}`);
      if (cs?.padding !== undefined) styles.push(`padding:${cs.padding}px`);
      if (cs?.borderRadius !== undefined) styles.push(`border-radius:${cs.borderRadius}px`);
      if (cs?.opacity !== undefined && cs.opacity < 1) styles.push(`opacity:${cs.opacity}`);
      if (styles.length) attrs.push(`style="${styles.join(';')}"`);

      // Render content based on type
      let content = '';
      if (cell) {
        switch (cell.content.type) {
          case 'text':
            content = cell.content.html || escapeHtml(cell.content.text || '');
            break;
          case 'image':
            content = cell.content.src
              ? `<img src="${cell.content.src}" alt="" style="max-width:100px;max-height:60px;object-fit:contain;">`
              : '';
            break;
          case 'link':
            content = cell.content.href
              ? `<a href="${cell.content.href}" style="color:#3b82f6">${escapeHtml(cell.content.text || cell.content.href)}</a>`
              : escapeHtml(cell.content.text || '');
            break;
          case 'badge':
            content = `<span class="badge" style="background:${cell.content.color || '#3b82f6'}">${escapeHtml(cell.content.label || cell.content.text || '')}</span>`;
            break;
          case 'tag':
            content = `<span class="tag" style="background:${(cell.content.color || '#3b82f6')}20;color:${cell.content.color || '#3b82f6'}">${escapeHtml(cell.content.label || cell.content.text || '')}</span>`;
            break;
          case 'checkbox':
            content = cell.content.checked ? '☑ Yes' : '☐ No';
            break;
          case 'progress':
            const val = cell.content.value || 0;
            content = `<div class="progress-bar"><div class="progress-fill" style="width:${val}%;background:${cell.content.color || '#3b82f6'}"></div></div>`;
            break;
          case 'rating':
            const stars = cell.content.value || 0;
            content = `<span class="rating">${'★'.repeat(stars)}${'☆'.repeat(5 - stars)}</span>`;
            break;
          default:
            content = escapeHtml(cell.content.text || '');
        }
      }

      html += `<td ${attrs.join(' ')}>${content}</td>`;
    }
    html += '</tr>';
  }
  html += '</tbody></table></div></body></html>';
  return html;
}

// ── Excel Export ──
export async function tableToExcel(table: TableData): Promise<void> {
  const XLSX = await import('xlsx');
  const visibleCols = table.columns.filter(c => !c.hidden);
  const data: string[][] = [visibleCols.map(c => c.name)];
  for (const row of table.rows.filter(r => !r.hidden)) {
    const rowData = visibleCols.map(col => {
      const cell = table.cells[`${row.id}:${col.id}`];
      return getCellPlainText(cell);
    });
    data.push(rowData);
  }
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = visibleCols.map(col => ({ wch: Math.max(10, Math.round(col.width / 8)) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, table.name.substring(0, 31));
  XLSX.writeFile(wb, `${table.name}.xlsx`);
}

// ── Image Export ──
export async function tableToImage(table: TableData, format: 'png' | 'jpeg' = 'png'): Promise<void> {
  const html2canvas = (await import('html2canvas')).default;

  // Create a self-contained HTML with inline styles
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

  await new Promise(resolve => setTimeout(resolve, 150));

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

    if (!blob) throw new Error('Failed to create image');

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

// ── SVG Export ──
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

  await new Promise(resolve => setTimeout(resolve, 150));

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

// ── Download helper ──
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
