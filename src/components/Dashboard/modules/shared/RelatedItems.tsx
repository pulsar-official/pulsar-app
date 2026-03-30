'use client'

import React, { useMemo, useState } from 'react'
import { useProductivityStore } from '@/stores/productivityStore'
import { getConnectionsFor } from '@/lib/connectionEngine'
import type { ConnectionItemType } from '@/types/connections'
import styles from './RelatedItems.module.scss'

const TYPE_ICONS: Record<ConnectionItemType, string> = {
  task: '☑',
  goal: '🎯',
  habit: '🔁',
  journal: '📓',
  event: '📅',
}

const TYPE_LABELS: Record<ConnectionItemType, string> = {
  task: 'Task',
  goal: 'Goal',
  habit: 'Habit',
  journal: 'Journal',
  event: 'Event',
}

const TYPE_PAGES: Record<ConnectionItemType, string> = {
  task: 'tasks',
  goal: 'goals',
  habit: 'habits',
  journal: 'journal',
  event: 'calendar',
}

interface RelatedItemsProps {
  itemType: ConnectionItemType
  itemId: string
  onNavigate?: (page: string) => void
  maxItems?: number
}

const RelatedItems: React.FC<RelatedItemsProps> = ({ itemType, itemId, onNavigate, maxItems = 5 }) => {
  const getSmartConnections = useProductivityStore(s => s.getSmartConnections)
  const [expanded, setExpanded] = useState(false)

  const related = useMemo(() => {
    const all = getSmartConnections()
    return getConnectionsFor(itemType, itemId, all)
  }, [getSmartConnections, itemType, itemId])

  if (related.length === 0) return null

  const displayed = expanded ? related : related.slice(0, maxItems)
  const hasMore = related.length > maxItems

  return (
    <div className={styles.wrap}>
      <button className={styles.header} onClick={() => setExpanded(!expanded)}>
        <span className={styles.headerLabel}>Related</span>
        <span className={styles.headerCount}>{related.length}</span>
        <svg className={`${styles.chevron} ${expanded ? styles.chevronOpen : ''}`} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
      </button>

      <div className={styles.list}>
        {displayed.map((conn, i) => {
          // Show the OTHER item in the connection (not self)
          const other = conn.source.type === itemType && conn.source.id === itemId
            ? conn.target
            : conn.source

          return (
            <button
              key={`${other.type}-${other.id}-${i}`}
              className={styles.item}
              onClick={() => onNavigate?.(TYPE_PAGES[other.type])}
              title={conn.reasons.join(' · ')}
            >
              <span className={styles.itemIcon}>{TYPE_ICONS[other.type]}</span>
              <span className={styles.itemTitle}>{other.title}</span>
              <span className={styles.itemType}>{TYPE_LABELS[other.type]}</span>
              <div className={styles.strengthBar}>
                <div className={styles.strengthFill} style={{ width: `${Math.round(conn.strength * 100)}%` }} />
              </div>
            </button>
          )
        })}

        {hasMore && !expanded && (
          <button className={styles.showMore} onClick={() => setExpanded(true)}>
            +{related.length - maxItems} more
          </button>
        )}
      </div>
    </div>
  )
}

export default RelatedItems
