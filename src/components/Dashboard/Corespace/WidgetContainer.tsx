"use client";

import React, { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import styles from "./WidgetContainer.module.scss";

type Tier = "atom" | "molecule" | "neuron" | "quantum";

const TIER_ORDER: Record<Tier, number> = {
  atom: 0,
  molecule: 1,
  neuron: 2,
  quantum: 3,
};

const TIER_LABELS: Record<Tier, string> = {
  atom: "Atom",
  molecule: "Molecule",
  neuron: "Neuron",
  quantum: "Quantum",
};

interface WidgetContainerProps {
  id: string;
  title: string;
  tier: Tier;
  userTier: Tier;
  defaultW?: number;
  defaultH?: number;
  children?: React.ReactNode;
  className?: string;
}

// ── SVG icons (inline, no extra dep) ─────────────────────────────────────────

function IconGrip() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor">
      <circle cx="5" cy="4" r="1.3" />
      <circle cx="5" cy="8" r="1.3" />
      <circle cx="5" cy="12" r="1.3" />
      <circle cx="11" cy="4" r="1.3" />
      <circle cx="11" cy="8" r="1.3" />
      <circle cx="11" cy="12" r="1.3" />
    </svg>
  );
}

function IconChevronDown() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4,6 8,10 12,6" />
    </svg>
  );
}

function IconChevronUp() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4,10 8,6 12,10" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="2.2" />
      <path d="M8 1.5v1.4M8 13.1v1.4M1.5 8h1.4M13.1 8h1.4M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function IconResize() {
  return (
    <svg viewBox="0 0 10 10" fill="currentColor">
      <path d="M2 9 L9 9 L9 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M5 9 L9 9 L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function WidgetContainer({
  id,
  title,
  tier,
  userTier,
  defaultW = 4,
  defaultH = 3,
  children,
  className,
}: WidgetContainerProps) {
  const isLocked = TIER_ORDER[tier] > TIER_ORDER[userTier];
  const [collapsed, setCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Resize state
  const [gridW, setGridW] = useState(defaultW);
  const [gridH, setGridH] = useState(defaultH);
  const resizingRef = useRef(false);
  const resizeStartRef = useRef({ x: 0, y: 0, w: defaultW, h: defaultH });
  const containerRef = useRef<HTMLDivElement>(null);

  const onResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      resizingRef.current = true;
      resizeStartRef.current = { x: e.clientX, y: e.clientY, w: gridW, h: gridH };

      const onMouseMove = (ev: MouseEvent) => {
        if (!resizingRef.current) return;
        const grid = containerRef.current?.closest("[data-widget-grid]");
        if (!grid) return;
        const gridRect = (grid as HTMLElement).getBoundingClientRect();
        const cellW = gridRect.width / parseInt(getComputedStyle(grid as HTMLElement).getPropertyValue("--widget-cols") || "12");
        const cellH = parseInt(getComputedStyle(grid as HTMLElement).getPropertyValue("--widget-row-h") || "80");
        const dx = ev.clientX - resizeStartRef.current.x;
        const dy = ev.clientY - resizeStartRef.current.y;
        setGridW(Math.max(2, Math.round(resizeStartRef.current.w + dx / cellW)));
        setGridH(Math.max(2, Math.round(resizeStartRef.current.h + dy / cellH)));
      };

      const onMouseUp = () => {
        resizingRef.current = false;
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [gridW, gridH]
  );

  const classNames = [
    styles.widget,
    collapsed ? styles.collapsed : "",
    isLocked ? styles.locked : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <motion.div
      ref={containerRef}
      className={classNames}
      data-widget-id={id}
      style={{
        gridColumn: `span ${gridW}`,
        gridRow: `span ${gridH}`,
      }}
      drag
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={{ left: 0, top: 0, right: 0, bottom: 0 }}
      dragListener={false}
      whileDrag={{ opacity: 0.85, scale: 1.01, zIndex: 50 }}
      layout={false}
    >
      {/* Header */}
      <div className={styles.widgetHeader}>
        {/* Drag handle triggers motion drag */}
        <motion.div
          className={styles.dragHandle}
          dragListener
          style={{ cursor: "grab" }}
        >
          <IconGrip />
        </motion.div>

        <span className={styles.widgetTitle}>{title}</span>

        {/* Tier badge */}
        <span className={`${styles.tierBadge} ${styles[tier]}`}>
          {TIER_LABELS[tier]}
        </span>

        {/* Actions */}
        <div className={styles.headerActions}>
          <button
            className={styles.actionBtn}
            title="Settings"
            onClick={() => setSettingsOpen((v) => !v)}
            aria-pressed={settingsOpen}
          >
            <IconSettings />
          </button>
          <button
            className={styles.actionBtn}
            title={collapsed ? "Expand" : "Collapse"}
            onClick={() => setCollapsed((v) => !v)}
          >
            {collapsed ? <IconChevronDown /> : <IconChevronUp />}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className={styles.widgetBody}>{children}</div>

      {/* Resize handle */}
      {!collapsed && (
        <div className={styles.resizeHandle} onMouseDown={onResizeMouseDown} title="Resize">
          <IconResize />
        </div>
      )}

      {/* Lock overlay */}
      {isLocked && (
        <div className={styles.lockOverlay}>
          <div className={styles.lockIcon}>
            <IconLock />
          </div>
          <p className={styles.lockText}>
            This widget requires the <strong>{TIER_LABELS[tier]}</strong> plan.
          </p>
          <button className={styles.upgradePill}>Upgrade to unlock</button>
        </div>
      )}
    </motion.div>
  );
}
