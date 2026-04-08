'use client'

import { useState, useEffect } from 'react'
import styles from './HabitQuoteCard.module.scss'
import { getQuoteForDate, getRandomQuote } from '@/utils/deepQuotes'
import type { Quote } from '@/utils/deepQuotes'

export default function HabitQuoteCard() {
  const [quote, setQuote] = useState<Quote | null>(null)

  useEffect(() => {
    // Get the quote for today
    const dailyQuote = getQuoteForDate(new Date())
    setQuote(dailyQuote)
  }, [])

  const handleRefresh = () => {
    const newQuote = getRandomQuote()
    setQuote(newQuote)
  }

  if (!quote) {
    return (
      <div className={styles.card}>
        <div className={styles.placeholder}>…</div>
      </div>
    )
  }

  return (
    <div className={styles.card} onClick={handleRefresh}>
      <div className={styles.quoteMarkWrap}>
        <div className={styles.quoteMark}>"</div>
        <div className={styles.quoteText}>
          {quote.quote}
        </div>
      </div>
    </div>
  )
}
