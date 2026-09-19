/**
 * TrendChart.jsx
 * Area/Line chart showing Spend, Clicks, CTR, CPM over time.
 * Uses Recharts AreaChart.
 *
 * Props:
 *   data {Array<Object>} — daily aggregated rows from aggregateByDate()
 */

import { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import styles from '../styles/Charts.module.css';
import { formatCurrency, formatNumber, formatPercent } from '../utils/formatters';

const METRICS = [
  { key: 'spend',    label: 'Spend',    color: '#6366f1', format: 'currency', yAxis: 'left'  },
  { key: 'linkClicks', label: 'Link Clicks', color: '#06b6d4', format: 'number',   yAxis: 'left'  },
  { key: 'ctrLink',  label: 'CTR (Link)', color: '#10b981', format: 'percent',   yAxis: 'right' },
  { key: 'cpm',      label: 'CPM',      color: '#f59e0b', format: 'currency', yAxis: 'right' },
];

function formatTick(value, metricFormat) {
  if (metricFormat === 'currency') return formatCurrency(value);
  if (metricFormat === 'percent')  return formatPercent(value);
  return formatNumber(value);
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      padding: '10px 14px',
      boxShadow: 'var(--shadow-md)',
      fontSize: 12,
    }}>
      <div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>
        {label ? (() => { try { return format(parseISO(label), 'dd MMM yyyy'); } catch { return label; } })() : ''}
      </div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.color, marginBottom: 3, display: 'flex', gap: 8, justifyContent: 'space-between' }}>
          <span>{p.name}</span>
          <span style={{ fontWeight: 600 }}>{p.value !== undefined ? formatTick(p.value, METRICS.find((m) => m.key === p.dataKey)?.format) : '—'}</span>
        </div>
      ))}
    </div>
  );
}

export function TrendChart({ data = [] }) {
  const [active, setActive] = useState(METRICS.map((m) => m.key));

  const toggleMetric = (key) => {
    setActive((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  if (!data.length) {
    return (
      <div className={styles.chartCard}>
        <div className={styles.chartTitle}>Spend & Performance Trend</div>
        <div className={styles.chartEmpty}>No data for selected period</div>
      </div>
    );
  }

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <div>
          <div className={styles.chartTitle}>Spend & Performance Trend</div>
          <div className={styles.chartSubtitle}>Daily metrics over selected date range</div>
        </div>
        <div className={styles.chartActions}>
          {METRICS.map((m) => (
            <button
              key={m.key}
              className={`${styles.chartToggleBtn} ${active.includes(m.key) ? styles.active : ''}`}
              style={active.includes(m.key) ? { background: m.color, borderColor: m.color } : {}}
              onClick={() => toggleMetric(m.key)}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <defs>
            {METRICS.map((m) => (
              <linearGradient key={m.key} id={`grad-${m.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={m.color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={m.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />

          <XAxis
            dataKey="date"
            tickFormatter={(v) => { try { return format(parseISO(v), 'dd MMM'); } catch { return v; } }}
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            yAxisId="left"
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => formatCompactTick(v)}
            width={55}
          />

          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v.toFixed(2)}`}
            width={45}
          />

          <Tooltip content={<CustomTooltip />} />

          {METRICS.filter((m) => active.includes(m.key)).map((m) => (
            <Area
              key={m.key}
              yAxisId={m.yAxis}
              type="monotone"
              dataKey={m.key}
              name={m.label}
              stroke={m.color}
              strokeWidth={2}
              fill={`url(#grad-${m.key})`}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function formatCompactTick(v) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `${(v / 1_000).toFixed(0)}K`;
  return v;
}
