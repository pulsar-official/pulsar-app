'use client'

import React from 'react'
import styles from './Search.module.scss'
import { Icon } from '@/components/UI/Icon'

export const Search: React.FC = () => {
  return (
    <div className={styles.search} role="search">
      <span className={styles.searchIcon}>
        <Icon name="search" size={13} />
      </span>
      <input
        className={styles.searchInput}
        type="text"
        placeholder="Search"
        aria-label="Search"
      />
    </div>
  )
}

export default Search