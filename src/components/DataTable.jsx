/**
 * DataTable.jsx
 * Reusable sortable, searchable, paginated table.
 *
 * Props:
 *   title       {string}          — table heading
 *   columns     {Array}           — [{ key, label, format?, align?, sortable?, width? }]
 *   data        {Array<Object>}   — row objects
 *   averages    {Object}          — field → account avg (for conditional formatting)
 *   pageSize    {number}          — rows per page (default 25)
 *   searchable  {boolean}
 *   emptyMsg    {string}
 */

import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, Search } from 'lucide-react';
import styles from '../styles/DataTable.module.css';
import {
  formatCurrency, formatPercent, formatNumber, formatRoas, formatCompact,
} from '../utils/formatters';

function formatCell(value, format) {
  if (value === null || value === undefined || value === '') return '—';
  switch (format) {
    case 'currency': return formatCurrency(value);
    case 'percent':  return formatPercent(value);
    case 'roas':     return formatRoas(value);
    case 'compact':  return formatCompact(value);
    case 'number':   return formatNumber(value);
    default:         return String(value);
  }
}

export function DataTable({
  title,
  columns = [],
  data = [],
  averages = {},
  pageSize = 25,
  searchable = true,
  emptyMsg = 'No data for the selected filters.',
}) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('desc');
  const [search, setSearch]   = useState('');
  const [page, setPage]       = useState(1);

  // ── Search ───────────────────────────────────────────────────────────────
  const searched = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => String(row[col.key] ?? '').toLowerCase().includes(q))
    );
  }, [data, search, columns]);

  // ── Sort ─────────────────────────────────────────────────────────────────
  const sorted = useMemo(() => {
    if (!sortKey) return searched;
    return [...searched].sort((a, b) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [searched, sortKey, sortDir]);

  // ── Pagination ───────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = sorted.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
    setPage(1);
  };

  const handleSearch = (e) => { setSearch(e.target.value); setPage(1); };

  // ── Conditional formatting helper ────────────────────────────────────────
  function getCellClass(col, value) {
    if (!col.conditional || averages[col.key] === undefined) return '';
    const avg = averages[col.key];
    if (avg === 0) return '';
    // For "lower is better" metrics (cost fields), invert the logic
    const lowerIsBetter = ['cpcAll','cpcLink','cpm','costPerLead','costPerResult'].includes(col.key);
    const isAbove = value > avg * 1.1;
    const isBelow = value < avg * 0.9;
    if (lowerIsBetter) {
      return isAbove ? styles.cellLow : isBelow ? styles.cellHigh : '';
    }
    return isAbove ? styles.cellHigh : isBelow ? styles.cellLow : '';
  }

  // ── Page number list ─────────────────────────────────────────────────────
  const pageNumbers = [];
  const startPage = Math.max(1, page - 2);
  const endPage   = Math.min(totalPages, page + 2);
  for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);

  return (
    <div className={styles.wrapper}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <span className={styles.toolbarTitle}>{title}</span>
        {searchable && (
          <div className={styles.searchWrapper}>
            <Search size={14} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              placeholder="Search..."
              value={search}
              onChange={handleSearch}
            />
          </div>
        )}
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {sorted.length} rows
        </span>
      </div>

      {/* Table */}
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={col.sortable !== false ? styles.sortable : ''}
                  style={{ textAlign: col.align ?? 'left', width: col.width }}
                  onClick={col.sortable !== false ? () => handleSort(col.key) : undefined}
                >
                  {col.label}
                  {col.sortable !== false && (
                    <span className={`${styles.sortIcon} ${sortKey === col.key ? styles.active : ''}`}>
                      {sortKey === col.key
                        ? sortDir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />
                        : <ChevronsUpDown size={11} />}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className={styles.emptyState}>
                  {emptyMsg}
                </td>
              </tr>
            ) : (
              paged.map((row, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={getCellClass(col, row[col.key])}
                      style={{ textAlign: col.align ?? 'left' }}
                    >
                      {formatCell(row[col.key], col.format)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <span>
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, sorted.length)} of {sorted.length}
          </span>
          <div className={styles.pageControls}>
            <button className={styles.pageBtn} disabled={page === 1} onClick={() => setPage(1)}>«</button>
            <button className={styles.pageBtn} disabled={page === 1} onClick={() => setPage((p) => p - 1)}>‹</button>
            {pageNumbers.map((n) => (
              <button
                key={n}
                className={`${styles.pageBtn} ${n === page ? styles.active : ''}`}
                onClick={() => setPage(n)}
              >
                {n}
              </button>
            ))}
            <button className={styles.pageBtn} disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>›</button>
            <button className={styles.pageBtn} disabled={page === totalPages} onClick={() => setPage(totalPages)}>»</button>
          </div>
        </div>
      )}
    </div>
  );
}
