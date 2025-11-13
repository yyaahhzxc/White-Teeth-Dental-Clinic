import React, { useState } from 'react';
import { Box, Container, Typography, Grid, Button, Paper, Collapse, FormControl, Select, MenuItem } from '@mui/material';
import AddExpenseDialog from './add-expense';
import { ArrowDropDown } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

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
      backgroundColor: 'white',
      borderRadius: '20px',
      boxShadow: '0 -4px 10px rgba(0, 0, 0, 0.1)',
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

// Minimal SVG pie renderer
function PieSVG({ data = [], size = 150, centerLabelMain = '', centerLabelSub = '' }) {
  const radius = size / 2 - 4;
  const center = size / 2;
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let startAngle = -90; // start at top

  const segments = data.map((d) => {
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
    return { path, color: d.color, value: d.value, name: d.name };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {segments.map((s, i) => (
        <path key={i} d={s.path} fill={s.color} stroke="#ffffff" strokeWidth="0.5" />
      ))}
      <circle cx={center} cy={center} r={radius * 0.45} fill="#ffffff" />
      {/* optional center labels (main and sub) */}
      {centerLabelMain ? (
        <g>
          <text x={center} y={center - 6} textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 13, fontWeight: 800, fill: '#333' }}>{centerLabelMain}</text>
          {centerLabelSub ? (
            <text x={center} y={center + 12} textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 11, fill: '#666' }}>{centerLabelSub}</text>
          ) : null}
        </g>
      ) : null}
    </svg>
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

  // Table / filter / pagination state to mirror Invoice page behavior
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [expenses, setExpenses] = useState(initialExpenseData);
  const [showFilterBox, setShowFilterBox] = useState(false);
  const [activeFilters, setActiveFilters] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const categoryFilteredData = revenueData;
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
        label = parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
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

  const aggregated = aggregateData(categoryFilteredData || [], period);

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
  const handleExpenseSubmit = (payload) => {
    // Placeholder: wire to backend or update state
    // payload: { description, amount, date }
    console.log('Add expense (placeholder)', payload);
    // Append to row-level expenses state
    const isoDate = payload.date || new Date().toISOString().split('T')[0];
    const amountNumber = Number(payload.amount || 0) || 0;
    const newItem = {
      date: isoDate,
      expense: payload.expense || payload.description || 'Expense',
      category: payload.category || 'General',
      amountNumber,
      amount: `Php ${amountNumber.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    };
    setExpenses((s) => [newItem, ...s]);
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

  const filteredExpensesRows = (expensesRows || []).filter((item) => {
    if (!search) return true;
    const q = search.toLowerCase();
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
  const topServicesTitle = period === 'Daily' ? 'Top Services Availed Today' : period === 'Monthly' ? 'Top Services Availed This Month' : 'Top Services Availed This Year';
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

  return (
    <Box
      sx={{
        height: '70%',
        backgroundColor: '#2148c0', // Blue background
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
          sx={{
            color: 'white',
            fontWeight: 800,
            fontSize: '39.14px',
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
              bgcolor: activeTab === 'revenue' ? '#4A69BD' : 'transparent',
              color: activeTab === 'revenue' ? '#fff' : '#4A69BD',
              border: activeTab === 'revenue' ? '1px solid #4A69BD' : '1px solid #e0e0e0',
              borderRadius: '10px',
              px: 2,
              textTransform: 'none',
            }}
          >
            Revenue
          </Button>
          <Button
            onClick={() => { setActiveTab('expenses'); setPage(0); }}
            sx={{
              bgcolor: activeTab === 'expenses' ? '#c23b3b' : 'transparent',
              color: activeTab === 'expenses' ? '#fff' : '#c23b3b',
              border: activeTab === 'expenses' ? '1px solid #c23b3b' : '1px solid #e0e0e0',
              borderRadius: '10px',
              px: 2,
              textTransform: 'none',
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
                  <>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', px: 3, pt: 3, pb: 2, gap: 2, boxSizing: 'border-box' }}>
                      <SearchBar value={search} onChange={setSearch} placeholder="Search by date" searchFields={["date"]} data={categoryFilteredData} />
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'flex-end', width: 'auto', p: 0, m: 0, flex: 1 }}>
                        <FilterButton onClick={() => setShowFilterBox(v => !v)} />
                        <FormControl size="small" sx={{ minWidth: 120, ml: 1 }}>
                          <Select
                            value={period}
                            onChange={(e) => { setPeriod(e.target.value); setPage(0); }}
                            displayEmpty
                            inputProps={{ 'aria-label': 'period-select' }}
                            sx={{
                              backgroundColor: '#4A69BD',
                              color: 'white',
                              border: '1px solid #4A69BD',
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
                              '&:hover': { backgroundColor: '#2148c0', border: '1px solid #2148c0' },
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
                      {visible.length > 0 ? visible.map((row) => (
                        <Box key={row.dateSort || row.label} sx={{ display: 'flex', px: 2, py: 1, alignItems: 'center', backgroundColor: '#f9fafc', borderRadius: '10px' }}>
                          <Box sx={{ flex: 2, textAlign: 'left', color: '#6d6b80' }}>{row.label || row.date}</Box>
                          <Box sx={{ flex: 1, textAlign: 'right', color: '#6d6b80' }}>{row.revenue}</Box>
                        </Box>
                      )) : (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4, backgroundColor: '#f9fafc', borderRadius: '10px' }}>
                          <Box sx={{ display: 'flex', px: 2, py: 1, alignItems: 'center', backgroundColor: '#f9fafc', borderRadius: '10px', width: '100%', maxWidth: 760 }}>
                            <Box sx={{ flex: 2, textAlign: 'left', color: '#9aa0b4', fontStyle: 'italic' }}>{exampleRow.label}</Box>
                            <Box sx={{ flex: 1, textAlign: 'right', color: '#9aa0b4', fontStyle: 'italic' }}>{exampleRow.revenue}</Box>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Box>
                }
                pagination={
                  <Box sx={{ mt: 2, mb: 2, px: 3, pt: 0, pb: 0 }}>
                    <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} rowsPerPage={rowsPerPage} onRowsPerPageChange={handleRowsPerPageChange} />
                  </Box>
                }
                grayMinHeight={'450px'}
                whiteMinHeight={'560px'}
              />
            </Grid>

            <Grid item xs={12} md={5} sx={{ width: '38.5%' }}>
              {/* Right Panel: Metrics and Chart (kept from previous content) */}
              <Paper elevation={3} sx={{ backgroundColor: '#38761D', color: 'white', p: 3, mb: 2, textAlign: 'center', borderRadius: 2 }}>
                <Typography variant="h4" fontWeight="bold">{formatCurrency(revenueTotal)}</Typography>
                <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>{periodGrossLabel}</Typography>
              </Paper>
              <Paper elevation={3} sx={{ backgroundColor: '#0056b3', color: 'white', p: 3, mb: 2, textAlign: 'center', borderRadius: 2 }}>
                <Typography variant="h4" fontWeight="bold">{formatCurrency(netTotal)}</Typography>
                <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>{periodNetLabel}</Typography>
              </Paper>
              <Paper elevation={3} sx={{ p: 2, pt: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6" fontWeight="bold">{topServicesTitle}</Typography>
                </Box>
                <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 2 }}>{rightPanelRangeText(aggregated)}</Typography>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={5} sx={{ display: 'flex', justifyContent: 'center' }}>
                    <PieSVG data={breakdownRevenue} size={140} />
                  </Grid>
                  <Grid item xs={7}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                      {breakdownRevenue.map((d) => (
                        <Box key={d.name} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1, backgroundColor: '#f3f4f6', borderRadius: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 12, height: 12, backgroundColor: d.color, borderRadius: 1 }} />
                            <Typography variant="body2">{d.name}</Typography>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="body2">{formatCurrency(d.value)}</Typography>
                            <Typography variant="caption" color="text.secondary">{(d.percent * 100).toFixed(1)}%</Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        ) : (
          <Grid container spacing={3} sx={{
            // scope button color overrides to only the actions area inside Expenses
            '& .expenses-actions .MuiButton-root': {
              backgroundColor: '#c23b3b',
              color: '#fff',
              borderColor: '#c23b3b',
              '&:hover': {
                backgroundColor: '#a02f2f',
                borderColor: '#a02f2f',
              },
            },
          }}>
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
                              backgroundColor: '#c23b3b',
                              color: 'white',
                              border: '1px solid #c23b3b',
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
                              '&:hover': { backgroundColor: '#a02f2f', border: '1px solid #a02f2f' },
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
                          sx={{ flex: '2' }}
                        />
                        <Box sx={{ flex: 2, px: 2, color: '#6d6b80' }}>Expense</Box>
                        <Box sx={{ flex: 1, px: 2, color: '#6d6b80' }}>Category</Box>
                        <SortableHeader
                          label="Amount"
                          sortKey="amountNumber"
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
                      {visibleExpenses.length > 0 ? visibleExpenses.map((row) => (
                        <Box key={row.dateSort || row.date} sx={{ display: 'flex', px: 2, py: 1, alignItems: 'center', backgroundColor: '#f9fafc', borderRadius: '10px' }}>
                          <Box sx={{ flex: 2, textAlign: 'left', color: '#6d6b80' }}>{new Date(row.date).toLocaleDateString()}</Box>
                          <Box sx={{ flex: 2, textAlign: 'left', color: '#6d6b80' }}>{row.expense}</Box>
                          <Box sx={{ flex: 1, textAlign: 'left', color: '#6d6b80' }}>{row.category}</Box>
                          <Box sx={{ flex: 1, textAlign: 'right', color: '#6d6b80' }}>{row.amount}</Box>
                        </Box>
                      )) : (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4, backgroundColor: '#f9fafc', borderRadius: '10px' }}>
                          <Box sx={{ display: 'flex', px: 2, py: 1, alignItems: 'center', backgroundColor: '#f9fafc', borderRadius: '10px', width: '100%', maxWidth: 760 }}>
                            <Box sx={{ flex: 2, textAlign: 'left', color: '#9aa0b4', fontStyle: 'italic' }}>{exampleRowExpenses.label}</Box>
                            <Box sx={{ flex: 2 }} />
                            <Box sx={{ flex: 1, textAlign: 'right', color: '#9aa0b4', fontStyle: 'italic' }}>{exampleRowExpenses.amount}</Box>
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
              {/* Right Panel: Metrics and Chart (copied from Revenue view) */}
              <Paper elevation={3} sx={{ backgroundColor: '#c23b3b', color: 'white', p: 3, mb: 2, textAlign: 'center', borderRadius: 2 }}>
                <Typography variant="h4" fontWeight="bold">{formatCurrency(expenseTotal)}</Typography>
                <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>{period === 'Daily' ? 'Daily Expenses' : period === 'Monthly' ? 'Monthly Expenses' : 'Yearly Expenses'}</Typography>
              </Paper>
              <Box sx={{ mb: 2 }}>
                <Button fullWidth variant="contained" onClick={openExpenseDialog} sx={{ borderRadius: '20', height: '115px', backgroundColor: '#0056b3', fontSize: '24px', color: 'white', py: 1.5 }}>Add Expense</Button>
              </Box>
              <Paper elevation={3} sx={{ p: 2, pt: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6" fontWeight="bold">{topServicesTitle}</Typography>
                </Box>
                <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 2 }}>{rightPanelRangeText(aggregatedExpenses)}</Typography>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={5} sx={{ display: 'flex', justifyContent: 'center' }}>
                    {/* Pass center labels: top category and period descriptor */}
                    <PieSVG data={expensePieData} size={140} centerLabelMain={topCategoryName} centerLabelSub={periodDescriptor} />
                  </Grid>
                  <Grid item xs={7}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                      {(expensePieData || []).map((d) => (
                        <Box key={d.name} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1, backgroundColor: '#f3f4f6', borderRadius: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 12, height: 12, backgroundColor: d.color, borderRadius: 1 }} />
                            <Typography variant="body2">{d.name}</Typography>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="body2">{formatCurrency(d.value)}</Typography>
                            <Typography variant="caption" color="text.secondary">{(d.percent * 100).toFixed(1)}%</Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Grid>
                </Grid>
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
