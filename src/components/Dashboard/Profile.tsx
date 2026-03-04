  'use client'

import React from 'react'
import styles from './Profile.module.scss'

interface ProfileProps {
  initials: string
  name: string
  subtitle: string
}

export const Profile: React.FC<ProfileProps> = ({ initials, name, subtitle }) => {
  return (
    <div className={styles.profile}>
      <div className={styles.avatar}>{initials}</div>
      <div className={styles.info}>
        <div className={styles.name}>{name}</div>
        <div className={styles.subtitle}>{subtitle}</div>
      </div>
    </div>
  )
}

export default Profile