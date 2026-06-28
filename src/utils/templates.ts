import { nanoid } from 'nanoid';
import type { TableData, Cell, ColumnDef, RowDef, TableTheme } from '../types';
import { DEFAULT_THEME } from '../types';
import { THEME_PRESETS } from './themes';

function makeCell(text: string, style: any = {}, contentType: string = 'text', extra: any = {}): Cell {
  return {
    id: nanoid(10),
    content: { type: contentType as any, text, ...extra },
    style,
    colspan: 1,
    rowspan: 1,
    locked: false,
    hidden: false,
  };
}

function buildTemplate(
  name: string,
  themeId: string,
  headers: string[],
  data: (string | { text: string; style?: any; type?: string; extra?: any })[][],
  colWidths?: number[]
): TableData {
  const theme = THEME_PRESETS.find(t => t.id === themeId) || DEFAULT_THEME;
  const columns: ColumnDef[] = headers.map((h, i) => ({
    id: nanoid(10),
    width: colWidths?.[i] || 150,
    minWidth: 40,
    hidden: false,
    frozen: i === 0,
    name: h,
  }));
  const rows: RowDef[] = [];
  const cells: Record<string, Cell> = {};

  data.forEach((rowData, ri) => {
    const row: RowDef = {
      id: nanoid(10),
      height: 40,
      minHeight: 24,
      hidden: false,
      frozen: false,
    };
    rows.push(row);
    rowData.forEach((cellData, ci) => {
      const col = columns[ci];
      if (!col) return;
      if (typeof cellData === 'string') {
        cells[`${row.id}:${col.id}`] = makeCell(cellData);
      } else {
        cells[`${row.id}:${col.id}`] = makeCell(
          cellData.text,
          cellData.style || {},
          cellData.type || 'text',
          cellData.extra || {}
        );
      }
    });
  });

  return {
    id: nanoid(10),
    name,
    columns,
    rows,
    cells,
    theme: { ...theme },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

// ── Header cell style helper ──
const headerStyle = {};
const bold = { fontWeight: 'bold' as const };
const green = { textColor: '#16a34a' };
const red = { textColor: '#dc2626' };
const blue = { textColor: '#2563eb' };
const center = { textAlign: 'center' as const };
const right = { textAlign: 'right' as const };

// ═══════════════════════════════════════════
// TEMPLATES
// ═══════════════════════════════════════════

export const TEMPLATES: { name: string; desc: string; icon: string; builder: () => TableData }[] = [
  // 1. Project Tracker
  {
    name: 'Project Tracker',
    desc: 'Track tasks, status, and deadlines',
    icon: '📋',
    builder: () => buildTemplate('Project Tracker', 'ocean',
      ['#', 'Task', 'Assignee', 'Status', 'Priority', 'Due Date'],
      [
        ['1', 'Design landing page', 'Sarah', { text: '✅ Done', style: green }, { text: '🔴 High', style: red }, '2026-07-01'],
        ['2', 'Setup CI/CD pipeline', 'Ahmed', { text: '🔄 In Progress', style: blue }, { text: '🟡 Medium', style: {} }, '2026-07-05'],
        ['3', 'Write API docs', 'Omar', { text: '⏳ Pending', style: {} }, { text: '🟢 Low', style: green }, '2026-07-10'],
        ['4', 'Database migration', 'Sarah', { text: '🔄 In Progress', style: blue }, { text: '🔴 High', style: red }, '2026-07-03'],
        ['5', 'User testing', 'Lina', { text: '⏳ Pending', style: {} }, { text: '🟡 Medium', style: {} }, '2026-07-15'],
        ['6', 'Performance optimization', 'Ahmed', { text: '⏳ Pending', style: {} }, { text: '🟢 Low', style: green }, '2026-07-20'],
      ],
      [40, 200, 120, 130, 110, 120]
    ),
  },

  // 2. Budget Planner
  {
    name: 'Budget Planner',
    desc: 'Monthly income and expenses',
    icon: '💰',
    builder: () => buildTemplate('Budget Planner', 'forest',
      ['Category', 'Budget', 'Actual', 'Difference', 'Status'],
      [
        [{ text: '💵 Income', style: bold }, '', '', '', ''],
        ['Salary', '$5,000', '$5,000', '$0', { text: '✅ On Track', style: green }],
        ['Freelance', '$1,000', '$1,200', '+$200', { text: '📈 Over', style: green }],
        [{ text: '🏠 Expenses', style: bold }, '', '', '', ''],
        ['Rent', '$1,500', '$1,500', '$0', { text: '✅ On Track', style: green }],
        ['Groceries', '$400', '$450', '-$50', { text: '⚠️ Over', style: red }],
        ['Transport', '$200', '$180', '+$20', { text: '✅ Under', style: green }],
        ['Entertainment', '$150', '$200', '-$50', { text: '⚠️ Over', style: red }],
        ['Utilities', '$120', '$115', '+$5', { text: '✅ Under', style: green }],
        [{ text: '📊 Total', style: { ...bold, bgColor: '#f0fdf4' } }, '$3,370', '$3,445', '-$75', { text: '⚠️ Over Budget', style: red }],
      ],
      [140, 100, 100, 110, 130]
    ),
  },

  // 3. Team Directory
  {
    name: 'Team Directory',
    desc: 'Contact info and roles',
    icon: '👥',
    builder: () => buildTemplate('Team Directory', 'royal',
      ['Name', 'Role', 'Email', 'Phone', 'Department', 'Location'],
      [
        ['Sarah Al-Rashid', 'UI/UX Designer', 'sarah@team.com', '+966 50 123 4567', 'Design', 'Riyadh'],
        ['Ahmed Hassan', 'Full Stack Dev', 'ahmed@team.com', '+966 55 234 5678', 'Engineering', 'Jeddah'],
        ['Omar Khalil', 'Backend Dev', 'omar@team.com', '+966 54 345 6789', 'Engineering', 'Riyadh'],
        ['Lina Mansour', 'Project Manager', 'lina@team.com', '+966 56 456 7890', 'Management', 'Dammam'],
        ['Youssef Ali', 'DevOps Engineer', 'youssef@team.com', '+966 58 567 8901', 'Engineering', 'Riyadh'],
        ['Nora Fahad', 'QA Engineer', 'nora@team.com', '+966 59 678 9012', 'Quality', 'Jeddah'],
      ],
      [150, 140, 180, 150, 110, 100]
    ),
  },

  // 4. Inventory List
  {
    name: 'Inventory List',
    desc: 'Products, quantities, and prices',
    icon: '📦',
    builder: () => buildTemplate('Inventory List', 'sunset',
      ['SKU', 'Product', 'Category', 'Qty', 'Price', 'Total', 'Status'],
      [
        ['SKU-001', 'Wireless Mouse', 'Electronics', '150', '$25.00', '$3,750', { text: '✅ In Stock', style: green }],
        ['SKU-002', 'USB-C Hub', 'Electronics', '75', '$45.00', '$3,375', { text: '✅ In Stock', style: green }],
        ['SKU-003', 'Mechanical Keyboard', 'Electronics', '30', '$89.00', '$2,670', { text: '⚠️ Low Stock', style: { textColor: '#d97706' } }],
        ['SKU-004', 'Monitor Stand', 'Accessories', '200', '$35.00', '$7,000', { text: '✅ In Stock', style: green }],
        ['SKU-005', 'Webcam HD', 'Electronics', '0', '$60.00', '$0', { text: '❌ Out of Stock', style: red }],
        ['SKU-006', 'Desk Lamp', 'Accessories', '85', '$28.00', '$2,380', { text: '✅ In Stock', style: green }],
        ['SKU-007', 'Cable Organizer', 'Accessories', '300', '$12.00', '$3,600', { text: '✅ In Stock', style: green }],
      ],
      [90, 160, 110, 60, 80, 80, 130]
    ),
  },

  // 5. Grade Book
  {
    name: 'Grade Book',
    desc: 'Student grades and assignments',
    icon: '📚',
    builder: () => buildTemplate('Grade Book', 'elegant',
      ['Student', 'HW 1', 'HW 2', 'Midterm', 'Project', 'Final', 'Total', 'Grade'],
      [
        ['Ali Mohammed', '92', '88', '85', '95', '90', '90', { text: 'A', style: { ...bold, ...green, ...center } }],
        ['Fatima Hassan', '95', '91', '90', '88', '93', '91', { text: 'A', style: { ...bold, ...green, ...center } }],
        ['Khalid Omar', '78', '82', '75', '80', '70', '77', { text: 'C+', style: { ...bold, textColor: '#d97706', ...center } }],
        ['Mona Saeed', '88', '85', '82', '90', '85', '86', { text: 'B+', style: { ...bold, ...blue, ...center } }],
        ['Hassan Ali', '95', '98', '92', '97', '96', '96', { text: 'A+', style: { ...bold, ...green, ...center } }],
        ['Sara Nasser', '70', '65', '68', '72', '60', '67', { text: 'D+', style: { ...bold, ...red, ...center } }],
      ],
      [130, 60, 60, 80, 80, 60, 70, 70]
    ),
  },

  // 6. Comparison Chart
  {
    name: 'Feature Comparison',
    desc: 'Compare features across products',
    icon: '⚖️',
    builder: () => buildTemplate('Feature Comparison', 'midnight',
      ['Feature', 'Our Product', 'Competitor A', 'Competitor B'],
      [
        ['Price', { text: '$29/mo', style: green }, '$49/mo', '$39/mo'],
        ['Users', { text: 'Unlimited', style: green }, '10 users', '50 users'],
        ['Storage', { text: '100GB', style: green }, '50GB', '25GB'],
        ['API Access', { text: '✅ Yes', style: green }, { text: '✅ Yes', style: green }, { text: '❌ No', style: red }],
        ['24/7 Support', { text: '✅ Yes', style: green }, { text: '❌ No', style: red }, { text: '✅ Yes', style: green }],
        ['Custom Domain', { text: '✅ Yes', style: green }, { text: '✅ Yes', style: green }, { text: '❌ No', style: red }],
        ['Analytics', { text: 'Advanced', style: green }, 'Basic', 'Advanced'],
        ['Integrations', { text: '50+', style: green }, '20+', '30+'],
      ],
      [150, 130, 130, 130]
    ),
  },

  // 7. Meeting Schedule
  {
    name: 'Meeting Schedule',
    desc: 'Weekly meeting planner',
    icon: '📅',
    builder: () => buildTemplate('Weekly Meeting Schedule', 'ocean',
      ['Time', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      [
        ['9:00 AM', { text: 'Team Standup', style: { bgColor: '#dbeafe' } }, '', { text: 'Team Standup', style: { bgColor: '#dbeafe' } }, '', { text: 'Team Standup', style: { bgColor: '#dbeafe' } }],
        ['10:00 AM', { text: 'Design Review', style: { bgColor: '#fce7f3' } }, { text: 'Sprint Planning', style: { bgColor: '#d1fae5' } }, '', '', { text: 'Demo Day', style: { bgColor: '#fef3c7' } }],
        ['11:00 AM', '', { text: 'Client Call', style: { bgColor: '#fef3c7' } }, '', { text: 'Code Review', style: { bgColor: '#e0e7ff' } }, ''],
        ['1:00 PM', 'Lunch', 'Lunch', 'Lunch', 'Lunch', 'Lunch'],
        ['2:00 PM', { text: '1:1 with Manager', style: { bgColor: '#fce7f3' } }, '', { text: 'Architecture Meeting', style: { bgColor: '#d1fae5' } }, '', ''],
        ['3:00 PM', '', { text: 'QA Review', style: { bgColor: '#e0e7ff' } }, '', { text: 'Retrospective', style: { bgColor: '#fef3c7' } }, ''],
        ['4:00 PM', '', '', { text: 'Knowledge Share', style: { bgColor: '#d1fae5' } }, '', 'Early Leave 🎉'],
      ],
      [100, 140, 140, 160, 140, 120]
    ),
  },

  // 8. Expense Tracker
  {
    name: 'Expense Tracker',
    desc: 'Daily expense logging',
    icon: '🧾',
    builder: () => buildTemplate('Expense Tracker', 'rose',
      ['Date', 'Description', 'Category', 'Amount', 'Payment', 'Notes'],
      [
        ['2026-06-01', 'Grocery shopping', '🍕 Food', '$85.50', '💳 Card', 'Weekly groceries'],
        ['2026-06-02', 'Gas station', '⛽ Transport', '$45.00', '💳 Card', 'Full tank'],
        ['2026-06-03', 'Netflix subscription', '🎬 Entertainment', '$15.99', '🔄 Auto', 'Monthly'],
        ['2026-06-04', 'Electric bill', '💡 Utilities', '$120.00', '🏦 Bank', 'June bill'],
        ['2026-06-05', 'Restaurant dinner', '🍕 Food', '$62.00', '💳 Card', 'Family dinner'],
        ['2026-06-06', 'Uber ride', '⛽ Transport', '$18.50', '📱 App', 'Airport'],
        ['2026-06-07', 'Amazon order', '🛒 Shopping', '$34.99', '💳 Card', 'Phone case'],
        [{ text: 'TOTAL', style: bold }, '', '', { text: '$381.98', style: bold }, '', ''],
      ],
      [110, 160, 130, 90, 100, 130]
    ),
  },

  // 9. Workout Tracker
  {
    name: 'Workout Tracker',
    desc: 'Track your fitness progress',
    icon: '💪',
    builder: () => buildTemplate('Workout Tracker', 'forest',
      ['Exercise', 'Sets', 'Reps', 'Weight', 'Rest', 'Notes'],
      [
        [{ text: '🏋️ Chest', style: bold }, '', '', '', '', ''],
        ['Bench Press', '4', '10', '80 kg', '90s', 'Increase next week'],
        ['Incline Dumbbell', '3', '12', '30 kg', '60s', ''],
        ['Cable Fly', '3', '15', '15 kg', '45s', 'Focus on squeeze'],
        [{ text: '💪 Back', style: bold }, '', '', '', '', ''],
        ['Deadlift', '4', '8', '100 kg', '120s', 'New PR!'],
        ['Lat Pulldown', '3', '12', '60 kg', '60s', ''],
        ['Barbell Row', '3', '10', '70 kg', '90s', ''],
        [{ text: '🦵 Legs', style: bold }, '', '', '', '', ''],
        ['Squat', '4', '8', '100 kg', '120s', 'Go deeper'],
        ['Leg Press', '3', '12', '150 kg', '90s', ''],
      ],
      [150, 60, 60, 80, 60, 150]
    ),
  },

  // 10. Travel Itinerary
  {
    name: 'Travel Itinerary',
    desc: 'Plan your trip day by day',
    icon: '✈️',
    builder: () => buildTemplate('Travel Itinerary - Tokyo Trip', 'sunset',
      ['Day', 'Time', 'Activity', 'Location', 'Cost', 'Notes'],
      [
        [{ text: '🛬 Day 1 - Arrival', style: { ...bold, bgColor: '#fff7ed' } }, '', '', '', '', ''],
        ['Day 1', '14:00', 'Arrive at Narita Airport', 'Narita', '—', 'Flight XY123'],
        ['Day 1', '16:00', 'Check-in Hotel', 'Shinjuku', '$120', 'Hotel Gracery'],
        ['Day 1', '19:00', 'Dinner at Ramen Street', 'Tokyo Station', '$15', ''],
        [{ text: '🏯 Day 2 - Sightseeing', style: { ...bold, bgColor: '#fff7ed' } }, '', '', '', '', ''],
        ['Day 2', '09:00', 'Senso-ji Temple', 'Asakusa', 'Free', 'Arrive early'],
        ['Day 2', '12:00', 'Lunch at Sushi Dai', 'Tsukiji', '$40', 'Expect queue'],
        ['Day 2', '15:00', 'Meiji Shrine', 'Harajuku', 'Free', ''],
        ['Day 2', '18:00', 'Shibuya Crossing', 'Shibuya', 'Free', '📸 Photo spot'],
        [{ text: '🎡 Day 3 - Fun', style: { ...bold, bgColor: '#fff7ed' } }, '', '', '', '', ''],
        ['Day 3', '09:00', 'DisneySea', 'Urayasu', '$75', 'Full day'],
        ['Day 3', '20:00', 'Return to Hotel', 'Shinjuku', '—', 'Exhausted! 😴'],
      ],
      [80, 70, 180, 110, 70, 130]
    ),
  },
];
