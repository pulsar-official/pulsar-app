'use client'

import { useState, useRef, useEffect } from 'react'
import styles from './ClassChat.module.scss'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string
  author: string
  initials: string
  avatarColor: string
  text: string
  timestamp: string
}

// ─── Demo data ────────────────────────────────────────────────────────────────

const CHANNELS = ['General', 'CS 170', 'ECON 101', 'Math 110']

const DEMO_MESSAGES: Record<string, Message[]> = {
  General: [
    {
      id: '1',
      author: 'Alex Kim',
      initials: 'AK',
      avatarColor: 'oklch(0.55 0.18 290)',
      text: 'Hey everyone! Anyone else stuck on the midterm review?',
      timestamp: '2:14 PM',
    },
    {
      id: '2',
      author: 'Jordan Lee',
      initials: 'JL',
      avatarColor: 'oklch(0.6 0.15 260)',
      text: 'Yeah, chapter 4 is rough. Want to form a study group?',
      timestamp: '2:17 PM',
    },
    {
      id: '3',
      author: 'Sam Patel',
      initials: 'SP',
      avatarColor: 'oklch(0.65 0.14 150)',
      text: 'I\'m in! Saturday at 2pm works for me',
      timestamp: '2:21 PM',
    },
    {
      id: '4',
      author: 'Alex Kim',
      initials: 'AK',
      avatarColor: 'oklch(0.55 0.18 290)',
      text: 'Perfect, I\'ll create a shared doc',
      timestamp: '2:22 PM',
    },
  ],
  'CS 170': [
    {
      id: '1',
      author: 'Jordan Lee',
      initials: 'JL',
      avatarColor: 'oklch(0.6 0.15 260)',
      text: 'Anyone understand the dynamic programming problem from HW3?',
      timestamp: '10:05 AM',
    },
    {
      id: '2',
      author: 'Sam Patel',
      initials: 'SP',
      avatarColor: 'oklch(0.65 0.14 150)',
      text: 'Think of it as a subproblem graph — memo the overlapping states',
      timestamp: '10:18 AM',
    },
    {
      id: '3',
      author: 'Jordan Lee',
      initials: 'JL',
      avatarColor: 'oklch(0.6 0.15 260)',
      text: 'That actually clicked, thanks!',
      timestamp: '10:20 AM',
    },
  ],
  'ECON 101': [
    {
      id: '1',
      author: 'Alex Kim',
      initials: 'AK',
      avatarColor: 'oklch(0.55 0.18 290)',
      text: 'Did anyone take notes from Wednesday\'s lecture? I was sick',
      timestamp: 'Yesterday',
    },
    {
      id: '2',
      author: 'Sam Patel',
      initials: 'SP',
      avatarColor: 'oklch(0.65 0.14 150)',
      text: 'Sharing mine now — supply/demand shifts were the main topic',
      timestamp: 'Yesterday',
    },
  ],
  'Math 110': [
    {
      id: '1',
      author: 'Sam Patel',
      initials: 'SP',
      avatarColor: 'oklch(0.65 0.14 150)',
      text: 'Office hours tomorrow at 3pm if anyone wants to go together',
      timestamp: '9:00 AM',
    },
    {
      id: '2',
      author: 'Jordan Lee',
      initials: 'JL',
      avatarColor: 'oklch(0.6 0.15 260)',
      text: 'I\'ll be there!',
      timestamp: '9:03 AM',
    },
  ],
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ClassChat() {
  const [activeChannel, setActiveChannel] = useState('General')
  const [inputValue, setInputValue] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const messages = DEMO_MESSAGES[activeChannel] ?? []

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeChannel])

  function handleInvite() {
    const link = typeof window !== 'undefined' ? window.location.origin + '/invite/class' : 'https://pulsar.app/invite/class'
    navigator.clipboard.writeText(link).catch(() => {})
    setToast('Link copied!')
    setTimeout(() => setToast(null), 2500)
  }

  function handleSend() {
    if (!inputValue.trim()) return
    setInputValue('')
    // In MVP: no-op — realtime sync is a future feature
  }

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <p className={styles.sidebarLabel}>Class Channels</p>
        {CHANNELS.map((ch) => (
          <button
            key={ch}
            className={`${styles.channel} ${activeChannel === ch ? styles.channelActive : ''}`}
            onClick={() => setActiveChannel(ch)}
          >
            <span className={styles.channelHash}>#</span>
            {ch}
          </button>
        ))}
        <button className={styles.joinBtn}>
          <span>+</span> Join Class
        </button>
      </aside>

      {/* Main chat area */}
      <main className={styles.main}>
        {/* Top header */}
        <header className={styles.chatHeader}>
          <div className={styles.channelInfo}>
            <span className={styles.channelName}># {activeChannel}</span>
            <span className={styles.memberCount}>3 members</span>
          </div>
          <button className={styles.inviteBtn} onClick={handleInvite}>
            + Invite Classmate
          </button>
        </header>

        {/* Messages */}
        <div className={styles.messages}>
          {messages.map((msg) => (
            <div key={msg.id} className={styles.bubble}>
              <div className={styles.avatar} style={{ background: msg.avatarColor }}>
                {msg.initials}
              </div>
              <div className={styles.bubbleContent}>
                <div className={styles.bubbleMeta}>
                  <span className={styles.author}>{msg.author}</span>
                  <span className={styles.timestamp}>{msg.timestamp}</span>
                </div>
                <p className={styles.messageText}>{msg.text}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        <div className={styles.inputBar}>
          <input
            className={styles.input}
            type="text"
            placeholder={`Message #${activeChannel}`}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button className={styles.sendBtn} onClick={handleSend} disabled={!inputValue.trim()}>
            Send
          </button>
        </div>

        {/* Coming Soon overlay */}
        <div className={styles.comingSoon}>
          <div className={styles.comingSoonBox}>
            <span className={styles.comingSoonIcon}>💬</span>
            <h3>Class Chat</h3>
            <p>Launches when you invite a classmate.</p>
            <button className={styles.inviteCta} onClick={handleInvite}>
              + Invite Classmate
            </button>
          </div>
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div className={styles.toast}>{toast}</div>
      )}
    </div>
  )
}
