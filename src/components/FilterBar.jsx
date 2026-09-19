/**
 * FilterBar.jsx
 * All filter controls for the dashboard.
 * Reads/writes filter state via FilterContext — no local state for filter values.
 *
 * Controls:
 *   - Date presets + custom date picker
 *   - Campaign multi-select
 *   - Ad Set multi-select (dependent on campaigns)
 *   - Platform, Objective, Status single-select
 *   - Reset Filters button
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, X, RotateCcw } from 'lucide-react';
import { useFilters } from '../context/FilterContext';
import { DATE_PRESETS, formatDateDisplay } from '../utils/dateHelpers';
import styles from '../styles/FilterBar.module.css';

// ── Multi-select dropdown component ─────────────────────────────────────────
function MultiSelect({ label, options, selected, onChange, placeholder = 'All' }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (val) => {
    onChange(
      selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val]
    );
  };

  const displayLabel = selected.length === 0
    ? placeholder
    : selected.length === 1
      ? selected[0]
      : `${selected.length} selected`;

  return (
    <div className={styles.filterGroup}>
      <span className={styles.filterLabel}>{label}</span>
      <div className={styles.multiSelectContainer} ref={ref}>
        <button
          className={`${styles.multiSelectTrigger} ${open ? styles.open : ''}`}
          onClick={() => setOpen(!open)}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {displayLabel}
          </span>
          {selected.length > 0 && (
            <span className={styles.badge}>{selected.length}</span>
          )}
          <ChevronDown size={12} style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: '150ms' }} />
        </button>

        {open && (
          <div className={styles.multiSelectDropdown}>
            {options.length > 6 && (
              <div className={styles.dropdownSearch}>
                <input
                  className={styles.dropdownSearchInput}
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                />
              </div>
            )}
            {filtered.length === 0 && (
              <div style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)' }}>
                No options found
              </div>
            )}
            {filtered.map((opt) => (
              <label
                key={opt}
                className={`${styles.dropdownOption} ${selected.includes(opt) ? styles.selected : ''}`}
              >
                <input
                  type="checkbox"
                  className={styles.dropdownCheckbox}
                  checked={selected.includes(opt)}
                  onChange={() => toggle(opt)}
                />
                {opt}
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Single select ────────────────────────────────────────────────────────────
function SingleSelect({ label, options, value, onChange, allLabel = 'All' }) {
  return (
    <div className={styles.filterGroup}>
      <span className={styles.filterLabel}>{label}</span>
      <div className={styles.selectWrapper}>
        <select
          className={styles.filterSelect}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">{allLabel}</option>
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <ChevronDown size={12} className={styles.selectArrow} />
      </div>
    </div>
  );
}

// ── Main FilterBar ───────────────────────────────────────────────────────────
export function FilterBar({ filterOptions }) {
  const { filters, dispatch } = useFilters();

  const setPreset = useCallback((key) => {
    dispatch({ type: 'SET_PRESET', payload: key });
  }, [dispatch]);

  const setCustomFrom = (e) => {
    dispatch({ type: 'SET_CUSTOM_RANGE', payload: { from: e.target.value ? new Date(e.target.value) : null, to: filters.dateTo } });
  };

  const setCustomTo = (e) => {
    dispatch({ type: 'SET_CUSTOM_RANGE', payload: { from: filters.dateFrom, to: e.target.value ? new Date(e.target.value) : null } });
  };

  const reset = () => dispatch({ type: 'RESET_FILTERS' });

  return (
    <div className={styles.bar}>
      {/* ── Date presets ── */}
      <div className={styles.presetGroup}>
        {DATE_PRESETS.filter((p) => p.key !== 'custom').map((preset) => (
          <button
            key={preset.key}
            className={`${styles.presetBtn} ${filters.preset === preset.key ? styles.active : ''}`}
            onClick={() => setPreset(preset.key)}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* ── Custom date range ── */}
      <div className={styles.dateInputGroup}>
        <input
          type="date"
          className={styles.dateInput}
          value={filters.dateFrom ? filters.dateFrom.toISOString().slice(0, 10) : ''}
          onChange={setCustomFrom}
          title="Start date"
        />
        <span>→</span>
        <input
          type="date"
          className={styles.dateInput}
          value={filters.dateTo ? filters.dateTo.toISOString().slice(0, 10) : ''}
          onChange={setCustomTo}
          title="End date"
        />
      </div>

      {/* ── Campaign ── */}
      <MultiSelect
        label="Campaign"
        options={filterOptions?.campaigns ?? []}
        selected={filters.campaigns}
        onChange={(v) => dispatch({ type: 'SET_CAMPAIGNS', payload: v })}
        placeholder="All Campaigns"
      />

      {/* ── Ad Set ── */}
      <MultiSelect
        label="Ad Set"
        options={filterOptions?.adSets ?? []}
        selected={filters.adSets}
        onChange={(v) => dispatch({ type: 'SET_AD_SETS', payload: v })}
        placeholder="All Ad Sets"
      />

      {/* ── Platform ── */}
      <MultiSelect
        label="Platform"
        options={filterOptions?.platforms ?? []}
        selected={filters.platforms}
        onChange={(v) => dispatch({ type: 'SET_PLATFORMS', payload: v })}
        placeholder="All Platforms"
      />

      {/* ── Objective ── */}
      <MultiSelect
        label="Objective"
        options={filterOptions?.objectives ?? []}
        selected={filters.objectives}
        onChange={(v) => dispatch({ type: 'SET_OBJECTIVES', payload: v })}
        placeholder="All Objectives"
      />

      {/* ── Status ── */}
      <MultiSelect
        label="Status"
        options={filterOptions?.statuses ?? []}
        selected={filters.statuses}
        onChange={(v) => dispatch({ type: 'SET_STATUSES', payload: v })}
        placeholder="All Statuses"
      />

      {/* ── Reset ── */}
      <button className={styles.resetBtn} onClick={reset}>
        <RotateCcw size={12} />
        Reset
      </button>
    </div>
  );
}
