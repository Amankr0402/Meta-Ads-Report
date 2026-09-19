/**
 * csvExport.js
 * Exports the current filtered dataset to a downloadable CSV file.
 * Uses PapaParse for reliable CSV serialization.
 */

import Papa from 'papaparse';
import { FIELD_LABELS } from '../services/sheetConfig';
import { format } from 'date-fns';

/**
 * Converts an array of row objects to a CSV download.
 *
 * @param {Array<Object>} data      - Filtered rows to export
 * @param {Array<string>} [fields]  - Optional list of field keys to include.
 *                                    Defaults to all fields in FIELD_LABELS.
 * @param {string}        [filename]- Filename without extension
 */
export function exportToCsv(data, fields = null, filename = null) {
  if (!data || data.length === 0) {
    console.warn('csvExport: no data to export');
    return;
  }

  const exportFields = fields ?? Object.keys(FIELD_LABELS);
  const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
  const resolvedFilename = filename ?? `meta_ads_export_${timestamp}`;

  // Build rows with human-readable headers
  const rows = data.map((row) => {
    const out = {};
    for (const field of exportFields) {
      const label = FIELD_LABELS[field] ?? field;
      let value = row[field];
      // Format dates as readable strings
      if (value instanceof Date) {
        value = format(value, 'yyyy-MM-dd');
      }
      out[label] = value ?? '';
    }
    return out;
  });

  const csv = Papa.unparse(rows);

  // Create a blob and trigger browser download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${resolvedFilename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
