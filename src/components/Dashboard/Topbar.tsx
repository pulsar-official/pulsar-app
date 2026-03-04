'use client'

import React from 'react'
import styles from './Topbar.module.scss'

interface BreadcrumbItem {
  label: string
  onClick?: () => void
}

interface TopbarProps {
  breadcrumbs: BreadcrumbItem[]
}

export const Topbar: React.FC<TopbarProps> = ({ breadcrumbs }) => {
  return (
    <header className={styles.topbar}>
      <nav className={styles.breadcrumb}>
        {breadcrumbs.map((item, i) => {
          const isLast = i === breadcrumbs.length - 1
          const sep = i > 0 ? <span className={styles.sep}>›</span> : null
          
          if (isLast) {
            return (
              <React.Fragment key={i}>
                {sep}
                <span className={styles.current}>{item.label}</span>
              </React.Fragment>
            )
          }
          
          return (
            <React.Fragment key={i}>
              {sep}
              <button 
                className={styles.link}
                onClick={item.onClick}
              >
                {item.label}
              </button>
            </React.Fragment>
          )
        })}
      </nav>
    </header>
  )
}

export default Topbar