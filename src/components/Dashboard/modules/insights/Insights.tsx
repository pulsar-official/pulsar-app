'use client'

import React, { useState, useMemo } from 'react'
import styles from './Insights.module.scss'
import type { Task, FocusSession } from '@/types/productivity'
import { InsightCard } from '@/components/Dashboard/widgets/InsightCard'
import { useProductivityStore } from '@/stores/productivityStore'
import {
  getCognitiveLoad,
  getFocusStreak,
  getWeeklyCompletionRate,
  getWeeklyFocusMinutes,
  getHabitConsistency,
  getBreakdownRate,
  getMostConsistentHabit,
  getGoalsSummary,
  getMoodTrend,
  getLast14DaysActivity,
} from '@/utils/insightsUtils'

// ─── Heatmap helpers ─────────────────────────────────────────────────────────

function buildHeatmapDays(
  tasks: Task[],
  sessions: FocusSession[]
) {
  const now = new Date()
  const days: { date: string; level: 0 | 1 | 2 | 3 | 4 }[] = []

  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)

    const tasksDone = tasks.filter(
      (t) => (t.completed || t.status === 'done') && t.dueDate?.slice(0, 10) === dateStr
    ).length
    const sessionMins = sessions
      .filter((s) => s.date?.slice(0, 10) === dateStr)
      .reduce((sum, s) => sum + Math.round((s.totalFocusSeconds ?? 0) / 60), 0)

    const score = tasksDone + Math.floor(sessionMins / 20)
    const level: 0 | 1 | 2 | 3 | 4 =
      score === 0 ? 0 : score <= 1 ? 1 : score <= 3 ? 2 : score <= 5 ? 3 : 4

    days.push({ date: dateStr, level })
  }

  return days
}

// ─── Top tags ────────────────────────────────────────────────────────────────

function getTopTags(tasks: Task[]): string[] {
  const counts: Record<string, number> = {}
  tasks.forEach((t) => {
    if (t.tag) counts[t.tag] = (counts[t.tag] ?? 0) + 1
  })
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tag]) => tag)
}

// ─── Milestone helpers ───────────────────────────────────────────────────────

function nextMilestone(streak: number): number {
  for (const m of [7, 14, 30, 60, 100]) {
    if (streak < m) return m
  }
  return 100
}

// ─── Component ───────────────────────────────────────────────────────────────

const Insights: React.FC = () => {
  const [range, setRange] = useState<'week' | 'month'>('week')
  const { tasks, habits, habitChecks, goals, journalEntries, focusSessions } = useProductivityStore()

  const cogLoad = useMemo(() => getCognitiveLoad(tasks, goals), [tasks, goals])
  const streak = useMemo(() => getFocusStreak(focusSessions), [focusSessions])
  const completionRate = useMemo(() => getWeeklyCompletionRate(tasks), [tasks])
  const focusMins = useMemo(() => getWeeklyFocusMinutes(focusSessions), [focusSessions])
  const habitPct = useMemo(() => getHabitConsistency(habits, habitChecks), [habits, habitChecks])
  const breakdownRate = useMemo(() => getBreakdownRate(tasks), [tasks])
  const heatmapDays = useMemo(() => buildHeatmapDays(tasks, focusSessions), [tasks, focusSessions])
  const topTags = useMemo(() => getTopTags(tasks), [tasks])
  const topHabit = useMemo(() => getMostConsistentHabit(habits, habitChecks), [habits, habitChecks])
  const goalsSummary = useMemo(() => getGoalsSummary(goals), [goals])
  const moodTrend = useMemo(() => getMoodTrend(journalEntries), [journalEntries])
  const activity14 = useMemo(() => getLast14DaysActivity(focusSessions), [focusSessions])

  const currentStreak = streak.current
  const longestStreak = streak.longest
  const milestone = nextMilestone(currentStreak)
  const streakProgress = Math.min((currentStreak / milestone) * 100, 100)

  const focusDisplay =
    focusMins >= 60
      ? `${Math.floor(focusMins / 60)}h ${focusMins % 60}m`
      : `${focusMins}m`

  const sessionCount = focusSessions.filter((s) => {
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)
    return s.date && new Date(s.date) >= weekStart
  }).length

  const doneTasks = tasks.filter((t) => t.completed || t.status === 'done').length

  const cogColor: 'green' | 'amber' | 'red' =
    cogLoad.label === 'Light' ? 'green' : cogLoad.label === 'Moderate' ? 'amber' : 'red'

  // Productivity tips based on data
  const tips: string[] = []
  if (completionRate < 50) tips.push('Try breaking tasks into smaller pieces to boost your completion rate.')
  if (habitPct < 50) tips.push('Pick your top 2 habits and focus on those daily for the next week.')
  if (cogLoad.label === 'Heavy') tips.push('Try completing 3 tasks before adding new ones to reduce cognitive load.')
  if (currentStreak === 0) tips.push('Start a focus session today to kick off your streak!')
  if (!tips.length) tips.push('You\'re doing great — keep the momentum going!', 'Review your goals weekly to stay aligned with your priorities.')

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Insights</h1>
        <div className={styles.toggle}>
          <button
            className={range === 'week' ? styles.active : ''}
            onClick={() => setRange('week')}
          >
            This Week
          </button>
          <button
            className={range === 'month' ? styles.active : ''}
            onClick={() => setRange('month')}
          >
            This Month
          </button>
        </div>
      </div>

      {/* Main metric cards grid */}
      <div className={styles.grid}>
        {/* 1. Cognitive Load */}
        <div className={styles.card}>
          <p className={styles.cardTitle}>Cognitive Load</p>
          <div className={styles.cardRow}>
            <span className={styles.bigNumber} style={{ color: cogLoad.color }}>{cogLoad.score}</span>
            <span className={styles.badge} style={{ background: cogLoad.color + '22', color: cogLoad.color }}>{cogLoad.label}</span>
          </div>
          <p className={styles.cardSub}>active items (tasks + goals)</p>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${Math.min((cogLoad.score / 30) * 100, 100)}%`, background: cogLoad.color }} />
          </div>
          {cogLoad.label === 'Heavy' && (
            <p className={styles.tip}>Tip: complete 3 tasks before adding new ones</p>
          )}
        </div>

        {/* 2. Weekly Completion Rate */}
        <div className={styles.card}>
          <p className={styles.cardTitle}>Weekly Completion</p>
          <div className={styles.cardRow}>
            <span className={styles.bigNumber}>{completionRate}%</span>
            <svg className={styles.ring} viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.9" fill="none" strokeWidth="3" stroke="oklch(0.22 0.02 290)" />
              <circle
                cx="18" cy="18" r="15.9" fill="none" strokeWidth="3"
                stroke="oklch(0.65 0.14 150)"
                strokeDasharray={`${completionRate} ${100 - completionRate}`}
                strokeDashoffset="25"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <p className={styles.cardSub}>{doneTasks} task{doneTasks !== 1 ? 's' : ''} completed</p>
        </div>

        {/* 3. Focus Streak */}
        <div className={styles.card}>
          <p className={styles.cardTitle}>Focus Streak</p>
          <div className={styles.bigNumber}>🔥 {currentStreak} day{currentStreak !== 1 ? 's' : ''}</div>
          <p className={styles.cardSub}>Longest streak: {longestStreak} days</p>
          <div className={styles.heatRow}>
            {activity14.map((active, i) => (
              <div key={i} className={`${styles.heatSq} ${active ? styles.heatSqOn : ''}`} />
            ))}
          </div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${streakProgress}%`, background: 'oklch(0.72 0.16 60)' }} />
          </div>
          <p className={styles.cardSub}>{milestone - currentStreak} days to next milestone ({milestone})</p>
        </div>

        {/* 4. Top Habit */}
        <div className={styles.card}>
          <p className={styles.cardTitle}>Top Habit</p>
          {topHabit ? (
            <>
              <div className={styles.bigNumber} style={{ fontSize: '22px' }}>{topHabit.name}</div>
              <p className={styles.cardSub}>{Math.round(topHabit.rate * 100)}% check-in rate (30 days)</p>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${Math.round(topHabit.rate * 100)}%`, background: 'oklch(0.6 0.12 290)' }} />
              </div>
            </>
          ) : (
            <p className={styles.cardSub}>No habits yet — add some in Habits!</p>
          )}
          <p className={styles.cardSub} style={{ marginTop: 8 }}>Consistency this week: {habitPct}%</p>
        </div>

        {/* 5. Goals Overview */}
        <div className={styles.card}>
          <p className={styles.cardTitle}>Goals Overview</p>
          <div className={styles.bigNumber}>{goalsSummary.done}<span style={{ fontSize: 20, opacity: 0.5 }}>/{goalsSummary.total}</span></div>
          <p className={styles.cardSub}>goals completed · avg progress {goalsSummary.avgProgress}%</p>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${goalsSummary.avgProgress}%`, background: 'oklch(0.6 0.15 260)' }} />
          </div>
          <div className={styles.goalsList}>
            {goals.filter(g => !g.isDeleted && !g.done).slice(0, 3).map(g => (
              <div key={g.id} className={styles.goalRow}>
                <span className={styles.goalTitle}>{g.title}</span>
                <span className={styles.goalPct}>{g.progress}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* 6. Mood Trend */}
        <div className={styles.card}>
          <p className={styles.cardTitle}>Mood Trend</p>
          <div className={styles.moodRow}>
            {moodTrend.length > 0 ? (
              moodTrend.map((mood, i) => (
                <span key={i} className={styles.moodEmoji}>{mood}</span>
              ))
            ) : (
              <p className={styles.cardSub}>No journal entries yet</p>
            )}
          </div>
          <p className={styles.cardSub}>Your recent moods (last 7 entries)</p>
        </div>
      </div>

      {/* 30-day Heatmap */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>30-Day Activity</h2>
        <div className={styles.heatmap}>
          {heatmapDays.map((d) => (
            <div
              key={d.date}
              className={`${styles.heatCell} ${styles[`level${d.level}`]}`}
              title={d.date}
            />
          ))}
        </div>
        <div className={styles.heatLegend}>
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((l) => (
            <div key={l} className={`${styles.heatCell} ${styles[`level${l}`]}`} />
          ))}
          <span>More</span>
        </div>
      </div>

      {/* Top contexts */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Top Contexts This Week</h2>
        <div className={styles.tagRow}>
          {topTags.length === 0 ? (
            <span className={styles.empty}>No tags yet — add tags to your tasks!</span>
          ) : (
            topTags.map((tag, i) => (
              <span key={tag} className={`${styles.tag} ${styles[`tagRank${i}`]}`}>
                #{tag}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Productivity Tips */}
      <div className={styles.tipsSection}>
        <h2 className={styles.sectionTitle}>Productivity Tips</h2>
        <div className={styles.tipsGrid}>
          {tips.map((tip, i) => (
            <div key={i} className={styles.tipCard}>
              <span className={styles.tipIcon}>💡</span>
              <p>{tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Insights
