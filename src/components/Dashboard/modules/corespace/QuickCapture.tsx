'use client'

import React, { useState } from 'react'
import { WidgetContainer } from '@/components/Dashboard/Corespace'
import { useUserTier } from '@/hooks/useUserTier'
import styles from './QuickCapture.module.scss'

const QuickCapture: React.FC = () => {
  const { tier, canAccess } = useUserTier()
  const [text, setText] = useState('')
  const [showUpgradeHint, setShowUpgradeHint] = useState(false)

  const hasAIAssist = canAccess('molecule')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    // TODO: persist capture
    setText('')
  }

  return (
    <WidgetContainer id="quickCapture" title="Quick Capture" tier="atom" userTier={tier} defaultW={4} defaultH={2}>
      <div className={styles.qc}>
        <form className={styles.inputRow} onSubmit={handleSubmit}>
          <input
            className={styles.input}
            placeholder="Capture a thought, task, or note…"
            value={text}
            onChange={e => setText(e.target.value)}
            aria-label="Quick capture input"
          />
          <button type="submit" className={styles.captureBtn} disabled={!text.trim()}>
            Save
          </button>
        </form>

        <div className={styles.actions}>
          {hasAIAssist ? (
            <button className={styles.aiBtn}>
              ✦ AI Assist
            </button>
          ) : (
            <div className={styles.upgradeWrap}>
              <button
                className={styles.aiBtn}
                style={{ opacity: 0.45, cursor: 'not-allowed' }}
                onClick={() => setShowUpgradeHint(v => !v)}
                type="button"
                aria-describedby="ai-assist-upgrade"
              >
                ✦ AI Assist
              </button>
              {showUpgradeHint && (
                <div className={styles.upgradeHint} id="ai-assist-upgrade" role="tooltip">
                  AI Assist requires the <strong>Molecule</strong> plan.{' '}
                  <button className={styles.upgradeLink} onClick={() => {}}>
                    Upgrade
                  </button>
                </div>
              )}
            </div>
          )}

          <button className={styles.typeBtn} type="button">
            Task
          </button>
          <button className={styles.typeBtn} type="button">
            Note
          </button>
          <button className={styles.typeBtn} type="button">
            Goal
          </button>
        </div>
      </div>
    </WidgetContainer>
  )
}

export default QuickCapture
