'use client'

import React, { useState, useEffect, useMemo } from 'react'
import styles from './Sidebar.module.scss'
import { useUIStore } from '@/stores/uiStore'
import { BOTTOM_NAV, BOTTOM_NAV_RIGHT } from '@/constants/pillars'
import { Profile } from './Profile'
import { Search } from './Search'
import { Carousel } from './Carousel'
import { NavItems } from './NavItems'

interface SidebarProps {
  onNavigate?: (page: string, pillarIndex: number) => void
}

type NotifType = 'focus' | 'goal' | 'streak' | 'task' | 'system'

interface Notif {
  id: string
  type: NotifType
  title: string
  body: string
  time: string
  group: 'Today' | 'Earlier'
  unread: boolean
}

const TYPE_ICON: Record<NotifType, string> = {
  focus:  '⏱',
  goal:   '🎯',
  streak: '🔥',
  task:   '✅',
  system: '🔔',
}

const SEED_NOTIFS: Notif[] = []

export const Sidebar: React.FC<SidebarProps> = ({ onNavigate }) => {
  const { sidebarCollapsed, toggleSidebar, setCurrentPage, currentPillarIndex, setCurrentPillarIndex, mobileMenuOpen } = useUIStore()
  const [localPillarIndex, setLocalPillarIndex] = useState(currentPillarIndex)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [isCollapsing, setIsCollapsing] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifs, setNotifs] = useState<Notif[]>(SEED_NOTIFS)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackCategory, setFeedbackCategory] = useState<'bug' | 'feature' | 'general'>('general')
  const [feedbackState, setFeedbackState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const unreadCount = useMemo(() => notifs.filter(n => n.unread).length, [notifs])

  const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, unread: false })))
  const markRead = (id: string) => setNotifs(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n))

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!sidebarCollapsed) {
        setIsCollapsing(true)
        const t2 = setTimeout(() => setIsCollapsing(false), 400)
        return () => clearTimeout(t2)
      } else {
        setIsCollapsing(false)
      }
    }, 0)
    return () => clearTimeout(timer)
  }, [sidebarCollapsed])

  useEffect(() => { if (sidebarCollapsed) setDropdownOpen(false) }, [sidebarCollapsed])
  useEffect(() => { if (sidebarCollapsed && dropdownOpen) setDropdownOpen(false) }, [sidebarCollapsed, dropdownOpen])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (dropdownOpen) setDropdownOpen(false)
        if (notifOpen) setNotifOpen(false)
        if (feedbackOpen) { setFeedbackOpen(false); setFeedbackText(''); setFeedbackState('idle') }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [dropdownOpen, notifOpen, feedbackOpen])

  // Sync pillar index with store and calculate correct pillar when page changes
  useEffect(() => {
    setLocalPillarIndex(currentPillarIndex)
  }, [currentPillarIndex])

  const handleNavAction = (id: string) => {
    switch (id) {
      case 'marketplace':      setCurrentPage('marketplace'); break
      case 'notifications-nav': setNotifOpen(true); break
      case 'feedback':          setFeedbackOpen(true); break
      case 'settings':          setCurrentPage('settings'); break
    }
  }

  const handleFeedbackSend = async () => {
    if (!feedbackText.trim() || feedbackState === 'sending') return
    setFeedbackState('sending')
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: feedbackText, category: feedbackCategory }),
      })
      if (res.ok) {
        setFeedbackState('sent')
        setTimeout(() => { setFeedbackOpen(false); setFeedbackText(''); setFeedbackState('idle') }, 2000)
      } else {
        setFeedbackState('error')
      }
    } catch {
      setFeedbackState('error')
    }
  }

  const groups: Array<'Today' | 'Earlier'> = ['Today', 'Earlier']

  return (
    <>
      <aside className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : ''} ${isCollapsing ? styles.collapsing : ''} ${mobileMenuOpen ? styles.mobileOpen : ''}`}>
        <Profile
          onSettingsClick={() => setCurrentPage('settings')}
          onShortcutsClick={() => setCurrentPage('shortcuts')}
          onManagePlan={() => { window.location.href = '/pricing' }}
        />
        <Search />
        <Carousel
          currentIndex={localPillarIndex}
          onOpenDropdown={() => { if (!sidebarCollapsed) setDropdownOpen(true) }}
          onCloseDropdown={() => setDropdownOpen(false)}
          onRotate={(index) => {
            setLocalPillarIndex(index)
            setCurrentPillarIndex(index)
          }}
          collapsed={sidebarCollapsed}
        />
        <NavItems items={BOTTOM_NAV} collapsed={sidebarCollapsed} onNavigate={handleNavAction} />
        <div className={styles.spacer} />
        <NavItems
          items={BOTTOM_NAV_RIGHT}
          collapsed={sidebarCollapsed}
          onNavigate={handleNavAction}
          badgeOverrides={unreadCount > 0 ? { 'notifications-nav': String(unreadCount) } : {}}
        />
        <button className={styles.toggleBtn} onClick={toggleSidebar} aria-label="Toggle sidebar">
          {sidebarCollapsed ? '▶' : '◄'}
        </button>
      </aside>

      {/* ── NOTIFICATIONS PANEL ── */}
      {notifOpen && (
        <>
          <div className={styles.overlay} onClick={() => setNotifOpen(false)} />
          <div className={styles.notifPanel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelTitle}>Notifications</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {unreadCount > 0 && (
                  <button className={styles.markAllBtn} onClick={markAllRead}>
                    Mark all read
                  </button>
                )}
                <button className={styles.panelClose} onClick={() => setNotifOpen(false)}>✕</button>
              </div>
            </div>
            <div className={styles.notifList}>
              {unreadCount === 0 && notifs.every(n => !n.unread) ? (
                <div className={styles.notifEmpty}>
                  <span style={{ fontSize: '2rem' }}>🎉</span>
                  <span>You&apos;re all caught up!</span>
                </div>
              ) : null}
              {groups.map(group => {
                const items = notifs.filter(n => n.group === group)
                if (items.length === 0) return null
                return (
                  <div key={group}>
                    <div className={styles.notifGroup}>{group}</div>
                    {items.map(n => (
                      <div
                        key={n.id}
                        className={`${styles.notifItem} ${n.unread ? styles.unread : ''}`}
                        onClick={() => markRead(n.id)}
                      >
                        <div className={styles.notifTypeIcon}>{TYPE_ICON[n.type]}</div>
                        <div className={styles.notifContent}>
                          <div className={styles.notifTitle}>{n.title}</div>
                          <div className={styles.notifBody}>{n.body}</div>
                          <div className={styles.notifTime}>{n.time}</div>
                        </div>
                        {n.unread && <div className={styles.unreadDot} />}
                      </div>
                    ))}
                  </div>
                )
              })}
              {notifs.length > 0 && unreadCount === 0 && (
                <div className={styles.notifEmpty}>
                  <span style={{ fontSize: '2rem' }}>🎉</span>
                  <span>You&apos;re all caught up!</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── FEEDBACK MODAL ── */}
      {feedbackOpen && (
        <>
          <div className={styles.overlay} onClick={() => { setFeedbackOpen(false); setFeedbackText(''); setFeedbackState('idle') }} />
          <div className={styles.feedbackModal}>
            <div className={styles.panelHeader}>
              <span className={styles.panelTitle}>Share Feedback</span>
              <button className={styles.panelClose} onClick={() => { setFeedbackOpen(false); setFeedbackText(''); setFeedbackState('idle') }}>✕</button>
            </div>
            {feedbackState === 'sent' ? (
              <div className={styles.feedbackThanks}>
                <span style={{ fontSize: '2rem' }}>❤</span>
                <span>Thanks! We read every single message.</span>
              </div>
            ) : (
              <>
                <p className={styles.feedbackDesc}>Tell us what you think, report a bug, or suggest a feature.</p>
                <div className={styles.feedbackCats}>
                  {([['bug', '🐛 Bug'], ['feature', '💡 Feature'], ['general', '💬 General']] as const).map(([val, label]) => (
                    <button
                      key={val}
                      className={`${styles.feedbackCat} ${feedbackCategory === val ? styles.feedbackCatActive : ''}`}
                      onClick={() => setFeedbackCategory(val)}
                    >{label}</button>
                  ))}
                </div>
                <textarea
                  className={styles.feedbackTextarea}
                  placeholder="What's on your mind?"
                  value={feedbackText}
                  onChange={e => { setFeedbackText(e.target.value); if (feedbackState === 'error') setFeedbackState('idle') }}
                  rows={5}
                />
                {feedbackState === 'error' && (
                  <p className={styles.feedbackError}>Something went wrong. Please try again.</p>
                )}
                <button
                  className={styles.feedbackSend}
                  onClick={handleFeedbackSend}
                  disabled={!feedbackText.trim() || feedbackState === 'sending'}
                >
                  {feedbackState === 'sending' ? 'Sending…' : 'Send Feedback'}
                </button>
              </>
            )}
          </div>
        </>
      )}
    </>
  )
}

export default Sidebar
