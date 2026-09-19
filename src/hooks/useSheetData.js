/**
 * useSheetData.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Fetches, caches, and auto-refreshes data from the Google Sheet.
 *
 * RETURNS:
 *   {
 *     data:        Array<Object> | null,  // parsed rows (null until first load)
 *     loading:     boolean,               // true during initial fetch only
 *     refreshing:  boolean,               // true during background re-fetches
 *     error:       Error | null,          // last fetch error (null if OK)
 *     lastUpdated: Date | null,           // timestamp of last successful fetch
 *     refresh:     () => void,            // manual refresh trigger
 *   }
 *
 * CACHING:
 *   - Stores the last successful result in a ref so stale data is shown
 *     during background refreshes (no blank screen on re-fetch).
 *
 * AUTO-REFRESH:
 *   - Polls every VITE_REFRESH_INTERVAL ms (default 5 minutes).
 *   - Pauses when the browser tab is hidden, resumes on visibility.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchSheetData } from '../services/sheetService';

const REFRESH_INTERVAL = Number(import.meta.env.VITE_REFRESH_INTERVAL) || 300_000; // 5 min

export function useSheetData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Keep a stable ref to the last good data so we never flash a blank state
  const lastGoodData = useRef(null);
  const intervalRef = useRef(null);
  const isMounted = useRef(true);

  const fetchData = useCallback(async (isManual = false) => {
    const isFirstLoad = lastGoodData.current === null;

    if (isFirstLoad) setLoading(true);
    else setRefreshing(true);

    try {
      const rows = await fetchSheetData();
      if (!isMounted.current) return;

      lastGoodData.current = rows;
      setData(rows);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      if (!isMounted.current) return;
      console.error('[useSheetData] Fetch failed:', err);
      setError(err);
      // Keep stale data visible — don't clear it on error
      if (lastGoodData.current) {
        setData(lastGoodData.current);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  // Start / stop the polling interval
  const startPolling = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      // Only refresh if the tab is visible
      if (!document.hidden) {
        fetchData();
      }
    }, REFRESH_INTERVAL);
  }, [fetchData]);

  // Initial fetch + setup polling
  useEffect(() => {
    isMounted.current = true;
    fetchData();
    startPolling();

    // Resume polling when tab becomes visible again
    const handleVisibility = () => {
      if (!document.hidden) {
        fetchData();
        startPolling();
      } else {
        // Pause polling when hidden to save resources
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      isMounted.current = false;
      clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchData, startPolling]);

  /** Manual refresh — resets the polling timer too */
  const refresh = useCallback(() => {
    fetchData(true);
    startPolling();
  }, [fetchData, startPolling]);

  return { data, loading, refreshing, error, lastUpdated, refresh };
}
