"use client";

import React from "react";
import styles from "./WidgetGrid.module.scss";

interface WidgetGridProps {
  /** Number of grid columns (default: 12) */
  cols?: number;
  /** Height of each grid row in px (default: 80) */
  rowH?: number;
  children?: React.ReactNode;
  className?: string;
}

/**
 * WidgetGrid
 *
 * CSS Grid container for the widget system. Exposes column count and row
 * height as CSS custom properties so WidgetContainer can read them during
 * resize calculations.
 */
export default function WidgetGrid({
  cols = 12,
  rowH = 80,
  children,
  className,
}: WidgetGridProps) {
  return (
    <div
      className={[styles.widgetGrid, className ?? ""].filter(Boolean).join(" ")}
      data-widget-grid
      style={
        {
          "--widget-cols": cols,
          "--widget-row-h": `${rowH}px`,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
