'use client'

import React from 'react'
import styles from './MainContent.module.scss'

interface MainContentProps {
  children: React.ReactNode
}

export const MainContent: React.FC<MainContentProps> = ({ children }) => {
  return (
    <main className={styles.main}>
      {children}
    </main>
  )
}

export default MainContent