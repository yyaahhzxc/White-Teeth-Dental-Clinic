import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Grid, Button, Paper, Collapse, FormControl, Select, MenuItem, useTheme } from '@mui/material';
import AddExpenseDialog from './add-expense';
import { ArrowDropDown } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:3001';

// Local components
import Header from '../components/header';
import QuickActionButton from '../components/QuickActionButton';
import AddPatientRecord from './add-record';
import AddService from './add-service';
import AddPackage from './add-package';
import DataTable from '../components/DataTable';
import SearchBar from '../components/SearchBar';
import { FilterButton, FilterContent } from '../components/FilterComponent';
import SortableHeader, { sortData } from '../components/SortableHeader';
import Pagination from '../components/Pagination';

// Placeholder for the main data container (mimics the style of your DataTable's outer box)
const DashboardContainer = ({ children }) => (
  <Box
    sx={{
      flexGrow: 1,
      zIndex: 1,
      backgroundColor: (theme) => theme.palette.mode === 'dark' ? theme.palette.background.paper : 'white',
      borderRadius: '20px',
      boxShadow: (theme) => theme.palette.mode === 'dark' ? 'none' : '0 -4px 10px rgba(0, 0, 0, 0.1)',
      mt: 2, // Space from the title
      overflow: 'hidden',
      p: 3,
      width: '95.3%',
      alignSelf: 'center',
    }}
  >
    {children}
  </Box>
);

// --- Dashboard Sub-Components (as provided in the previous response) ---

// Simple SVG Pie + legend helper (no external deps)
const formatCurrency = (n) => `Php ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Format a date value as "MonthName DD, YYYY" (e.g. November 16, 2025)
const formatLongDate = (value) => {
  if (!value && value !== 0) return '';
  try {
    // If value is already a Date, use it directly
    if (value instanceof Date) {
      if (isNaN(value.getTime())) return String(value);
      return value.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    }

    // If value is a YYYY-MM-DD string, construct a local Date to avoid UTC shift
    const isoDateOnly = String(value).match(/^\d{4}-\d{2}-\d{2}$/);
    if (isoDateOnly) {
      const [y, m, d] = String(value).split('-').map(Number);
      const local = new Date(y, m - 1, d);
      if (isNaN(local.getTime())) return String(value);
      return local.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    }

    // Fallback: let Date parse other ISO strings (with time) or other formats
    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) return String(value);
    return parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  } catch (e) {
    return String(value);
  }
};

// Helper: produce a YYYY-MM-DD key for a value (Date or string), using local date
const toDateKey = (value) => {
  if (!value && value !== 0) return null;
  if (value instanceof Date) {
    const d = value;
    if (isNaN(d.getTime())) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  const s = String(value);
  const isoOnly = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoOnly) return `${isoOnly[1]}-${isoOnly[2]}-${isoOnly[3]}`;
  const parsed = new Date(s);
  if (isNaN(parsed.getTime())) return null;
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const todayKey = (() => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
})();

const computeServiceBreakdown = (aggregatedArray) => {
  // Fixed service list and colors (easy to replace with backend values later)
  const services = ['Cleaning', 'Filling', 'Extraction', 'Whitening', 'Consultation'];
  const colors = ['#4caf50', '#2196f3', '#ff9800', '#9c27b0', '#f44336'];

  const total = (aggregatedArray || []).reduce((s, r) => s + (r.revenueNumber || 0), 0);

  // If no data, return sample placeholders
  if (!total) {
    const sample = [5000, 3000, 1500, 800, 700];
    const sampleTotal = sample.reduce((s, v) => s + v, 0);
    return services.map((name, i) => ({ name, value: sample[i], color: colors[i % colors.length], percent: sample[i] / sampleTotal }));
  }

  // Distribute total by fixed weights (deterministic, backend can replace)
  const weights = [0.3, 0.25, 0.2, 0.15, 0.1];
  return services.map((name, i) => {
    const value = Math.round(total * weights[i]);
    return { name, value, color: colors[i % colors.length], percent: value / total };
  });
};

// Minimal SVG pie renderer with highlight effect
function PieSVG({ data = [], size = 150, centerLabelMain = '', centerLabelSub = '' }) {
  const [hoveredIndex, setHoveredIndex] = React.useState(null);
  const [tooltipPos, setTooltipPos] = React.useState({ x: 0, y: 0 });
  const theme = useTheme();
  const radius = size / 2 - 4;
  const center = size / 2;
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let startAngle = -90; // start at top

  const segments = data.map((d, index) => {
    const angle = (d.value / total) * 360;
    const endAngle = startAngle + angle;
    const largeArc = angle > 180 ? 1 : 0;
    // compute start and end points using startAngle -> endAngle order
    const start = polarToCartesian(center, center, radius, startAngle);
    const end = polarToCartesian(center, center, radius, endAngle);
    // use sweep-flag = 1 to draw the arc clockwise from start to end
    const sweep = 1;
    const path = [`M ${center} ${center}`, `L ${start.x} ${start.y}`, `A ${radius} ${radius} 0 ${largeArc} ${sweep} ${end.x} ${end.y}`, 'Z'].join(' ');
    
    startAngle = endAngle;
    return { path, color: d.color, value: d.value, name: d.name, index, percent: d.percent };
  });

  const handleMouseMove = (e, index) => {
    const rect = e.currentTarget.ownerSVGElement.getBoundingClientRect();
    setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setHoveredIndex(index);
  };

  return (
    <Box sx={{ position: 'relative', display: 'inline-block' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ cursor: 'pointer', display: 'block' }}>
        {segments.map((s, i) => (
          <path 
            key={i} 
            d={s.path} 
            fill={s.color} 
            stroke="#ffffff" 
            strokeWidth="1"
            onMouseMove={(e) => handleMouseMove(e, i)}
            onMouseLeave={() => setHoveredIndex(null)}
            style={{ 
              transition: 'all 0.2s ease',
              filter: hoveredIndex === i ? 'brightness(1.1)' : 'none'
            }}
          />
        ))}
      </svg>
      
      {/* Tooltip */}
      {hoveredIndex !== null && (
        <Box
          sx={{
            position: 'absolute',
            left: tooltipPos.x,
            top: tooltipPos.y,
            transform: 'translate(-50%, -120%)',
            bgcolor: 'rgba(0, 0, 0, 0.85)',
            color: 'white',
            px: 1.5,
            py: 1,
            borderRadius: 1,
            fontSize: '13px',
            fontWeight: 500,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            zIndex: 1000,
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
          }}
        >
          <Box sx={{ fontWeight: 600, mb: 0.5 }}>{segments[hoveredIndex].name}</Box>
          <Box sx={{ fontSize: '12px' }}>
            {formatCurrency(segments[hoveredIndex].value)} ({(segments[hoveredIndex].percent * 100).toFixed(1)}%)
          </Box>
        </Box>
      )}
    </Box>
  );
}

function polarToCartesian(cx, cy, r, angleDeg) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180.0;
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

// Placeholder Data for the table
const revenueData = [
  { date: 'October 30, 2025', revenue: 'Php 20,500.00' },
  { date: 'October 29, 2025', revenue: 'Php 500.00' },
  { date: 'October 28, 2025', revenue: 'Php 10,250.00' },
  { date: 'October 27, 2025', revenue: 'Php 50,000.00' },
  { date: 'October 26, 2025', revenue: 'Php 100,000.00' },
];

// Initial expense data (row-level, includes category and expense name)
const initialExpenseData = [
  { date: '2025-10-30', expense: 'Clinic Supplies', category: 'Supplies', amountNumber: 2500, amount: 'Php 2,500.00' },
  { date: '2025-10-29', expense: 'Electricity Bill', category: 'Utilities', amountNumber: 1200, amount: 'Php 1,200.00' },
  { date: '2025-10-01', expense: 'Office Rent', category: 'Rent', amountNumber: 5000, amount: 'Php 5,000.00' },
  { date: '2025-09-15', expense: 'Staff Salary', category: 'Payroll', amountNumber: 800, amount: 'Php 800.00' },
];

// SalesDashboardContent removed in favor of building the DataTable inside SalesDashboard

// --- Main SalesDashboard Component ---
function SalesDashboard() {
  const navigate = useNavigate();

  // State for modals (kept for consistency with ServiceList.jsx)
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  //Add these missing state variables with your other useState declarations
const [hasFetchedExpenses, setHasFetchedExpenses] = useState(false);
const [isInitialized, setIsInitialized] = useState(false);

  // Table / filter / pagination state to mirror Invoice page behavior
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  // start empty; will load from backend
  const [expenses, setExpenses] = useState([]);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  // revenues loaded from backend (replaces placeholder revenueData)
  const [revenues, setRevenues] = useState([]);
  const [loadingRevenues, setLoadingRevenues] = useState(false);

  const [showFilterBox, setShowFilterBox] = useState(false);
  const [activeFilters, setActiveFilters] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  // Map backend revenues into the shape expected by aggregateData (date + revenue string)
  const categoryFilteredData = (revenues || []).map(r => {
    // server returns recordedAt and amount (number)
    const date = r.recordedAt || r.date || r.createdAt || r.invoiceDate || r.dateCreated || new Date().toISOString();
    const amountNum = Number(r.amount || r.amountNumber || 0) || 0;
    return {
      id: r.id,
      date,
      revenue: `Php ${amountNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      revenueNumber: amountNum,
      notes: r.notes,
      billingId: r.billingId,
      appointmentId: r.appointmentId,
      patientId: r.patientId,
    };
  });
  const [period, setPeriod] = useState('Daily');
  const [activeTab, setActiveTab] = useState('revenue');

  const filterCategories = [
    { label: 'Amount Range', value: 'amountRange', types: ['0-1000', '1001-2000', '2001-5000', '5000+'] },
    { label: 'Date Range', value: 'dateRange', types: ['Last 7 days', 'Last 30 days', 'Last 90 days'] },
  ];

  // Aggregate data depending on selected period (Daily / Monthly / Yearly)
  const aggregateData = (data, period) => {
    const map = new Map();
    data.forEach((item) => {
      const parsed = new Date(item.date);
      if (isNaN(parsed.getTime())) return; // skip invalid dates

      // parse revenue string like 'Php 20,500.00' to number
      const revNum = Number(String(item.revenue).replace(/[^0-9.-]+/g, '')) || 0;

      let keySort;
      let label;
      if (period === 'Daily') {
        // YYYY-MM-DD for sort
        const y = parsed.getFullYear();
        const m = String(parsed.getMonth() + 1).padStart(2, '0');
        const d = String(parsed.getDate()).padStart(2, '0');
        keySort = `${y}-${m}-${d}`;
        label = formatLongDate(parsed);
      } else if (period === 'Monthly') {
        const y = parsed.getFullYear();
        const m = String(parsed.getMonth() + 1).padStart(2, '0');
        keySort = `${y}-${m}-01`;
        label = parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
      } else { // Yearly
        const y = parsed.getFullYear();
        keySort = `${y}-01-01`;
        label = String(y);
      }

      const existing = map.get(keySort);
      if (existing) {
        existing.revenueNumber += revNum;
      } else {
        map.set(keySort, { label, dateSort: keySort, revenueNumber: revNum });
      }
    });

    // Convert map to array and format revenue string
    const arr = Array.from(map.values()).map((r) => ({
      label: r.label,
      dateSort: r.dateSort,
      revenueNumber: r.revenueNumber,
      revenue: `Php ${r.revenueNumber.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    }));
    return arr;
  };

  // Deduplicate expense rows by id or by composite key (date|amount|name)
  // Replace your existing dedupeExpenses function
// Replace your existing dedupeExpenses function
const dedupeExpenses = (arr) => {
  if (!Array.isArray(arr)) {
    console.log('⚠️ dedupeExpenses received non-array:', typeof arr);
    return [];
  }
  
  console.log('🔍 Starting deduplication of', arr.length, 'expenses');
  
  const seen = new Set();
  const result = [];
  const duplicates = [];
  
  arr.forEach((expense, index) => {
    // Create a unique key based on id first, then fallback to composite key
    let uniqueKey;
    
    if (expense.id && !String(expense.id).startsWith('local-')) {
      // Use server ID as primary key (most reliable)
      uniqueKey = `id:${expense.id}`;
    } else {
      // Fallback to composite key for local/temporary entries
      const date = expense.date || '';
      const amount = Number(expense.amountNumber || expense.amount || 0);
      const name = (expense.expense || expense.name || '').toString().toLowerCase().trim();
      const category = (expense.category || '').toString().toLowerCase().trim();
      uniqueKey = `composite:${date}|${amount}|${name}|${category}`;
    }
    
    if (!seen.has(uniqueKey)) {
      seen.add(uniqueKey);
      result.push(expense);
    } else {
      duplicates.push({ 
        index, 
        expense: expense.expense || expense.name, 
        uniqueKey,
        id: expense.id 
      });
    }
  });
  
  if (duplicates.length > 0) {
    console.log('🚨 Found and removed', duplicates.length, 'duplicates:', duplicates);
  }
  
  console.log('✅ Deduplication complete:', arr.length, '→', result.length, 'expenses');
  return result;
};

//Add this function after your other functions for debugging
const forceRefreshExpenses = async () => {
  console.log('🔄 Force refreshing expenses...');
  setHasFetchedExpenses(false);
  setExpenses([]);
  await fetchExpenses();
};

// Make it available for debugging (add this near the end of your component)
if (typeof window !== 'undefined') {
  window.forceRefreshExpenses = forceRefreshExpenses;
}

  // Fetch revenues from backend and update state
  const fetchRevenues = async () => {
    setLoadingRevenues(true);
    try {
      const res = await fetch(`${API_BASE}/revenues`);
      if (!res.ok) {
        console.error('Failed to fetch revenues', res.status);
        setRevenues([]);
        setLoadingRevenues(false);
        return;
      }
      const data = await res.json();
      console.log('Fetched revenues count:', (data || []).length);
      // Normalize rows: expect amount and recordedAt
      const mapped = (data || []).map(r => ({
        id: r.id,
        amount: Number(r.amount || 0),
        recordedAt: r.recordedAt || r.createdAt || r.date || null,
        notes: r.notes || '',
        billingId: r.billingId,
        appointmentId: r.appointmentId,
        patientId: r.patientId,
      }));
      setRevenues(mapped);
    } catch (e) {
      console.error('Error fetching revenues', e);
      setRevenues([]);
    } finally {
      setLoadingRevenues(false);
    }
  };

  useEffect(() => {
    // initial load
    fetchRevenues();

    // refresh when a billing/invoice is created elsewhere in the app
    const onBillingCreated = () => fetchRevenues();
    const onInvoiceCreated = () => fetchRevenues();
    window.addEventListener('billingCreated', onBillingCreated);
    window.addEventListener('invoiceCreated', onInvoiceCreated);
    return () => {
      window.removeEventListener('billingCreated', onBillingCreated);
      window.removeEventListener('invoiceCreated', onInvoiceCreated);
    };
  }, []);





  const aggregated = aggregateData(categoryFilteredData || [], period);

  // Map backend revenues into row-level format (like expensesRows) so the Revenue tab
  // can show individual revenue rows directly from the `revenues` table.
  const revenuesRows = (revenues || []).map((r) => ({
    id: r.id,
    // ensure date is in a parsable ISO-like format
    date: (r.recordedAt || r.date || r.createdAt || new Date().toISOString()).split('T')[0],
    dateSort: (r.recordedAt || r.date || r.createdAt || new Date().toISOString()).split('T')[0],
    revenueNumber: Number(r.amount || r.amountNumber || 0) || 0,
    revenue: `Php ${Number(r.amount || r.amountNumber || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    notes: r.notes || '',
    billingId: r.billingId,
    appointmentId: r.appointmentId,
    patientId: r.patientId,
  }));

  // Apply search/filter/sort/pagination on row-level revenues (for the Revenue tab)
  const filteredRevenuesRows = (revenuesRows || []).filter((item) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (item.date || '').toLowerCase().includes(q) || (item.notes || '').toLowerCase().includes(q) || (item.revenue || '').toLowerCase().includes(q);
  });

  const sortedRevenuesRows = sortData(filteredRevenuesRows, sortConfig || {});
  const totalPagesRevenues = Math.max(1, Math.ceil(sortedRevenuesRows.length / rowsPerPage));
  const visibleRevenues = sortedRevenuesRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // --- Expenses aggregation (for breakdown only) ---
  // We keep row-level `expenses` for the table; aggregatedExpenses is derived for charts/stats.
  const expenseDataForAggregate = (expenses || []).map((e) => ({ date: e.date, revenue: `Php ${Number(e.amountNumber || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }));
  const aggregatedExpenses = aggregateData(expenseDataForAggregate || [], period).map((r) => ({
    ...r,
    amountNumber: r.revenueNumber,
  }));

  // Service breakdowns (placeholder) for pie chart & stats
  const breakdownRevenue = computeServiceBreakdown(aggregated);
  const breakdownExpenses = computeServiceBreakdown(aggregatedExpenses);

  // compute category breakdown for expenses (group by category)
  const computeExpenseCategoryBreakdown = (expenseRows, periodKey) => {
    // If periodKey is provided, only include expenses that belong to that period (same keySort)
    const map = new Map();
    (expenseRows || []).forEach((r) => {
      try {
        const parsed = new Date(r.date);
        if (isNaN(parsed.getTime())) return;
        let keySort;
        if (period === 'Daily') {
          const y = parsed.getFullYear();
          const m = String(parsed.getMonth() + 1).padStart(2, '0');
          const d = String(parsed.getDate()).padStart(2, '0');
          keySort = `${y}-${m}-${d}`;
        } else if (period === 'Monthly') {
          const y = parsed.getFullYear();
          const m = String(parsed.getMonth() + 1).padStart(2, '0');
          keySort = `${y}-${m}-01`;
        } else {
          const y = parsed.getFullYear();
          keySort = `${y}-01-01`;
        }
        if (periodKey && keySort !== periodKey) return; // skip if not in selected period
      } catch (e) {
        // ignore parse errors and proceed
      }
      const cat = r.category || 'General';
      const amt = Number(r.amountNumber || 0) || 0;
      map.set(cat, (map.get(cat) || 0) + amt);
    });
    const total = Array.from(map.values()).reduce((s, v) => s + v, 0) || 0;
    const colors = ['#c23b3b', '#ff9800', '#2196f3', '#4caf50', '#9c27b0', '#607d8b'];
    const arr = Array.from(map.entries()).map(([name, value], i) => ({ name, value, color: colors[i % colors.length], percent: total ? value / total : 0 }));
    // sort descending
    arr.sort((a, b) => b.value - a.value);
    return arr;
  };

  // determine the currently selected period key based on today's date (so pie shows "today / this month / this year")
  const now = new Date();
  let currentExpensePeriodKey = null;
  if (period === 'Daily') {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    currentExpensePeriodKey = `${y}-${m}-${d}`;
  } else if (period === 'Monthly') {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    currentExpensePeriodKey = `${y}-${m}-01`;
  } else {
    const y = now.getFullYear();
    currentExpensePeriodKey = `${y}-01-01`;
  }
  const expenseCategoryBreakdown = computeExpenseCategoryBreakdown(expenses, currentExpensePeriodKey);

  // choose data for the expenses pie: prefer category breakdown (for the current period), otherwise fallback to service-style placeholders
  const expensePieData = (expenseCategoryBreakdown && expenseCategoryBreakdown.length) ? expenseCategoryBreakdown : (breakdownExpenses && breakdownExpenses.length ? breakdownExpenses : []);

  // center labels: show top category name and the period descriptor (Today / This Month / This Year)
  const periodDescriptor = period === 'Daily' ? 'Today' : period === 'Monthly' ? 'This Month' : 'This Year';
  const topCategoryName = expensePieData && expensePieData[0] ? expensePieData[0].name : '';

  // Totals for the right panel metrics
  const revenueTotal = (aggregated || []).reduce((s, r) => s + (r.revenueNumber || 0), 0);
  const expenseTotal = (aggregatedExpenses || []).reduce((s, r) => s + (r.amountNumber || 0), 0);
  const netTotal = revenueTotal - expenseTotal;

  // Expense dialog handlers (placeholder)
  const openExpenseDialog = () => setShowExpenseModal(true);
  const closeExpenseDialog = () => setShowExpenseModal(false);
  // onSubmit from AddExpenseDialog will pass the server-returned expense when available.
 // Replace your existing handleExpenseSubmit function
const handleExpenseSubmit = (savedOrPayload) => {
  console.log('💰 Processing new expense:', savedOrPayload);
  
  // savedOrPayload may be server row { id, year, seq, name, category, amount, date, createdAt }
  // or a fallback payload from client. Normalize both.
  const row = savedOrPayload && savedOrPayload.id
    ? mapDbExpenseToRow({
        id: savedOrPayload.id,
        name: savedOrPayload.name || savedOrPayload.expense,
        category: savedOrPayload.category,
        amount: savedOrPayload.amount,
        date: savedOrPayload.date,
        createdAt: savedOrPayload.createdAt,
      })
    : // fallback payload shape
      mapDbExpenseToRow({
        id: savedOrPayload.id || null,
        name: savedOrPayload.expense || savedOrPayload.description || 'Expense',
        category: savedOrPayload.category || 'General',
        amount: savedOrPayload.amount || savedOrPayload.amountNumber || 0,
        date: savedOrPayload.date || new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
      });

  console.log('📝 Mapped expense row:', row);

  // Check if this expense already exists before adding
  setExpenses((prevExpenses) => {
    console.log('🔍 Checking for duplicates in', prevExpenses.length, 'existing expenses');
    
    const existingIndex = prevExpenses.findIndex(expense => {
      // Check by server ID first (most reliable)
      if (row.id && expense.id && 
          !String(row.id).startsWith('local-') && 
          !String(expense.id).startsWith('local-')) {
        return expense.id === row.id;
      }
      
      // Fallback to composite key check for exact matches
      const sameDate = expense.date === row.date;
      const sameName = (expense.expense || '').toLowerCase().trim() === (row.expense || '').toLowerCase().trim();
      const sameCategory = (expense.category || '').toLowerCase().trim() === (row.category || '').toLowerCase().trim();
      const sameAmount = Number(expense.amountNumber || 0) === Number(row.amountNumber || 0);
      
      return sameDate && sameName && sameCategory && sameAmount;
    });

    if (existingIndex !== -1) {
      console.log('⚠️ Expense already exists at index', existingIndex, '- not adding duplicate');
      console.log('   Existing:', prevExpenses[existingIndex]);
      console.log('   New:', row);
      return prevExpenses; // Return unchanged array
    }

    console.log('✅ Adding new expense to beginning of list');
    return [row, ...prevExpenses]; // Add to beginning
  });
  
  setShowExpenseModal(false);
};




  // apply search on the aggregated label
  const filtered = (aggregated || []).filter((item) => {
    if (!search) return true;
    return (item.label || '').toLowerCase().includes(search.toLowerCase());
  });

  // Sort using sortData - use keys that exist on aggregated items
  const sorted = sortData(filtered, sortConfig || {});
  const totalPages = Math.max(1, Math.ceil(sorted.length / rowsPerPage));
  const visible = sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Decide which dataset to display in the main Revenue table:
  // - If period === 'Daily', show individual revenue rows (payments/invoices)
  // - Otherwise (Monthly/Yearly), show aggregated rows
  const displayRows = period === 'Daily' ? visibleRevenues : visible;
  const displayTotalPages = period === 'Daily' ? totalPagesRevenues : totalPages;

  // Example placeholder row depending on selected period
  const exampleRow = period === 'Daily'
    ? { label: 'e.g. October 30, 2025', revenue: 'Php 20,500.00' }
    : period === 'Monthly'
      ? { label: 'e.g. October 2025', revenue: 'Php 215,000.00' }
      : { label: 'e.g. 2023', revenue: 'Php 3,000,000.00' };

  // Example placeholders for expenses (row-level)
  const exampleRowExpenses = period === 'Daily'
    ? { label: 'e.g. October 30, 2025', amount: 'Php 2,500.00' }
    : period === 'Monthly'
      ? { label: 'e.g. October 2025', amount: 'Php 12,500.00' }
      : { label: 'e.g. 2023', amount: 'Php 150,000.00' };

  // Prepare row-level expenses for the table (not aggregated)
  const expensesRows = (expenses || []).map((e) => ({
    ...e,
    // ensure dateSort is YYYY-MM-DD so SortableHeader can sort
    dateSort: e.date,
    amountNumber: Number(e.amountNumber || e.amount || 0),
  }));

  // If Monthly period is selected, aggregate row-level expenses into per-month totals
  let aggregatedMonthlyExpenses = [];
  if (period === 'Monthly') {
    const map = new Map();
    (expensesRows || []).forEach((r) => {
      try {
        const key = (r.date || '').slice(0, 7); // YYYY-MM
        if (!key) return;
        const entry = map.get(key) || { monthKey: key, amountNumber: 0 };
        entry.amountNumber += Number(r.amountNumber || 0) || 0;
        map.set(key, entry);
      } catch (e) {
        // ignore bad dates
      }
    });
    aggregatedMonthlyExpenses = Array.from(map.entries()).map(([key, v]) => {
      const dateForSort = `${key}-01`;
      const label = new Date(dateForSort).toLocaleString(undefined, { month: 'long', year: 'numeric' });
      return {
        id: key,
        date: dateForSort,
        dateSort: dateForSort,
        label,
        amountNumber: v.amountNumber,
        amount: `Php ${Number(v.amountNumber || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      };
    });
    // newest month first
    aggregatedMonthlyExpenses.sort((a, b) => (b.dateSort || '').localeCompare(a.dateSort || ''));
  }

  // If Yearly period is selected, aggregate row-level expenses into per-year totals
  let aggregatedYearlyExpenses = [];
  if (period === 'Yearly') {
    const mapY = new Map();
    (expensesRows || []).forEach((r) => {
      try {
        const key = (r.date || '').slice(0, 4); // YYYY
        if (!key) return;
        const entry = mapY.get(key) || { yearKey: key, amountNumber: 0 };
        entry.amountNumber += Number(r.amountNumber || 0) || 0;
        mapY.set(key, entry);
      } catch (e) {
        // ignore bad dates
      }
    });
    aggregatedYearlyExpenses = Array.from(mapY.entries()).map(([key, v]) => {
      const dateForSort = `${key}-01-01`;
      const label = String(key);
      return {
        id: key,
        date: dateForSort,
        dateSort: dateForSort,
        label,
        amountNumber: v.amountNumber,
        amount: `Php ${Number(v.amountNumber || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      };
    });
    // newest year first
    aggregatedYearlyExpenses.sort((a, b) => (b.dateSort || '').localeCompare(a.dateSort || ''));
  }

  const safeExpenses = dedupeExpenses(expensesRows);
  
  // Filtering for table display depends on whether we're in Monthly or Yearly aggregated mode
  const rowsForDisplay = period === 'Monthly' ? (aggregatedMonthlyExpenses || []) : period === 'Yearly' ? (aggregatedYearlyExpenses || []) : (expensesRows || []);
  const filteredExpensesRows = (rowsForDisplay || []).filter((item) => {
    if (!search) return true;
    const q = search.toLowerCase();
    if (period === 'Monthly' || period === 'Yearly') {
      return (item.label || '').toLowerCase().includes(q) || (item.date || '').toLowerCase().includes(q);
    }
    return (item.date || '').toLowerCase().includes(q) || (item.expense || '').toLowerCase().includes(q) || (item.category || '').toLowerCase().includes(q);
  });

  const sortedExpensesRows = sortData(filteredExpensesRows, sortConfig || {});
  const totalPagesExpenses = Math.max(1, Math.ceil(sortedExpensesRows.length / rowsPerPage));
  const visibleExpenses = sortedExpensesRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleSort = (newSort) => setSortConfig(newSort);
  const handlePageChange = (newPage) => setPage(newPage);
  const handleRowsPerPageChange = (n) => { setRowsPerPage(n); setPage(0); };

  // Dynamic labels for the right-side metrics based on selected period
  const periodGrossLabel = period === 'Daily' ? 'Daily Gross Income' : period === 'Monthly' ? 'Monthly Gross Income' : 'Yearly Gross Income';
  const periodNetLabel = period === 'Daily' ? 'Daily Net Profit' : period === 'Monthly' ? 'Monthly Net Profit' : 'Yearly Net Profit';
  const topServicesTitle = activeTab === 'revenue' 
    ? (period === 'Daily' ? 'Top Services Availed Today' : period === 'Monthly' ? 'Top Services Availed This Month' : 'Top Services Availed This Year')
    : (period === 'Daily' ? 'Top Expenses Today' : period === 'Monthly' ? 'Top Expenses This Month' : 'Top Expenses This Year');
  const rightPanelRangeText = (dataArr) => {
    if (!Array.isArray(dataArr) || dataArr.length === 0) {
      return period === 'Daily' ? 'Today' : period === 'Monthly' ? 'This Month' : 'This Year';
    }
    // use first aggregated label as a simple range/title
    return dataArr[0].label || (period === 'Daily' ? 'Today' : period === 'Monthly' ? 'This Month' : 'This Year');
  };


  // Handlers (using placeholders since there is no data fetching in this version)
  const handleAddPatientRecord = () => setShowPatientModal(true);
  const handleAddAppointment = () => navigate('/add-appointment');

  const handleAddService = () => setShowServiceModal(false);
  const handleAddPackage = () => setShowPackageModal(false);

  // fetch expenses from backend
  const mapDbExpenseToRow = (row) => {
    const amountNumber = Number(row.amount || row.amountNumber || 0) || 0;
    return {
      id: row.id,
      date: row.date ? row.date.split('T')[0] : (new Date()).toISOString().split('T')[0],
      expense: row.name || row.expense || 'Expense',
      category: row.category || 'General',
      notes: row.notes || '',
      amountNumber,
      amount: `Php ${amountNumber.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      createdAt: row.createdAt,
    };
  };
// Replace your existing fetchExpenses function
const fetchExpenses = async () => {
  if (hasFetchedExpenses) {
    console.log('⏭️ Expenses already fetched, skipping fetch to prevent duplicates');
    return;
  }

  if (loadingExpenses) {
    console.log('⏳ Already loading expenses, skipping duplicate fetch');
    return;
  }

  console.log('🔄 Fetching expenses from server...');
  setLoadingExpenses(true);
  
  try {
    const res = await fetch('http://localhost:3001/expenses');
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    const rows = await res.json();
    console.log('📊 Received expenses from server:', rows.length);
    
    const mapped = (rows || []).map(mapDbExpenseToRow)
      .sort((a, b) => new Date(b.date) - new Date(a.date)); // newest first
    
    console.log('🔧 Mapped expenses:', mapped.length);
    
    // Only dedupe when setting from server data
    const deduped = dedupeExpenses(mapped);
    console.log('✅ Final expenses after dedup:', deduped.length);
    
    // Set expenses and mark as fetched
    setExpenses(deduped);
    setHasFetchedExpenses(true);
    
  } catch (e) {
    console.error('❌ Failed to load expenses', e);
    // fallback to initial placeholders so UI still shows something
    const fallbackExpenses = dedupeExpenses(initialExpenseData.map(mapDbExpenseToRow));
    setExpenses(fallbackExpenses);
    setHasFetchedExpenses(true); // Still mark as fetched to prevent retries
  } finally {
    setLoadingExpenses(false);
  }
};



 // Initial load effect - only runs once when component mounts
useEffect(() => {
  if (!hasFetchedExpenses && !isInitialized) {
    console.log('🚀 Component mounted, fetching expenses for the first time');
    setIsInitialized(true);
    fetchExpenses();
  }
}, []); // Empty dependency array - only run once

// Tab switching effect - DOES NOT refetch data
useEffect(() => {
  console.log('🔄 Active tab changed to:', activeTab);
  console.log('📊 Current expenses count before tab switch:', expenses.length);
  
  // Only reset pagination when switching tabs - DO NOT refetch data
  setPage(0);
  
  // Log current expenses to debug
  if (activeTab === 'expenses' && expenses.length > 0) {
    console.log('📋 Current expenses when switching to expenses tab:', 
      expenses.slice(0, 5).map(e => ({ id: e.id, name: e.expense, date: e.date }))
    );
  }
}, [activeTab]); // Remove expenses.length from dependencies to prevent re-renders




  

  const theme = useTheme();

  return (
    <Box
      sx={{
        height: '70%',
        backgroundColor: 'transparent',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Header />

      {/* Sales Title (same style as Services title) */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          pt: 2,

          px: 2,
        }}
      >
          <Typography
          variant="h3"
          className="no-scale-sales-title"
          sx={{
            color: (theme) => theme.palette.mode === 'dark' ? theme.palette.text.primary : 'white',
            fontWeight: 800,
            fontSize: '2.45rem',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Sales Report
        </Typography>
      </Box>

      {/* Main Content Container (replaces DataTable) */}
      <DashboardContainer>

        {/* Tab buttons (upper-right of the white card) */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%', mb: 1 }}>
          <Button
            onClick={() => { setActiveTab('revenue'); setPage(0); }}
            sx={{
              mr: 1,
              bgcolor: (theme) => theme.palette.mode === 'dark' ? (activeTab === 'revenue' ? theme.palette.primary.main : 'transparent') : (activeTab === 'revenue' ? '#4A69BD' : 'transparent'),
              color: (theme) => theme.palette.mode === 'dark' ? (activeTab === 'revenue' ? theme.palette.primary.contrastText : theme.palette.primary.main) : (activeTab === 'revenue' ? '#fff' : '#4A69BD'),
              border: (theme) => theme.palette.mode === 'dark' ? (activeTab === 'revenue' ? `1px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.divider}`) : (activeTab === 'revenue' ? '1px solid #4A69BD' : '1px solid #e0e0e0'),
              borderRadius: '10px',
              px: 2,
              textTransform: 'none',
              '&:hover': {
                bgcolor: activeTab === 'revenue' ? '#1e3a9f' : '#e8f1ff',
                borderColor: '#274fc7'
              }
            }}
          >
            Revenue
          </Button>
          <Button
            onClick={() => { setActiveTab('expenses'); setPage(0); }}
            sx={{
              bgcolor: (theme) => theme.palette.mode === 'dark' ? (activeTab === 'expenses' ? theme.palette.error.main : 'transparent') : (activeTab === 'expenses' ? '#c23b3b' : 'transparent'),
              color: (theme) => theme.palette.mode === 'dark' ? (activeTab === 'expenses' ? theme.palette.error.contrastText : theme.palette.error.main) : (activeTab === 'expenses' ? '#fff' : '#c23b3b'),
              border: (theme) => theme.palette.mode === 'dark' ? (activeTab === 'expenses' ? `1px solid ${theme.palette.error.main}` : `1px solid ${theme.palette.divider}`) : (activeTab === 'expenses' ? '1px solid #c23b3b' : '1px solid #e0e0e0'),
              borderRadius: '10px',
              px: 2,
              textTransform: 'none',
              '&:hover': {
                bgcolor: activeTab === 'expenses' ? '#a02f2f' : '#ffe8e8',
                borderColor: '#c23b3b'
              }
            }}
          >
            Expenses
          </Button>
        </Box>

        {activeTab === 'revenue' ? (
          <Grid container spacing={3}>
            <Grid item xs={12} md={7} sx={{ width: '60%'  }}>
              <DataTable
                paperAlign="left"
                topContent={
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', px: 3, pt: 3, pb: 2, gap: 2, boxSizing: 'border-box' }}>
                      <SearchBar value={search} onChange={setSearch} placeholder="Search by date" searchFields={["date"]} data={categoryFilteredData} />
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'flex-end', width: 'auto', p: 0, m: 0, flex: 1 }}>
                        <Box sx={{ color: 'white', fontWeight: 600, mr: 1 }}>
                          {loadingRevenues ? 'Loading revenues...' : `${revenues.length || 0} revenues`}
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'flex-end', width: 'auto', p: 0, m: 0, flex: 1 }}>
                          <FilterButton onClick={() => setShowFilterBox(v => !v)} />
                          <FormControl size="small" sx={{ minWidth: 120, ml: 1 }}>
                            <Select
                              value={period}
                              onChange={(e) => { setPeriod(e.target.value); setPage(0); }}
                              displayEmpty
                              inputProps={{ 'aria-label': 'period-select' }}
                              sx={{
                                backgroundColor: (theme) => theme.palette.mode === 'dark' ? theme.palette.primary.main : '#4A69BD',
                                color: (theme) => theme.palette.mode === 'dark' ? theme.palette.primary.contrastText : 'white',
                                border: (theme) => theme.palette.mode === 'dark' ? `1px solid ${theme.palette.primary.main}` : '1px solid #4A69BD',
                                borderRadius: '10px',
                                height: '38px',
                                px: 2,
                                textTransform: 'none',
                                fontWeight: 500,
                                fontSize: '16px',
                                fontSize: '1rem',
                              fontFamily: 'DM Sans, sans-serif',
                                minWidth: 99,
                                boxShadow: 1,
                                '& .MuiSvgIcon-root': { color: (theme) => theme.palette.mode === 'dark' ? theme.palette.primary.contrastText : 'white' },
                                '&:hover': { backgroundColor: (theme) => theme.palette.mode === 'dark' ? theme.palette.primary.dark : '#2148c0', border: (theme) => theme.palette.mode === 'dark' ? `1px solid ${theme.palette.primary.dark}` : '1px solid #2148c0' },
                              }}
                            >
                              <MenuItem value="Daily">Daily</MenuItem>
                              <MenuItem value="Monthly">Monthly</MenuItem>
                              <MenuItem value="Yearly">Yearly</MenuItem>
                            </Select>
                          </FormControl>
                        </Box>
                      </Box>
                    </Box>
                    <Collapse in={showFilterBox} timeout={{ enter: 300, exit: 200 }}>
                      <FilterContent filterCategories={filterCategories} activeFilters={activeFilters} onFilterChange={setActiveFilters} />
                    </Collapse>
                  </Box>
                }
                tableHeader={
                  <Box sx={{ px: 3, pt: 3, pb: 3 }}>
                    <Box sx={{ display: 'flex', px: 2, alignItems: 'center' }}>
                      <SortableHeader
                        label={period === 'Daily' ? 'Date' : period === 'Monthly' ? 'Month' : 'Year'}
                        sortKey="dateSort"
                        currentSort={sortConfig}
                        onSort={handleSort}
                        textAlign="left"
                        sx={{ flex: '2' }}
                      />
                      <SortableHeader
                        label="Amount"
                        sortKey="revenueNumber"
                        currentSort={sortConfig}
                        onSort={handleSort}
                        textAlign="right"
                        sx={{ flex: '1', display: 'flex', justifyContent: 'flex-end' }}
                      />
                    </Box>
                  </Box>
                }
                tableRows={
                  <Box sx={{ px: 3, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '200px', maxHeight: '550px', overflow: 'auto' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, pb: 2 }}>
                      {displayRows && displayRows.length > 0 ? displayRows.map((row) => (
                        <Box key={`rev-${row.id || row.dateSort || row.label || row.date}`} sx={{ display: 'flex', px: 2, py: 1, alignItems: 'center', backgroundColor: (theme) => theme.palette.mode === 'dark' ? theme.palette.background.default : '#f9fafc', borderRadius: '10px', boxSizing: 'border-box', border: (theme) => theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : '1px solid #e5e7eb', '&:hover': { backgroundColor: (theme) => theme.palette.mode === 'dark' ? theme.palette.action?.hover || theme.palette.background.paper : '#f0f4f8', cursor: 'pointer' } }}>
                          <Box sx={{ flex: 2, textAlign: 'left', color: (theme) => theme.palette.mode === 'dark' ? theme.palette.text.secondary : '#6d6b80' }}>{row.label || formatLongDate(row.date || row.dateSort)}</Box>
                          <Box sx={{ flex: 1, textAlign: 'right', color: (theme) => theme.palette.mode === 'dark' ? theme.palette.text.secondary : '#6d6b80' }}>{row.revenue}</Box>
                        </Box>
                      )) : (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4, backgroundColor: (theme) => theme.palette.mode === 'dark' ? theme.palette.background.default : '#f9fafc', borderRadius: '10px', boxSizing: 'border-box', border: (theme) => theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : '1px solid #e5e7eb' }}>
                          <Box sx={{ display: 'flex', px: 2, py: 1, alignItems: 'center', backgroundColor: (theme) => theme.palette.mode === 'dark' ? theme.palette.background.default : '#f9fafc', borderRadius: '10px', width: '100%', maxWidth: 760, boxSizing: 'border-box', border: (theme) => theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : '1px solid #e5e7eb' }}>
                            <Box sx={{ flex: 2, textAlign: 'left', color: (theme) => theme.palette.mode === 'dark' ? theme.palette.text.secondary : '#9aa0b4', fontStyle: 'italic' }}>{exampleRow.label}</Box>
                            <Box sx={{ flex: 1, textAlign: 'right', color: (theme) => theme.palette.mode === 'dark' ? theme.palette.text.secondary : '#9aa0b4', fontStyle: 'italic' }}>{exampleRow.revenue}</Box>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Box>
                }
                pagination={
                  <Box sx={{ mt: 2, mb: 2, px: 3, pt: 0, pb: 0 }}>
                    <Pagination page={page} totalPages={displayTotalPages} onPageChange={handlePageChange} rowsPerPage={rowsPerPage} onRowsPerPageChange={handleRowsPerPageChange} />
                  </Box>
                }
                grayMinHeight={'450px'}
                whiteMinHeight={'560px'}
              />
            </Grid>

            <Grid item xs={12} md={5} sx={{ width: '38.5%' }}>
              {/* Right Panel: Metrics and Chart */}
              <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                <Paper elevation={3} sx={{ backgroundColor: (theme) => theme.palette.mode === 'dark' ? theme.palette.success.main : '#38761D', color: 'white', p: 2, textAlign: 'center', borderRadius: 2, flex: 1 }}>
                  <Typography variant="h5" fontWeight="bold">{formatCurrency(revenueTotal)}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>{periodGrossLabel}</Typography>
                </Paper>
                <Paper elevation={3} sx={{ backgroundColor: (theme) => theme.palette.mode === 'dark' ? theme.palette.primary.main : '#0056b3', color: 'white', p: 2, textAlign: 'center', borderRadius: 2, flex: 1 }}>
                  <Typography variant="h5" fontWeight="bold">{formatCurrency(netTotal)}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>{periodNetLabel}</Typography>
                </Paper>
              </Box>
              
              <Paper elevation={3} sx={{ p: 3, height: '405px', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" fontWeight="bold" textAlign="center" sx={{ mb: 1 }}>{topServicesTitle}</Typography>
                <Typography variant="caption" display="block" color="text.secondary" textAlign="center" sx={{ mb: 2 }}>{rightPanelRangeText(aggregated)}</Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                  <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', justifyContent: 'center' }}>
                    <Box sx={{ flex: '0 0 240px', display: 'flex', justifyContent: 'center' }}>
                      <PieSVG data={breakdownRevenue} size={240} />
                    </Box>
                    
                    <Box sx={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {breakdownRevenue.map((d) => (
                        <Box key={d.name} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{ width: 14, height: 14, backgroundColor: (theme) => theme.palette.mode === 'dark' ? theme.palette.background.paper : d.color, borderRadius: 1, flexShrink: 0 }} />
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={600} noWrap>{d.name}</Typography>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                              <Typography variant="body2" fontWeight={500} color="text.primary">{formatCurrency(d.value)}</Typography>
                              <Typography variant="caption" color="text.secondary">({(d.percent * 100).toFixed(1)}%)</Typography>
                            </Box>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        ) : (
          <Grid container spacing={3} sx={(theme) => ({
            // scope button color overrides to only the actions area inside Expenses
            '& .expenses-actions .MuiButton-root': {
              backgroundColor: theme.palette.mode === 'dark' ? theme.palette.error.main : '#c23b3b',
              color: '#fff',
              borderColor: theme.palette.mode === 'dark' ? theme.palette.error.main : '#c23b3b',
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark' ? theme.palette.error.dark : '#a02f2f',
                borderColor: theme.palette.mode === 'dark' ? theme.palette.error.dark : '#a02f2f',
              },
            },
          })}>
            <Grid item xs={12} md={7} sx={{ width: '60%' }}>
              <DataTable
                paperAlign="left"
                topContent={
                  <>
                    <Box className="expenses-actions" sx={{ display: 'flex', alignItems: 'center', width: '100%', px: 3, pt: 3, pb: 2, gap: 2, boxSizing: 'border-box' }}>
                      <SearchBar value={search} onChange={setSearch} placeholder="Search by date/expense/category" searchFields={["date", "expense", "category"]} data={expenses} />
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'flex-end', width: 'auto', p: 0, m: 0, flex: 1 }}>
                        <FilterButton onClick={() => setShowFilterBox(v => !v)} />
                        <FormControl size="small" sx={{ minWidth: 120, ml: 1 }}>
                          <Select
                            value={period}
                            onChange={(e) => { setPeriod(e.target.value); setPage(0); }}
                            displayEmpty
                            inputProps={{ 'aria-label': 'period-select' }}
                            sx={{
                              backgroundColor: (theme) => theme.palette.mode === 'dark' ? theme.palette.error.main : '#c23b3b',
                              color: 'white',
                              border: (theme) => theme.palette.mode === 'dark' ? `1px solid ${theme.palette.error.main}` : '1px solid #c23b3b',
                              borderRadius: '10px',
                              height: '38px',
                              px: 2,
                              textTransform: 'none',
                              fontWeight: 500,
                              fontSize: '16px',
                              fontFamily: 'DM Sans, sans-serif',
                              minWidth: 99,
                              boxShadow: 1,
                              '& .MuiSvgIcon-root': { color: 'white' },
                              '&:hover': { backgroundColor: (theme) => theme.palette.mode === 'dark' ? theme.palette.error.dark : '#a02f2f', border: (theme) => theme.palette.mode === 'dark' ? `1px solid ${theme.palette.error.dark}` : '1px solid #a02f2f' },
                            }}
                          >
                            <MenuItem value="Daily">Daily</MenuItem>
                            <MenuItem value="Monthly">Monthly</MenuItem>
                            <MenuItem value="Yearly">Yearly</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                    </Box>
                    <Collapse in={showFilterBox} timeout={{ enter: 300, exit: 200 }}>
                      <FilterContent filterCategories={filterCategories} activeFilters={activeFilters} onFilterChange={setActiveFilters} />
                    </Collapse>
                  </>
                }
                tableHeader={
                  <Box sx={{ px: 3, pt: 3, pb: 3 }}>
                      <Box sx={{ display: 'flex', px: 2, alignItems: 'center' }}>
                        <SortableHeader
                          label={period === 'Daily' ? 'Date' : period === 'Monthly' ? 'Month' : 'Year'}
                          sortKey="dateSort"
                          currentSort={sortConfig}
                          onSort={handleSort}
                          textAlign="left"
                          sx={{ flex: period !== 'Daily' ? '2.5' : '2' }}
                        />
                        <Box sx={{ flex: period !== 'Daily' ? 0 : 0.8, px: 2, color: '#6d6b80', display: period !== 'Daily' ? 'none' : 'block' }}>Expense</Box>
                        <Box sx={{ flex: period !== 'Daily' ? 0 : 0.8, px: 2, color: '#6d6b80', display: period !== 'Daily' ? 'none' : 'block' }}>Category</Box>
                        <Box sx={{ flex: period !== 'Daily' ? 0 : 3, px: 2, color: '#6d6b80', display: period !== 'Daily' ? 'none' : 'block' }}>Notes</Box>
                        <SortableHeader
                          label="Amount"
                          sortKey="amountNumber"
                          currentSort={sortConfig}
                          onSort={handleSort}
                          textAlign="right"
                          sx={{ flex: period === 'Monthly' ? '1' : '1', display: 'flex', justifyContent: 'flex-end' }}
                        />
                      </Box>
                  </Box>
                }
                tableRows={
                  <Box sx={{ px: 3, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '200px', maxHeight: '550px', overflow: 'auto' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, pb: 2 }}>
                      {visibleExpenses.length > 0 ? visibleExpenses.map((row, idx) => (
                        period !== 'Daily' ? (
                          <Box key={
                            row.id 
                              ? `exp-${row.id}` 
                              : `exp-${row.date}-${row.expense}-${row.amountNumber}`
                          } sx={{ display: 'flex', px: 2, py: 1, alignItems: 'center', backgroundColor: (theme) => theme.palette.mode === 'dark' ? theme.palette.background.default : '#f9fafc', borderRadius: '10px' }}>
                            <Box sx={{ flex: 3, textAlign: 'left', color: (theme) => theme.palette.mode === 'dark' ? theme.palette.text.secondary : '#6d6b80' }}>{row.label || (period === 'Monthly' ? new Date(row.date).toLocaleString(undefined, { month: 'long', year: 'numeric' }) : String(new Date(row.date).getFullYear()))}</Box>
                              <Box sx={{ flex: 1, textAlign: 'right', color: (theme) => theme.palette.mode === 'dark' ? theme.palette.text.secondary : '#6d6b80' }}>{row.amount}</Box>
                          </Box>
                        ) : (
                          <Box key={
                            row.id
                              ? `exp-${row.id}`
                              : `exp-${row.date}-${row.expense}-${row.amountNumber}`
                          } sx={{ display: 'flex', px: 2, py: 1, alignItems: 'center', backgroundColor: (theme) => theme.palette.mode === 'dark' ? theme.palette.background.default : '#f9fafc', borderRadius: '10px' }}>
                            <Box sx={{ flex: 2, textAlign: 'left', color: (theme) => theme.palette.mode === 'dark' ? theme.palette.text.secondary : '#6d6b80' }}>{formatLongDate(row.date)}</Box>
                            <Box sx={{ flex: 1, textAlign: 'left', color: (theme) => theme.palette.mode === 'dark' ? theme.palette.text.secondary : '#6d6b80' }}>{row.expense}</Box>
                            <Box sx={{ flex: 0.8, textAlign: 'left', color: (theme) => theme.palette.mode === 'dark' ? theme.palette.text.secondary : '#6d6b80' }}>{row.category}</Box>
                            <Box sx={{ flex: 3, textAlign: 'left', color: (theme) => theme.palette.mode === 'dark' ? theme.palette.text.secondary : '#6d6b80', pr: 1 }}>
                              <Box component="span" sx={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.notes || ''}>
                                {row.notes && String(row.notes).trim() !== '' ? row.notes : '-'}
                              </Box>
                            </Box>
                            <Box sx={{ flex: 1, textAlign: 'right', color: (theme) => theme.palette.mode === 'dark' ? theme.palette.text.secondary : '#6d6b80' }}>{row.amount}</Box>
                          </Box>
                        )
                      )) : (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4, backgroundColor: (theme) => theme.palette.mode === 'dark' ? theme.palette.background.default : '#f9fafc', borderRadius: '10px' }}>
                            <Box sx={{ display: 'flex', px: 2, py: 1, alignItems: 'center', backgroundColor: (theme) => theme.palette.mode === 'dark' ? theme.palette.background.default : '#f9fafc', borderRadius: '10px', width: '100%', maxWidth: 760 }}>
                            {period !== 'Daily' ? (
                              <>
                                <Box sx={{ flex: 3, textAlign: 'left', color: (theme) => theme.palette.mode === 'dark' ? theme.palette.text.secondary : '#9aa0b4', fontStyle: 'italic' }}>{exampleRowExpenses.label}</Box>
                                <Box sx={{ flex: 1, textAlign: 'right', color: (theme) => theme.palette.mode === 'dark' ? theme.palette.text.secondary : '#9aa0b4', fontStyle: 'italic' }}>{exampleRowExpenses.amount}</Box>
                              </>
                            ) : (
                              <>
                                <Box sx={{ flex: 2, textAlign: 'left', color: (theme) => theme.palette.mode === 'dark' ? theme.palette.text.secondary : '#9aa0b4', fontStyle: 'italic' }}>{exampleRowExpenses.label}</Box>
                                <Box sx={{ flex: 2 }} />
                                <Box sx={{ flex: 1, textAlign: 'right', color: (theme) => theme.palette.mode === 'dark' ? theme.palette.text.secondary : '#9aa0b4', fontStyle: 'italic' }}>{exampleRowExpenses.amount}</Box>
                              </>
                            )}
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Box>
                }
                pagination={
                  <Box sx={{ mt: 2, mb: 2, px: 3, pt: 0, pb: 0 }}>
                    <Pagination page={page} totalPages={totalPagesExpenses} onPageChange={handlePageChange} rowsPerPage={rowsPerPage} onRowsPerPageChange={handleRowsPerPageChange} activeColor="#c23b3b" activeHoverColor="#a02f2f" />
                  </Box>
                }
                grayMinHeight={'450px'}
                whiteMinHeight={'560px'}
              />
            </Grid>

            <Grid item xs={12} md={5} sx={{ width: '38.5%' }}>
              {/* Right Panel: Metrics and Chart */}
              <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                <Paper elevation={3} sx={{ backgroundColor: '#c23b3b', color: 'white', p: 2, textAlign: 'center', borderRadius: 2, flex: 1 }}>
                  <Typography variant="h5" fontWeight="bold">{formatCurrency(expenseTotal)}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>{period === 'Daily' ? 'Daily Expenses' : period === 'Monthly' ? 'Monthly Expenses' : 'Yearly Expenses'}</Typography>
                </Paper>
                <Button fullWidth variant="contained" onClick={openExpenseDialog} sx={{ borderRadius: '8px', backgroundColor: '#0056b3', fontSize: '18px', color: 'white', fontWeight: 600, flex: 1 }}>Add Expense</Button>
              </Box>
              
              <Paper elevation={3} sx={{ p: 3, height: '405px', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" fontWeight="bold" textAlign="center" sx={{ mb: 1 }}>{topServicesTitle}</Typography>
                <Typography variant="caption" display="block" color="text.secondary" textAlign="center" sx={{ mb: 2 }}>{rightPanelRangeText(aggregatedExpenses)}</Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                  <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', justifyContent: 'center' }}>
                    <Box sx={{ flex: '0 0 240px', display: 'flex', justifyContent: 'center' }}>
                      <PieSVG data={expensePieData} size={240} />
                    </Box>
                    
                    <Box sx={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {(expensePieData || []).map((d) => (
                        <Box key={d.name} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{ width: 14, height: 14, backgroundColor: (theme) => theme.palette.mode === 'dark' ? theme.palette.background.paper : d.color, borderRadius: 1, flexShrink: 0 }} />
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={600} noWrap>{d.name}</Typography>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                              <Typography variant="body2" fontWeight={500} color="text.primary">{formatCurrency(d.value)}</Typography>
                              <Typography variant="caption" color="text.secondary">({(d.percent * 100).toFixed(1)}%)</Typography>
                            </Box>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        )}

      </DashboardContainer>

      {/* Modals for consistency */}
      <AddService
        open={showServiceModal}
        onClose={() => setShowServiceModal(false)}
        handleAddService={handleAddService}
      />

      <AddPackage
        open={showPackageModal}
        onClose={() => setShowPackageModal(false)}
        onAddPackage={handleAddPackage}
      />

      <AddPatientRecord open={showPatientModal} onClose={() => setShowPatientModal(false)} />

      {/* QuickActionButton */}
      <QuickActionButton
        onAddPatientRecord={handleAddPatientRecord}
        onAddAppointment={handleAddAppointment}
      />
      <AddExpenseDialog open={showExpenseModal} onClose={closeExpenseDialog} onSubmit={handleExpenseSubmit} />
    </Box>
  );
}

export default SalesDashboard;
