"use client"

import React, { useState, useMemo } from "react"
import styles from "./Goals.module.scss"
import { useProductivityStore } from '@/stores/productivityStore'
import type { Goal, GoalCategory, Priority } from '@/types/productivity'
import RelatedItems from '../shared/RelatedItems'

type Cat = GoalCategory
type Pri = Priority

const CATS: Cat[] = ["work", "personal", "health", "learning", "finance", "creative"]
const PRIS: Pri[] = ["high", "medium", "low"]
const CAT_COLORS: Record<Cat, string> = {
  work: "oklch(0.55 0.15 260)", personal: "oklch(0.72 0.16 60)", health: "oklch(0.65 0.14 150)",
  learning: "oklch(0.6 0.12 290)", finance: "oklch(0.60 0.14 170)", creative: "oklch(0.65 0.14 320)",
}
const PRI_COLORS: Record<Pri, string> = { high: "oklch(0.65 0.15 20)", medium: "oklch(0.72 0.16 60)", low: "oklch(0.65 0.14 150)" }

type FilterStatus = 'all' | 'active' | 'done'
type SortBy = 'deadline' | 'progress' | 'priority'

const PRI_ORDER: Record<Pri, number> = { high: 0, medium: 1, low: 2 }

function deadlineLabel(d: string | null): { text: string; cls: string } {
  if (!d) return { text: 'No deadline', cls: 'neutral' }
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(d)
  target.setHours(0, 0, 0, 0)
  const diff = Math.ceil((target.getTime() - today.getTime()) / 86400000)
  if (diff < 0) return { text: `${Math.abs(diff)}d overdue`, cls: 'overdue' }
  if (diff === 0) return { text: 'Due today', cls: 'soon' }
  if (diff <= 7) return { text: `${diff}d left`, cls: 'soon' }
  return { text: `${diff}d left`, cls: 'neutral' }
}

function autoProgress(g: Goal): number {
  if (g.subs.length === 0) return g.progress
  const done = g.subs.filter(s => s.done).length
  return Math.round((done / g.subs.length) * 100)
}

/* ── Mini SVG ring ── */
const MiniRing: React.FC<{ pct: number; size?: number; color?: string }> = ({ pct, size = 32, color = 'oklch(0.55 0.18 290)' }) => {
  const r = (size - 4) / 2
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: 'stroke-dasharray 0.4s ease' }} />
      <text x={size / 2} y={size / 2 + 1} textAnchor="middle" dominantBaseline="central" className={styles.ringPct}>
        {pct}
      </text>
    </svg>
  )
}

const Goals: React.FC<{ onNavigate?: (page: string) => void }> = ({ onNavigate }) => {
  const goals = useProductivityStore(s => s.goals)
  const storeAddGoal = useProductivityStore(s => s.addGoal)
  const storeUpdateGoal = useProductivityStore(s => s.updateGoal)
  const storeDeleteGoal = useProductivityStore(s => s.deleteGoal)
  const storeToggleSubGoal = useProductivityStore(s => s.toggleSubGoal)
  const storeAddSubGoal = useProductivityStore(s => s.addSubGoal)

  const [selectedId, setSelectedId] = useState<number | null>(goals[0]?.id ?? null)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterCat, setFilterCat] = useState<Cat | 'all'>('all')
  const [sortBy, setSortBy] = useState<SortBy>('priority')
  const [modalOpen, setModalOpen] = useState(false)
  const [editGoal, setEditGoal] = useState<Goal | null>(null)
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [undo, setUndo] = useState<{ goal: Goal; show: boolean } | null>(null)
  const [newSubText, setNewSubText] = useState("")

  // Form state
  const [fTitle, setFTitle] = useState("")
  const [fDesc, setFDesc] = useState("")
  const [fCat, setFCat] = useState<Cat>("work")
  const [fPri, setFPri] = useState<Pri>("medium")
  const [fDeadline, setFDeadline] = useState("")
  const [fProgress, setFProgress] = useState(0)

  const selected = useMemo(() => goals.find(g => g.id === selectedId) ?? null, [goals, selectedId])

  // Filtered + sorted goals
  const filteredGoals = useMemo(() => {
    let list = [...goals]
    if (filterStatus === 'active') list = list.filter(g => !g.done)
    if (filterStatus === 'done') list = list.filter(g => g.done)
    if (filterCat !== 'all') list = list.filter(g => g.category === filterCat)
    if (sortBy === 'deadline') list.sort((a, b) => (a.deadline ?? '9999').localeCompare(b.deadline ?? '9999'))
    if (sortBy === 'progress') list.sort((a, b) => autoProgress(b) - autoProgress(a))
    if (sortBy === 'priority') list.sort((a, b) => PRI_ORDER[a.priority] - PRI_ORDER[b.priority])
    return list
  }, [goals, filterStatus, filterCat, sortBy])

  // Group by category
  const grouped = useMemo(() => {
    const map: Record<string, Goal[]> = {}
    for (const g of filteredGoals) {
      if (!map[g.category]) map[g.category] = []
      map[g.category].push(g)
    }
    return map
  }, [filteredGoals])

  // Stats
  const stats = useMemo(() => {
    const active = goals.filter(g => !g.done)
    const done = goals.filter(g => g.done)
    const avgPct = active.length > 0 ? Math.round(active.reduce((s, g) => s + autoProgress(g), 0) / active.length) : 0
    const catCounts: Record<string, number> = {}
    const priCounts: Record<string, number> = {}
    goals.forEach(g => {
      catCounts[g.category] = (catCounts[g.category] || 0) + 1
      priCounts[g.priority] = (priCounts[g.priority] || 0) + 1
    })
    const upcoming = goals.filter(g => !g.done && g.deadline).sort((a, b) => (a.deadline ?? '').localeCompare(b.deadline ?? '')).slice(0, 5)
    return { active: active.length, done: done.length, total: goals.length, avgPct, catCounts, priCounts, upcoming }
  }, [goals])

  const openAdd = () => {
    setEditGoal(null); setFTitle(""); setFDesc(""); setFCat("work"); setFPri("medium"); setFDeadline(""); setFProgress(0)
    setModalOpen(true)
  }
  const openEdit = () => {
    if (!selected) return
    setEditGoal(selected); setFTitle(selected.title); setFDesc(selected.description)
    setFCat(selected.category); setFPri(selected.priority); setFDeadline(selected.deadline ?? ''); setFProgress(selected.progress)
    setModalOpen(true)
  }

  const save = () => {
    if (!fTitle.trim()) return
    if (editGoal) {
      storeUpdateGoal({ ...editGoal, title: fTitle, description: fDesc, category: fCat, priority: fPri, deadline: fDeadline || null, progress: fProgress })
    } else {
      storeAddGoal({ title: fTitle, description: fDesc, category: fCat, priority: fPri, deadline: fDeadline || null, done: false, progress: fProgress })
    }
    setModalOpen(false)
  }

  const toggleDone = (g: Goal) => storeUpdateGoal({ ...g, done: !g.done })
  const toggleSubDone = (sid: number) => {
    if (!selected) return
    const sub = selected.subs.find(s => s.id === sid)
    if (sub) storeToggleSubGoal(sid, !sub.done)
  }

  const confirmDel = () => { if (selected) setConfirmId(selected.id) }
  const doDelete = () => {
    if (confirmId == null) return
    const g = goals.find(x => x.id === confirmId)
    if (g) { setUndo({ goal: g, show: true }); setTimeout(() => setUndo(null), 5000) }
    storeDeleteGoal(confirmId)
    setConfirmId(null)
    setSelectedId(goals.find(x => x.id !== confirmId)?.id ?? null)
  }
  const doUndo = () => {
    if (!undo) return
    storeAddGoal({ title: undo.goal.title, description: undo.goal.description, category: undo.goal.category, priority: undo.goal.priority, deadline: undo.goal.deadline, done: undo.goal.done, progress: undo.goal.progress })
    setUndo(null)
  }

  const addSub = () => {
    if (!selected || !newSubText.trim()) return
    storeAddSubGoal(selected.id, newSubText.trim())
    setNewSubText("")
  }

  const selectedProgress = selected ? autoProgress(selected) : 0
  const selectedDeadline = selected ? deadlineLabel(selected.deadline) : null
  const selectedSubsDone = selected ? selected.subs.filter(s => s.done).length : 0

  // Stats SVG ring
  const statsRingR = 36
  const statsRingCirc = 2 * Math.PI * statsRingR
  const statsRingDash = (stats.avgPct / 100) * statsRingCirc

  return (
    <div className={styles.wrap}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.pageTitle}>Goals</div>
          <div className={styles.filterRow}>
            {(['all', 'active', 'done'] as FilterStatus[]).map(s => (
              <button key={s} className={[styles.pill, filterStatus === s ? styles.pillActive : ''].filter(Boolean).join(' ')} onClick={() => setFilterStatus(s)}>
                {s === 'all' ? `All (${stats.total})` : s === 'active' ? `Active (${stats.active})` : `Done (${stats.done})`}
              </button>
            ))}
            <select className={styles.catSelect} value={filterCat} onChange={e => setFilterCat(e.target.value as Cat | 'all')}>
              <option value="all">All categories</option>
              {CATS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
            <select className={styles.sortSelect} value={sortBy} onChange={e => setSortBy(e.target.value as SortBy)}>
              <option value="priority">Priority</option>
              <option value="deadline">Deadline</option>
              <option value="progress">Progress</option>
            </select>
          </div>
        </div>
        <button className={styles.addBtn} onClick={openAdd}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Add goal
        </button>
      </div>

      {/* Body: 3 panels */}
      <div className={styles.body}>
        {/* Left: goal cards */}
        <div className={styles.listPanel}>
          {Object.keys(grouped).length === 0 && (
            <div className={styles.empty}>No goals match your filters</div>
          )}
          {CATS.filter(c => grouped[c]?.length).map(cat => (
            <div key={cat} className={styles.catGroup}>
              <div className={styles.catHeader}>
                <span className={styles.catDot} style={{ background: CAT_COLORS[cat] }} />
                <span className={styles.catLabel}>{cat}</span>
                <span className={styles.catCount}>{grouped[cat].length}</span>
              </div>
              {grouped[cat].map(g => {
                const pct = autoProgress(g)
                const dl = deadlineLabel(g.deadline)
                const isSelected = selectedId === g.id
                return (
                  <div key={g.id} className={[styles.goalCard, isSelected ? styles.goalCardActive : '', g.done ? styles.goalCardDone : ''].filter(Boolean).join(' ')} onClick={() => setSelectedId(g.id)}>
                    <div className={styles.goalCardLeft}>
                      <div className={[styles.chk, g.done ? styles.chkOn : ''].filter(Boolean).join(' ')} onClick={e => { e.stopPropagation(); toggleDone(g) }}>
                        {g.done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>}
                      </div>
                      <div className={styles.goalCardInfo}>
                        <div className={styles.goalCardTitle}>{g.title}</div>
                        <div className={styles.goalCardMeta}>
                          <span className={styles.priDot} style={{ background: PRI_COLORS[g.priority] }} />
                          <span className={styles.goalCardPri}>{g.priority}</span>
                          {g.deadline && <span className={[styles.goalCardDl, styles[`dl_${dl.cls}`]].join(' ')}>{dl.text}</span>}
                        </div>
                      </div>
                    </div>
                    <MiniRing pct={pct} size={32} color={g.done ? 'oklch(0.65 0.14 150)' : CAT_COLORS[g.category]} />
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Center: detail panel */}
        <div className={styles.detailPanel}>
          {selected ? (
            <>
              <div className={styles.detailHeader}>
                <div className={styles.detailTitleRow}>
                  <div className={[styles.detailChk, selected.done ? styles.detailChkOn : ''].filter(Boolean).join(' ')} onClick={() => toggleDone(selected)}>
                    {selected.done && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>}
                  </div>
                  <h2 className={styles.detailTitle}>{selected.title}</h2>
                </div>
                <div className={styles.detailActions}>
                  <button className={styles.detailEditBtn} onClick={openEdit}>Edit</button>
                  <button className={styles.detailDelBtn} onClick={confirmDel}>Delete</button>
                </div>
              </div>

              {selected.description && <p className={styles.detailDesc}>{selected.description}</p>}

              <div className={styles.detailMeta}>
                <span className={styles.detailTag} style={{ background: `color-mix(in oklch, ${CAT_COLORS[selected.category]} 25%, transparent)`, color: CAT_COLORS[selected.category] }}>
                  {selected.category}
                </span>
                <span className={styles.detailTag} style={{ background: `color-mix(in oklch, ${PRI_COLORS[selected.priority]} 25%, transparent)`, color: PRI_COLORS[selected.priority] }}>
                  {selected.priority}
                </span>
                {selectedDeadline && (
                  <span className={[styles.detailDl, styles[`dl_${selectedDeadline.cls}`]].join(' ')}>
                    {selectedDeadline.text}
                  </span>
                )}
              </div>

              {/* Progress */}
              <div className={styles.detailProgress}>
                <div className={styles.detailProgHeader}>
                  <span>Progress</span>
                  <span className={styles.detailProgPct}>{selectedProgress}%</span>
                </div>
                <div className={styles.detailProgBar}>
                  <div className={[styles.detailProgFill, selectedProgress >= 100 ? styles.detailProgFull : ''].filter(Boolean).join(' ')} style={{ width: `${selectedProgress}%` }} />
                </div>
              </div>

              {/* Sub-goals */}
              <div className={styles.detailSubs}>
                <div className={styles.detailSubsHeader}>
                  <span className={styles.detailSubsTitle}>Sub-goals</span>
                  <span className={styles.detailSubsCount}>{selectedSubsDone}/{selected.subs.length}</span>
                </div>
                <div className={styles.detailSubList}>
                  {selected.subs.map(s => (
                    <div key={s.id} className={styles.detailSub} onClick={() => toggleSubDone(s.id)}>
                      <div className={[styles.subChk, s.done ? styles.subChkOn : ''].filter(Boolean).join(' ')}>
                        {s.done && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>}
                      </div>
                      <span className={s.done ? styles.subNameDone : styles.subName}>{s.text}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.addSubRow}>
                  <input className={styles.addSubInput} placeholder="Add sub-goal..." value={newSubText} onChange={e => setNewSubText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addSub() }} />
                  <button className={styles.addSubBtn} onClick={addSub}>+</button>
                </div>
              </div>

              {/* Smart connections */}
              <RelatedItems itemType="goal" itemId={selected.id} onNavigate={onNavigate} />
            </>
          ) : (
            <div className={styles.empty}>Select a goal to view details</div>
          )}
        </div>

        {/* Right: stats */}
        <div className={styles.statsPanel}>
          {/* Overall progress ring */}
          <div className={styles.statsSection}>
            <div className={styles.statsLabel}>Overall progress</div>
            <div className={styles.statsRingWrap}>
              <svg viewBox="0 0 80 80" className={styles.statsRingSvg}>
                <circle cx="40" cy="40" r={statsRingR} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                <circle cx="40" cy="40" r={statsRingR} fill="none" stroke="oklch(0.55 0.18 290)" strokeWidth="5" strokeLinecap="round"
                  strokeDasharray={`${statsRingDash} ${statsRingCirc}`} transform="rotate(-90 40 40)" style={{ transition: 'stroke-dasharray 0.6s ease' }} />
                <text x="40" y="37" textAnchor="middle" className={styles.statsRingPct}>{stats.avgPct}%</text>
                <text x="40" y="50" textAnchor="middle" className={styles.statsRingSub}>{stats.done}/{stats.total} done</text>
              </svg>
            </div>
          </div>

          {/* Category breakdown */}
          <div className={styles.statsSection}>
            <div className={styles.statsLabel}>Categories</div>
            {CATS.map(c => {
              const cnt = stats.catCounts[c] || 0
              if (cnt === 0) return null
              const pct = stats.total > 0 ? Math.round((cnt / stats.total) * 100) : 0
              return (
                <div key={c} className={styles.catBarRow}>
                  <span className={styles.catBarLabel}>{c}</span>
                  <div className={styles.catBarWrap}>
                    <div className={styles.catBarFill} style={{ width: `${pct}%`, background: CAT_COLORS[c] }} />
                  </div>
                  <span className={styles.catBarN}>{cnt}</span>
                </div>
              )
            })}
          </div>

          {/* Priority breakdown */}
          <div className={styles.statsSection}>
            <div className={styles.statsLabel}>Priority</div>
            <div className={styles.priRow}>
              {PRIS.map(p => {
                const cnt = stats.priCounts[p] || 0
                return (
                  <div key={p} className={styles.priBlock}>
                    <span className={styles.priBlockVal}>{cnt}</span>
                    <span className={styles.priBlockDot} style={{ background: PRI_COLORS[p] }} />
                    <span className={styles.priBlockLabel}>{p}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Upcoming deadlines */}
          <div className={styles.statsSection}>
            <div className={styles.statsLabel}>Upcoming deadlines</div>
            {stats.upcoming.length === 0 && <div className={styles.noDeadlines}>No upcoming deadlines</div>}
            {stats.upcoming.map(g => {
              const dl = deadlineLabel(g.deadline)
              return (
                <div key={g.id} className={styles.dlItem} onClick={() => setSelectedId(g.id)}>
                  <div className={styles.dlItemName}>{g.title}</div>
                  <div className={styles.dlItemMeta}>
                    <span className={[styles.dlItemDate, styles[`dl_${dl.cls}`]].join(' ')}>{dl.text}</span>
                    <span className={styles.dlItemCat} style={{ color: CAT_COLORS[g.category] }}>{g.category}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className={styles.overlay} onClick={() => setModalOpen(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>{editGoal ? "Edit Goal" : "New Goal"}</h3>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Title</label>
              <input className={styles.fieldInput} value={fTitle} onChange={e => setFTitle(e.target.value)} placeholder="Goal title..." autoFocus />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Description</label>
              <textarea className={styles.fieldTextarea} value={fDesc} onChange={e => setFDesc(e.target.value)} placeholder="Describe your goal..." />
            </div>
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Category</label>
                <select className={styles.fieldSelect} value={fCat} onChange={e => setFCat(e.target.value as Cat)}>
                  {CATS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Priority</label>
                <select className={styles.fieldSelect} value={fPri} onChange={e => setFPri(e.target.value as Pri)}>
                  {PRIS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Deadline</label>
              <input className={styles.fieldInput} type="date" value={fDeadline} onChange={e => setFDeadline(e.target.value)} />
            </div>
            <div className={styles.field}>
              <div className={styles.progSliderHeader}>
                <label className={styles.fieldLabel}>Progress</label>
                <span className={styles.progSliderVal}>{fProgress}%</span>
              </div>
              <div className={styles.progSliderTrack}>
                <div className={styles.progSliderFill} style={{ width: `${fProgress}%` }} />
                <input className={styles.progSliderRange} type="range" min="0" max="100" value={fProgress} onChange={e => setFProgress(+e.target.value)} />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setModalOpen(false)}>Cancel</button>
              <button className={styles.saveBtn} onClick={save}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {confirmId != null && (
        <div className={styles.overlay} onClick={() => setConfirmId(null)}>
          <div className={styles.confirmBox} onClick={e => e.stopPropagation()}>
            <div className={styles.confirmIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
            </div>
            <div className={styles.confirmTitle}>Delete this goal?</div>
            <div className={styles.confirmDesc}>This will remove <strong>&quot;{goals.find(g => g.id === confirmId)?.title}&quot;</strong> and all its sub-goals.</div>
            <div className={styles.confirmActions}>
              <button className={styles.cancelBtn} onClick={() => setConfirmId(null)}>Cancel</button>
              <button className={styles.deleteBtn} onClick={doDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Undo toast */}
      <div className={[styles.undoToast, undo?.show ? styles.undoToastShow : ''].filter(Boolean).join(' ')}>
        <span>Goal deleted</span>
        <button onClick={doUndo}>Undo</button>
      </div>
    </div>
  )
}

export default Goals
