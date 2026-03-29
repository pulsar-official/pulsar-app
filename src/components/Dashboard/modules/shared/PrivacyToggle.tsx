'use client'
import styles from './PrivacyToggle.module.scss'

interface PrivacyToggleProps {
  isPublic: boolean
  onChange: (isPublic: boolean) => void
  className?: string
}

export default function PrivacyToggle({ isPublic, onChange, className }: PrivacyToggleProps) {
  return (
    <button
      type="button"
      className={`${styles.toggle} ${isPublic ? styles.public : styles.private} ${className ?? ''}`}
      onClick={() => onChange(!isPublic)}
      title={isPublic ? 'Shared with org — click to make private' : 'Private — click to share with org'}
    >
      {isPublic ? (
        <>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
          Shared
        </>
      ) : (
        <>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          Private
        </>
      )}
    </button>
  )
}
