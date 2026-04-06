'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'pulsar-theme-override';
const LAT = 37.7749; // San Francisco default

// ─── Simplified sunrise/sunset calculator ─────────────────────────────────────
// Uses a rough linear interpolation by month rather than full astronomy.
// Daylight hours in SF range from ~9.5h (Dec) to ~14.5h (Jun).
// Sunrise ≈ solar noon − daylight/2, Sunset ≈ solar noon + daylight/2
// SF solar noon ≈ 12:00 (simplification; actual is ~12:10).

function getSunTimes(date: Date): { sunriseHour: number; sunsetHour: number } {
  const month = date.getMonth(); // 0-11
  // Approximate daylight hours by month for lat ~37.77°N
  const daylightByMonth = [9.5, 10.5, 11.75, 13.0, 14.0, 14.5, 14.25, 13.25, 12.0, 10.75, 9.75, 9.25];
  const daylight = daylightByMonth[month];
  const solarNoon = 12.0;
  const sunriseHour = solarNoon - daylight / 2;
  const sunsetHour = solarNoon + daylight / 2;
  return { sunriseHour: Math.round(sunriseHour * 10) / 10, sunsetHour: Math.round(sunsetHour * 10) / 10 };
}

function readStoredOverride(): boolean | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    if (raw === 'dark') return true;
    if (raw === 'light') return false;
    return null;
  } catch {
    return null;
  }
}

function writeStoredOverride(value: boolean | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (value === null) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, value ? 'dark' : 'light');
    }
  } catch {
    // ignore
  }
}

function computeIsDark(sunriseHour: number, sunsetHour: number): boolean {
  const now = new Date();
  const hour = now.getHours() + now.getMinutes() / 60;
  return hour < sunriseHour || hour >= sunsetHour;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface AutoThemeResult {
  /** Whether the theme should currently be dark */
  isDark: boolean;
  /** Sunrise hour (decimal, local time) */
  sunriseHour: number;
  /** Sunset hour (decimal, local time) */
  sunsetHour: number;
  /** Whether a manual override is active */
  manualOverride: boolean;
  /**
   * Set theme override.
   * - `true`  → force dark
   * - `false` → force light
   * - `null`  → revert to auto
   */
  setManualOverride: (dark: boolean | null) => void;
}

export function useAutoTheme(): AutoThemeResult {
  const [override, setOverrideState] = useState<boolean | null>(() => readStoredOverride());

  const now = new Date();
  const { sunriseHour, sunsetHour } = getSunTimes(now);

  const [autoDark, setAutoDark] = useState<boolean>(() => computeIsDark(sunriseHour, sunsetHour));

  // Poll every 60 s to recompute auto theme
  useEffect(() => {
    const tick = () => {
      const t = new Date();
      const { sunriseHour: sr, sunsetHour: ss } = getSunTimes(t);
      setAutoDark(computeIsDark(sr, ss));
    };
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  const setManualOverride = useCallback((dark: boolean | null) => {
    setOverrideState(dark);
    writeStoredOverride(dark);
  }, []);

  const isDark = override !== null ? override : autoDark;

  return {
    isDark,
    sunriseHour,
    sunsetHour,
    manualOverride: override !== null,
    setManualOverride,
  };
}
