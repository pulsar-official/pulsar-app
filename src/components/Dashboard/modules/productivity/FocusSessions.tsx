import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import styles from './FocusSessions.module.scss';
import {
  T, TIMER_TYPES, INITIAL_TASKS, PRIORITY_COLORS, QUOTES, QUIT_MESSAGES,
  fmt, CIRC, bumpTaskId, getResources,
} from '@/constants/focusSessions';
import type {
  Phase, Task, TimerTypeId, TimerConfig,
} from '@/types/focusSessions';
import { useProductivityStore } from '@/stores/productivityStore';

// Allow CSS custom property --c on JSX elements
declare module 'react' {
  interface CSSProperties {
    '--c'?: string;
  }
}

const cx = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(' ');

// ─────────────────────────────────────────────
export default function FocusSessions() {

  // Seed tasks from productivity store, falling back to INITIAL_TASKS
  const storeTasks = useProductivityStore(s => s.tasks)
  const storeToggleTask = useProductivityStore(s => s.toggleTask)
  const initialTasks = useMemo<Task[]>(() => {
    const fromStore = storeTasks.filter(t => !t.completed).map(t => ({
      id: t.id,
      title: t.title,
      priority: t.priority as Task['priority'],
      done: false,
      deferred: false,
    }))
    return fromStore.length > 0 ? fromStore : INITIAL_TASKS
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- only seed on mount

  // ── STATE ──
  const [phase, setPhase]                       = useState<Phase>('dashboard');
  const [selectedType, setSelectedType]         = useState<TimerTypeId>('pomodoro');
  const [customWork, setCustomWork]             = useState(25);
  const [customRest, setCustomRest]             = useState(5);
  const [customLongRest, setCustomLongRest]     = useState(15);
  const [customCycles, setCustomCycles]         = useState(4);

  const [tasks, setTasks]                       = useState<Task[]>(initialTasks);
  const [selectedTaskIds, setSelectedTaskIds]   = useState<Set<number>>(new Set());
  const [newTaskText, setNewTaskText]           = useState('');

  const [timeLeft, setTimeLeft]                 = useState(0);
  const [totalTime, setTotalTime]               = useState(0);
  const [cycle, setCycle]                       = useState(0);
  const [totalCycles, setTotalCycles]           = useState(4);

  const [showQuitModal, setShowQuitModal]       = useState(false);
  const [finishConfirmId, setFinishConfirmId]   = useState<number | null>(null);
  const [streak, setStreak]                     = useState(3);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [completedInSession, setCompletedInSession] = useState(0);
  const [adaptiveBonus, setAdaptiveBonus]       = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const quoteRef    = useRef(QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  // ── DERIVED CONFIG ──
  const preset = useMemo(
    () => TIMER_TYPES.find((t) => t.id === selectedType)!,
    [selectedType],
  );

  const activeConfig = useMemo<TimerConfig>(() => {
    if (selectedType === 'custom') {
      return {
        work: +customWork,
        rest: +customRest,
        longRest: +customLongRest,
        cyclesBeforeLong: +customCycles,
      };
    }
    return preset;
  }, [selectedType, customWork, customRest, customLongRest, customCycles, preset]);

  const activeTasks = useMemo<Task[]>(
    () => tasks.filter((t) => selectedTaskIds.has(t.id)),
    [tasks, selectedTaskIds],
  );

  const sortedSessionTasks = useMemo<Task[]>(() => {
    const active   = activeTasks.filter((t) => !t.done && !t.deferred);
    const deferred = activeTasks.filter((t) => t.deferred && !t.done);
    const done     = activeTasks.filter((t) => t.done);
    return [...active, ...deferred, ...done];
  }, [activeTasks]);

  const currentTask = useMemo<Task | null>(
    () => sortedSessionTasks.find((t) => !t.done) ?? null,
    [sortedSessionTasks],
  );

  const queueRemainder = useMemo<Task[]>(
    () => sortedSessionTasks.filter((t) => !t.done && t !== currentTask),
    [sortedSessionTasks, currentTask],
  );

  const undoneTasks = tasks.filter((t) => !t.done);

  // ── TIMER TICK ──
  useEffect(() => {
    if ((phase === 'session' || phase === 'rest') && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) { clearInterval(intervalRef.current!); return 0; }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(intervalRef.current!);
    }
  }, [phase, timeLeft > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── PHASE ADVANCE on timeLeft → 0 ──
  useEffect(() => {
    if (timeLeft !== 0) return;
    if (phase === 'session') {
      if (selectedType === 'adaptive') {
        const undone = activeTasks.filter((t) => !t.done && !t.deferred);
        if (undone.length > 0) {
          setAdaptiveBonus((b) => b + 5);
          setTimeLeft(5 * 60);
          setTotalTime(5 * 60);
          return;
        }
      }
      handleWorkDone();
    } else if (phase === 'rest') {
      handleRestDone();
    }
  }, [timeLeft, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── AUTO-COMPLETE when all selected tasks done ──
  useEffect(() => {
    if (phase !== 'session') return;
    const active = tasks.filter((t) => selectedTaskIds.has(t.id));
    if (active.length === 0) return;
    if (active.every((t) => t.done)) {
      setStreak((s) => s + 1);
      setPhase('complete');
    }
  }, [tasks, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── CALLBACKS ──
  const handleWorkDone = useCallback(() => {
    const nextCycle = cycle + 1;
    setCycle(nextCycle);
    if (nextCycle >= totalCycles) {
      setStreak((s) => s + 1);
      setPhase('complete');
    } else {
      const isLong  = nextCycle % activeConfig.cyclesBeforeLong === 0;
      const restDur = isLong ? activeConfig.longRest : activeConfig.rest;
      setTimeLeft(restDur * 60);
      setTotalTime(restDur * 60);
      setPhase('rest');
    }
  }, [cycle, totalCycles, activeConfig]);

  const handleRestDone = useCallback(() => {
    setTimeLeft(activeConfig.work * 60);
    setTotalTime(activeConfig.work * 60);
    setPhase('session');
    quoteRef.current = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  }, [activeConfig]);

  // ── TASK ACTIONS ──
  const toggleTaskSelect = (id: number) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const addTask = () => {
    const title = newTaskText.trim();
    if (!title) return;
    const id = bumpTaskId();
    setTasks((prev) => [...prev, { id, title, priority: 'medium', done: false, deferred: false }]);
    setNewTaskText('');
  };

  const removeTask = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setSelectedTaskIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
  };

  const markTaskDone = (id: number) => {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, done: true, deferred: false } : t));
    setCompletedInSession((c) => c + 1);
    // Sync completion back to productivity store (read fresh state to avoid stale closure)
    const currentTask = useProductivityStore.getState().tasks.find(t => t.id === id)
    if (currentTask && !currentTask.completed) storeToggleTask(id)
  };

  const deferTask = (id: number) => {
    setTasks((prev) => {
      const task = prev.find((t) => t.id === id);
      if (!task) return prev;
      return [...prev.filter((t) => t.id !== id), { ...task, deferred: true }];
    });
  };

  // ── SESSION CONTROL ──
  const startSession = () => {
    const cycles   = +activeConfig.cyclesBeforeLong;
    const workSecs = activeConfig.work * 60;
    setTotalCycles(cycles);
    setCycle(0);
    setTimeLeft(workSecs);
    setTotalTime(workSecs);
    setSessionStartTime(Date.now());
    setCompletedInSession(0);
    setAdaptiveBonus(0);
    setTasks((prev) => prev.map((t) => ({ ...t, done: false, deferred: false })));
    setPhase('session');
  };

  const confirmQuit = () => {
    setStreak(0);
    setPhase('dashboard');
    setShowQuitModal(false);
    setTasks((prev) => prev.map((t) => ({ ...t, deferred: false })));
  };

  const resetToDashboard = () => {
    setPhase('dashboard');
    setTasks((prev) => prev.map((t) => ({ ...t, done: false, deferred: false })));
    setSelectedTaskIds(new Set());
    quoteRef.current = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  };

  // ── DERIVED ──
  const progress      = totalTime > 0 ? (totalTime - timeLeft) / totalTime : 0;
  const dashOffset    = CIRC * (1 - progress);
  const elapsed       = sessionStartTime ? Math.floor((Date.now() - sessionStartTime) / 60000) : 0;
  const percentDone   = totalCycles > 0 ? Math.round(((cycle + progress) / totalCycles) * 100) : 0;
  const totalFocusMin = sessionStartTime ? Math.round((Date.now() - sessionStartTime) / 60000) : 0;

  const quitMessage = QUIT_MESSAGES[Math.floor(Math.random() * QUIT_MESSAGES.length)]
    .replace('{time}', `${elapsed}m`)
    .replace('{streak}', String(streak))
    .replace('{percent}', String(percentDone));

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <div className={styles.app}>

      {/* ════ DASHBOARD ════ */}
      {phase === 'dashboard' && (
        <div className={styles.dashboard}>
          <div className={styles.dashboardCols}>

            {/* ── LEFT: header + tasks ── */}
            <div className={styles.colLeft}>

              <div className={cx(styles.panel, styles.headerPanel)}>
                <div className={styles.header}>
                  <h1>Focus Sessions</h1>
                  <p>Commit to deep work. No shortcuts.</p>
                  {streak > 0 && (
                    <div className={styles.streakBadge}>
                      <span className={styles.streakDot} />
                      {streak} session streak
                    </div>
                  )}
                </div>
              </div>

              <div className={cx(styles.panel, styles.tasksPanel)}>
                <div className={styles.tasksSection}>
                  <div className={styles.tasksHeader}>
                    <div className={styles.sectionLabel} style={{ marginBottom: 0 }}>
                      Tasks
                      <span className={styles.sectionDivider} />
                    </div>
                    <span className={styles.taskCount}>{selectedTaskIds.size} queued</span>
                  </div>

                  <div className={styles.addTaskRow}>
                    <input
                      className={styles.addTaskInput}
                      placeholder="Add a task for this session..."
                      value={newTaskText}
                      onChange={(e) => setNewTaskText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addTask()}
                    />
                    <button className={styles.addTaskBtn} onClick={addTask}>Add</button>
                  </div>

                  {undoneTasks.length === 0 ? (
                    <div className={styles.tasksList}>
                      <div className={styles.tasksEmpty}>No tasks — optional. Start without any.</div>
                      {Array.from({ length: 7 }).map((_, i) => (
                        <div key={i} className={cx(styles.taskPlaceholder, i % 2 === 1 && styles.even)}>
                          <div className={styles.taskPlaceholderDot} />
                          <div className={styles.taskPlaceholderLine} style={{ width: `${42 + (i * 11) % 44}%` }} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.tasksList}>
                      {undoneTasks.map((t, i) => (
                        <div
                          key={t.id}
                          className={cx(
                            styles.taskItem,
                            i % 2 === 1 && styles.even,
                            selectedTaskIds.has(t.id) && styles.selected,
                          )}
                          onClick={() => toggleTaskSelect(t.id)}
                        >
                          <div className={styles.taskCheck}>
                            {selectedTaskIds.has(t.id) && '✓'}
                          </div>
                          <span className={styles.taskTitle}>{t.title}</span>
                          <span
                            className={styles.taskPriority}
                            style={{
                              background: `${PRIORITY_COLORS[t.priority]}12`,
                              color: PRIORITY_COLORS[t.priority],
                            }}
                          >
                            {t.priority}
                          </span>
                          <button
                            className={styles.taskRemove}
                            onClick={(e) => removeTask(t.id, e)}
                            title="Remove task"
                          >
                            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="1,3 13,3" />
                              <path d="M4 3V2a1 1 0 011-1h4a1 1 0 011 1v1" />
                              <rect x="2" y="3" width="10" height="9" rx="1" />
                              <line x1="5.5" y1="6" x2="5.5" y2="10" />
                              <line x1="8.5" y1="6" x2="8.5" y2="10" />
                            </svg>
                          </button>
                        </div>
                      ))}
                      {Array.from({ length: Math.max(0, 5 - undoneTasks.length) }).map((_, i) => {
                        const idx = undoneTasks.length + i;
                        return (
                          <div key={`ph-${i}`} className={cx(styles.taskPlaceholder, idx % 2 === 1 && styles.even)}>
                            <div className={styles.taskPlaceholderDot} />
                            <div className={styles.taskPlaceholderLine} style={{ width: `${38 + (i * 19) % 46}%` }} />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* ── RIGHT: rhythm picker + commit ── */}
            <div className={styles.colRight}>
              <div className={styles.rhythmPanel}>
                <div className={styles.sectionLabel}>
                  Choose your rhythm
                  <span className={styles.sectionDivider} />
                </div>

                <div className={styles.typesGrid}>
                  {TIMER_TYPES.map((t) => (
                    <div
                      key={t.id}
                      className={cx(
                        styles.typeCard,
                        t.id === 'custom' && styles.customCard,
                        selectedType === t.id && styles.selected,
                      )}
                      style={{ '--c': t.color }}
                      onClick={() => setSelectedType(t.id)}
                    >
                      <div className={styles.typeCardBody}>
                        <div className={styles.typeIcon}>{t.icon}</div>
                        <div className={styles.typeLabel}>{t.label}</div>
                        <div className={styles.typeDesc}>{t.desc}</div>
                        <div className={styles.typeTiming}>
                          {t.id === 'custom' ? `${customWork} / ${customRest}m` : `${t.work} / ${t.rest}m`}
                        </div>
                      </div>
                      {t.id === 'custom' && (
                        <div
                          className={cx(styles.customFields, selectedType !== 'custom' && styles.customFieldsHidden)}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {([
                            { label: 'Work',     val: customWork,     set: setCustomWork,     min: 5,  max: 180 },
                            { label: 'Break',    val: customRest,     set: setCustomRest,     min: 1,  max: 60  },
                            { label: 'Long Brk', val: customLongRest, set: setCustomLongRest, min: 5,  max: 60  },
                            { label: 'Cycles',   val: customCycles,   set: setCustomCycles,   min: 1,  max: 12  },
                          ] as const).map(({ label, val, set, min, max }) => (
                            <div className={styles.settingGroup} key={label}>
                              <label>{label}</label>
                              <input
                                className={styles.settingInput}
                                type="number"
                                min={min}
                                max={max}
                                value={val}
                                onChange={(e) =>
                                  (set as (v: number) => void)(Math.max(min, Math.min(max, +e.target.value)))
                                }
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className={styles.commitSection}>
                  <button className={styles.commitBtn} onClick={startSession}>
                    Start Session
                  </button>
                  <span className={styles.commitNote}>
                    Session locks once started — no easy exit
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ════ FOCUS SESSION ════ */}
      {phase === 'session' && (
        <div className={styles.session}>
          <div className={styles.sessionLeft}>
            <div className={styles.quote}>
              "{QUOTES[cycle % QUOTES.length]}"
            </div>

            <div className={cx(styles.sessionBadge, styles.focus)}>
              <span className={styles.pulse} />
              Deep Focus
            </div>

            <div className={styles.timerWrap}>
              <svg className={styles.timerSvg} viewBox="0 0 260 260">
                <circle className={styles.timerBg} cx="130" cy="130" r="120" />
                <circle
                  className={styles.timerProgress}
                  cx="130" cy="130" r="120"
                  style={{
                    strokeDasharray: CIRC,
                    strokeDashoffset: dashOffset,
                    filter: `drop-shadow(0 0 5px ${T.accent}50)`,
                  }}
                />
              </svg>
              <div className={styles.timerInner}>
                <div className={styles.timerTime}>{fmt(timeLeft)}</div>
                <div className={styles.timerLabel}>
                  {adaptiveBonus > 0 ? `+${adaptiveBonus}m adaptive` : 'remaining'}
                </div>
              </div>
            </div>

            <div className={styles.cycles}>
              {Array.from({ length: totalCycles }).map((_, i) => (
                <div
                  key={i}
                  className={cx(
                    styles.cycleDot,
                    i < cycle && styles.done,
                    i === cycle && styles.active,
                  )}
                />
              ))}
            </div>

            <div className={styles.sessionFooter}>
              <div className={styles.lockedMsg}>
                <div className={styles.lockedIcon}>&#9632;</div>
                Session locked — stay focused
              </div>
              <button className={styles.emergencyBtn} onClick={() => setShowQuitModal(true)}>
                Stop session (emergency only)
              </button>
            </div>
          </div>

          <div className={styles.sessionRight}>
            <div className={styles.sessionRightHeader}>
              <h3>Queue</h3>
              <span className={styles.sessionRightCount}>
                {activeTasks.filter((t) => t.done).length} / {activeTasks.length}
              </span>
            </div>

            {activeTasks.length === 0 ? (
              <div className={styles.sessionTasksList}>
                <div className={styles.sessionEmpty}>No tasks queued</div>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className={cx(styles.taskPlaceholder, i % 2 === 1 && styles.even)}>
                    <div className={styles.taskPlaceholderDot} />
                    <div className={styles.taskPlaceholderLine} style={{ width: `${48 + (i * 13) % 38}%` }} />
                  </div>
                ))}
              </div>
            ) : currentTask ? (
              <>
                <div className={styles.currentTask}>
                  <div className={styles.currentTaskLabel}>Now working on</div>
                  <div className={styles.currentTaskTitle}>{currentTask.title}</div>
                  <div className={styles.currentTaskActions}>
                    <button
                      className={cx(styles.currentTaskBtn, styles.doneBtn)}
                      onClick={() => markTaskDone(currentTask.id)}
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="2,6 5,9 10,3" />
                      </svg>
                      Done
                    </button>
                    <button
                      className={cx(styles.currentTaskBtn, styles.laterBtn)}
                      onClick={() => deferTask(currentTask.id)}
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="6" cy="6" r="4.5" />
                        <polyline points="6,3.5 6,6 7.5,7" />
                      </svg>
                      Later
                    </button>
                  </div>
                  <div className={styles.currentTaskResources}>
                    <div className={styles.currentTaskResourcesLabel}>Resources</div>
                    {getResources(currentTask.title).map((r, i) => (
                      <span key={i} className={styles.resourceChip}>
                        <span style={{ fontSize: 9 }}>{r.icon}</span>
                        {r.label}
                      </span>
                    ))}
                  </div>
                </div>

                <div className={styles.queueList}>
                  {queueRemainder.length > 0 && (
                    <div className={styles.queueLabel}>Up next</div>
                  )}
                  {queueRemainder.map((t, i) => (
                    <div key={t.id} className={cx(styles.queueRow, i % 2 === 1 && styles.even)}>
                      <div className={styles.queueRowDot} />
                      <div className={styles.queueRowTitle}>{t.title}</div>
                      {t.deferred && <span className={styles.queueRowTag}>later</span>}
                    </div>
                  ))}
                  {Array.from({ length: Math.max(0, 4 - queueRemainder.length) }).map((_, i) => {
                    const idx = queueRemainder.length + i;
                    return (
                      <div key={`ph-${i}`} className={cx(styles.taskPlaceholder, idx % 2 === 1 && styles.even)} style={{ opacity: 0.25 }}>
                        <div className={styles.taskPlaceholderDot} />
                        <div className={styles.taskPlaceholderLine} style={{ width: `${36 + (i * 19) % 44}%` }} />
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className={styles.sessionEmpty} style={{ color: T.green }}>
                All tasks complete
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════ REST BREAK ════ */}
      {phase === 'rest' && (
        <div className={styles.session}>
          <div className={styles.sessionLeft}>
            <div className={cx(styles.sessionBadge, styles.rest)}>
              <span className={styles.pulse} />
              Rest Break
            </div>

            <div className={styles.timerWrap}>
              <svg className={styles.timerSvg} viewBox="0 0 260 260">
                <circle className={styles.timerBg} cx="130" cy="130" r="120" />
                <circle
                  className={cx(styles.timerProgress, styles.restPhase)}
                  cx="130" cy="130" r="120"
                  style={{
                    strokeDasharray: CIRC,
                    strokeDashoffset: dashOffset,
                    filter: `drop-shadow(0 0 5px ${T.green}50)`,
                  }}
                />
              </svg>
              <div className={styles.timerInner}>
                <div className={styles.timerTime}>{fmt(timeLeft)}</div>
                <div className={styles.timerLabel}>break time</div>
              </div>
            </div>

            <div className={styles.cycles}>
              {Array.from({ length: totalCycles }).map((_, i) => (
                <div
                  key={i}
                  className={cx(
                    styles.cycleDot,
                    i < cycle && styles.done,
                    i === cycle && styles.active,
                  )}
                />
              ))}
            </div>

            <div className={styles.restMsg}>
              <h2>Nice work. Take a breather.</h2>
              <p>Step away. Stretch. Hydrate. Rest your eyes.</p>
            </div>

            <button className={styles.skipRest} onClick={handleRestDone}>
              Skip break and continue
            </button>
          </div>

          <div className={styles.sessionRight}>
            <div className={styles.sessionRightHeader}>
              <h3>Queue</h3>
              <span className={styles.sessionRightCount}>
                {activeTasks.filter((t) => t.done).length} / {activeTasks.length}
              </span>
            </div>
            <div className={styles.sessionTasksList}>
              {activeTasks.length === 0 ? (
                <div className={styles.sessionEmpty}>No tasks queued</div>
              ) : (
                sortedSessionTasks.map((t, i) => (
                  <div
                    key={t.id}
                    className={cx(styles.stask, i % 2 === 1 && styles.even, t.done && styles.done)}
                  >
                    <div className={cx(styles.staskCheck, t.done && styles.isDone)}>
                      {t.done && '✓'}
                    </div>
                    <div className={styles.staskInfo}>
                      <div className={styles.staskTitle}>{t.title}</div>
                      {t.deferred && !t.done && (
                        <div className={styles.staskTag}>saved for later</div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════ COMPLETION ════ */}
      {phase === 'complete' && (
        <div className={styles.complete}>
          <div className={styles.completeIcon}>✓</div>
          <h2>Session Complete</h2>
          <p>You committed and followed through.</p>

          <div className={styles.statsRow}>
            {([
              { val: totalCycles,         label: 'Cycles'     },
              { val: `${totalFocusMin}m`, label: 'Focus Time' },
              { val: completedInSession,  label: 'Tasks Done' },
              { val: streak,              label: 'Streak'     },
            ] as const).map(({ val, label }) => (
              <div key={label} className={styles.statBox}>
                <div className={styles.statVal}>{val}</div>
                <div className={styles.statLabel}>{label}</div>
              </div>
            ))}
          </div>

          <button className={styles.newSession} onClick={resetToDashboard}>
            Start New Session
          </button>
        </div>
      )}

      {/* ════ FINISH CONFIRM MODAL ════ */}
      {finishConfirmId !== null && (
        <div className={styles.overlay} onClick={() => setFinishConfirmId(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div
              className={styles.modalIcon}
              style={{ background: T.greenGlow, borderColor: `${T.green}25`, color: T.green }}
            >
              ✓
            </div>
            <h2>Mark as done?</h2>
            <div className={styles.modalDetail}>
              This will remove the task from your queue.
            </div>
            <div className={styles.modalActions}>
              <button
                className={styles.keepGoing}
                style={{ background: T.green }}
                onClick={() => { markTaskDone(finishConfirmId); setFinishConfirmId(null); }}
              >
                Yes, mark done
              </button>
              <button className={styles.quitConfirm} onClick={() => setFinishConfirmId(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════ QUIT MODAL ════ */}
      {showQuitModal && (
        <div className={styles.overlay} onClick={() => setShowQuitModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalIcon}>!</div>
            <h2>Are you sure?</h2>
            <div className={styles.modalLoss}>
              Your {streak}-session streak will be lost.
            </div>
            <div className={styles.modalDetail}>
              {quitMessage}
              <br />
              Quitting resets your streak and discards session progress.
            </div>
            <div className={styles.modalActions}>
              <button className={styles.keepGoing} onClick={() => setShowQuitModal(false)}>
                Keep Going
              </button>
              <button className={styles.quitConfirm} onClick={confirmQuit}>
                Quit anyway (resets streak)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}