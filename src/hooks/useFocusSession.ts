'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { TIMER_PRESETS, type TimerPresetId } from '@/utils/focusUtils'

type SessionPhase = 'idle' | 'work' | 'rest' | 'longRest' | 'done'

interface SessionState {
  sessionId: string
  presetId: TimerPresetId
  phase: SessionPhase
  timeLeft: number    // seconds
  totalTime: number   // seconds for current phase
  cycle: number       // 1-based
  totalCycles: number
  running: boolean
  elapsed: number     // total seconds elapsed across all phases
  workMinutes: number
  restMinutes: number
  longRestMinutes: number
}

const LS_KEY = 'pulsar-focus-session'

export function useFocusSession() {
  const [state, setState] = useState<SessionState | null>(null)
  const [customWork, setCustomWork] = useState(25)
  const [customRest, setCustomRest] = useState(5)
  const [customLongRest, setCustomLongRest] = useState(15)
  const [customCycles, setCustomCycles] = useState(4)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Restore from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as SessionState
        // Pause on restore (don't auto-resume)
        setState({ ...parsed, running: false })
      }
    } catch {}
  }, [])

  // Save to localStorage on state change
  useEffect(() => {
    if (state) localStorage.setItem(LS_KEY, JSON.stringify(state))
    else localStorage.removeItem(LS_KEY)
  }, [state])

  // visibilitychange: pause when tab hides
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden && state?.running) {
        setState(s => s ? { ...s, running: false } : s)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [state?.running])

  // Ticker
  useEffect(() => {
    if (!state?.running) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      setState(s => {
        if (!s) return s
        if (s.timeLeft <= 1) {
          clearInterval(intervalRef.current!)
          // Auto-advance phase
          if (s.phase === 'work') {
            const isLongBreak = s.cycle % s.totalCycles === 0
            if (isLongBreak) {
              return { ...s, phase: 'longRest', timeLeft: s.longRestMinutes * 60, totalTime: s.longRestMinutes * 60, running: false }
            }
            return { ...s, phase: 'rest', timeLeft: s.restMinutes * 60, totalTime: s.restMinutes * 60, running: false }
          }
          if (s.phase === 'rest' || s.phase === 'longRest') {
            if (s.cycle >= s.totalCycles) {
              return { ...s, phase: 'done', running: false }
            }
            const nextCycle = s.cycle + 1
            return { ...s, phase: 'work', cycle: nextCycle, timeLeft: s.workMinutes * 60, totalTime: s.workMinutes * 60, running: false }
          }
          return { ...s, running: false }
        }
        return { ...s, timeLeft: s.timeLeft - 1, elapsed: s.elapsed + 1 }
      })
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [state?.running])

  const getPreset = useCallback((presetId: TimerPresetId) => {
    const p = TIMER_PRESETS[presetId]
    if (presetId === 'custom') {
      return { work: customWork, rest: customRest, longRest: customLongRest, cycles: customCycles }
    }
    return { work: p.work, rest: p.rest, longRest: p.longRest, cycles: p.cycles }
  }, [customWork, customRest, customLongRest, customCycles])

  const start = useCallback((presetId: TimerPresetId) => {
    const p = getPreset(presetId)
    const newState: SessionState = {
      sessionId: Math.random().toString(36).slice(2),
      presetId,
      phase: 'work',
      timeLeft: p.work * 60,
      totalTime: p.work * 60,
      cycle: 1,
      totalCycles: p.cycles,
      running: true,
      elapsed: 0,
      workMinutes: p.work,
      restMinutes: p.rest,
      longRestMinutes: p.longRest,
    }
    setState(newState)
  }, [getPreset])

  const pause = useCallback(() => setState(s => s ? { ...s, running: false } : s), [])
  const resume = useCallback(() => setState(s => s ? { ...s, running: true } : s), [])
  const stop = useCallback(() => { setState(null) }, [])
  const skipPhase = useCallback(() => {
    setState(s => {
      if (!s) return s
      if (s.phase === 'work') {
        const isLong = s.cycle % s.totalCycles === 0
        return { ...s, phase: isLong ? 'longRest' : 'rest', timeLeft: (isLong ? s.longRestMinutes : s.restMinutes) * 60, totalTime: (isLong ? s.longRestMinutes : s.restMinutes) * 60, running: false }
      }
      if (s.cycle >= s.totalCycles) return { ...s, phase: 'done', running: false }
      return { ...s, phase: 'work', cycle: s.cycle + 1, timeLeft: s.workMinutes * 60, totalTime: s.workMinutes * 60, running: false }
    })
  }, [])

  return {
    state, start, pause, resume, stop, skipPhase,
    customWork, setCustomWork, customRest, setCustomRest,
    customLongRest, setCustomLongRest, customCycles, setCustomCycles,
  }
}
