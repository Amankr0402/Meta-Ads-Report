/**
 * PlatformBreakdown.jsx
 * Pie chart showing spend distribution by platform (Facebook / Instagram / Audience Network).
 */

import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { useMemo } from 'react';
import { sumField } from '../utils/aggregators';
import { formatCurrency, formatPercent } from '../utils/formatters';
import styles from '../styles/Charts.module.css';

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)', padding: '10px 14px',
      boxShadow: 'var(--shadow-md)', fontSize: 12,
    }}>
      <div style={{ fontWeight: 600, color: item.payload.fill, marginBottom: 4 }}>{item.name}</div>
      <div style={{ color: 'var(--text-primary)' }}>{formatCurrency(item.value)}</div>
      <div style={{ color: 'var(--text-muted)' }}>{formatPercent(item.payload.pct, 1)} of total</div>
    </div>
  );
}

export function PlatformBreakdown({ filteredData }) {
  const chartData = useMemo(() => {
    if (!filteredData?.length) return [];

    // Group by platform
    const groups = {};
    for (const row of filteredData) {
      const key = row.platform || 'Unknown';
      if (!groups[key]) groups[key] = [];
      groups[key].push(row);
    }

    const total = filteredData.reduce((s, r) => s + (r.spend || 0), 0);

    return Object.entries(groups)
      .map(([platform, rows]) => {
        const spend = sumField(rows, 'spend');
        return { name: platform, value: spend, pct: total > 0 ? (spend / total) * 100 : 0 };
      })
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [filteredData]);

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <div>
          <div className={styles.chartTitle}>Platform Breakdown</div>
          <div className={styles.chartSubtitle}>Spend by Platform</div>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className={styles.chartEmpty}>No platform data available</div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={110}
              paddingAngle={3}
              dataKey="value"
            >
              {chartData.map((entry, idx) => (
                <Cell key={entry.name} fill={COLORS[idx % COLORS.length]} stroke="none" />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value) => (
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
