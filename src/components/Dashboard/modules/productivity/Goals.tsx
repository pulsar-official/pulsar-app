"use client"

import React, { useState, useMemo } from "react"
import styles from "./Goals.module.scss"

type Cat = "work" | "personal" | "health" | "learning" | "finance" | "creative"
type Pri = "high" | "medium" | "low"
interface Sub { id: string; text: string; done: boolean }
interface Goal {
  id: string; title: string; desc: string; cat: Cat; pri: Pri
  deadline: string; done: boolean; subs: Sub[]; progress: number
}

function mkId() { return Math.random().toString(36).slice(2) }

const CATS: Cat[] = ["work","personal","health","learning","finance","creative"]
const TAG_CLS: Record<Cat,string> = { work:styles.tagWork, personal:styles.tagPersonal, health:styles.tagHealth, learning:styles.tagLearning, finance:styles.tagFinance, creative:styles.tagCreative }
const PRI_CLS: Record<Pri,string> = { high:styles.priHigh, medium:styles.priMedium, low:styles.priLow }
const CAT_COLORS: Record<Cat,string> = { work:"oklch(0.55 0.15 260)", personal:"oklch(0.72 0.16 60)", health:"oklch(0.65 0.14 150)", learning:"oklch(0.6 0.12 290)", finance:"oklch(0.65 0.14 150)", creative:"oklch(0.65 0.14 320)" }

const SAMPLE: Goal[] = [
  { id:mkId(), title:"Ship v2.0", desc:"Complete the major product release with all planned features", cat:"work", pri:"high", deadline:"2025-06-01", done:false, progress:65, subs:[{id:mkId(),text:"Design review",done:true},{id:mkId(),text:"Beta testing",done:true},{id:mkId(),text:"Launch prep",done:false}] },
  { id:mkId(), title:"Read 24 books", desc:"One book every two weeks this year", cat:"learning", pri:"medium", deadline:"2025-12-31", done:false, progress:25, subs:[{id:mkId(),text:"Q1: 6 books",done:true},{id:mkId(),text:"Q2: 12 books",done:false}] },
  { id:mkId(), title:"Run half marathon", desc:"Train and complete a 21km race", cat:"health", pri:"medium", deadline:"2025-09-15", done:false, progress:40, subs:[{id:mkId(),text:"Run 5km consistently",done:true},{id:mkId(),text:"Run 10km",done:false},{id:mkId(),text:"Complete half marathon",done:false}] },
  { id:mkId(), title:"Emergency fund", desc:"Save 6 months of expenses", cat:"finance", pri:"high", deadline:"2025-12-31", done:false, progress:55, subs:[] },
  { id:mkId(), title:"Learn Spanish B1", desc:"Reach conversational level", cat:"learning", pri:"low", deadline:"2025-12-31", done:false, progress:20, subs:[{id:mkId(),text:"A1 complete",done:true},{id:mkId(),text:"A2 complete",done:false}] },
]
const Goals: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>(SAMPLE)
  const [modalOpen, setModalOpen] = useState(false)
  const [editGoal, setEditGoal] = useState<Goal|null>(null)
  const [confirmId, setConfirmId] = useState<string|null>(null)
  const [undo, setUndo] = useState<{goal:Goal;show:boolean}|null>(null)
  const [expandedSubs, setExpandedSubs] = useState<Set<string>>(new Set())
  const [newSubText, setNewSubText] = useState<Record<string,string>>({})

  // Form
  const [fTitle, setFTitle] = useState("")
  const [fDesc, setFDesc] = useState("")
  const [fCat, setFCat] = useState<Cat>("work")
  const [fPri, setFPri] = useState<Pri>("medium")
  const [fDeadline, setFDeadline] = useState("")
  const [fProgress, setFProgress] = useState(0)

  const openAdd = () => { setEditGoal(null); setFTitle(""); setFDesc(""); setFCat("work"); setFPri("medium"); setFDeadline(""); setFProgress(0); setModalOpen(true) }
  const openEdit = (g: Goal) => { setEditGoal(g); setFTitle(g.title); setFDesc(g.desc); setFCat(g.cat); setFPri(g.pri); setFDeadline(g.deadline); setFProgress(g.progress); setModalOpen(true) }

  const save = () => {
    if (!fTitle.trim()) return
    if (editGoal) {
      setGoals(gs=>gs.map(g=>g.id===editGoal.id?{...g,title:fTitle,desc:fDesc,cat:fCat,pri:fPri,deadline:fDeadline,progress:fProgress}:g))
    } else {
      setGoals(gs=>[...gs,{id:mkId(),title:fTitle,desc:fDesc,cat:fCat,pri:fPri,deadline:fDeadline,done:false,subs:[],progress:fProgress}])
    }
    setModalOpen(false)
  }

  const toggleDone = (id: string) => setGoals(gs=>gs.map(g=>g.id===id?{...g,done:!g.done}:g))
  const toggleSubDone = (gid: string, sid: string) => setGoals(gs=>gs.map(g=>g.id!==gid?g:{...g,subs:g.subs.map(s=>s.id===sid?{...s,done:!s.done}:s)}))

  const confirmDel = (id: string) => setConfirmId(id)
  const doDelete = () => {
    if (!confirmId) return
    const g = goals.find(x=>x.id===confirmId)
    if (g) { setUndo({goal:g,show:true}); setTimeout(()=>setUndo(null),5000) }
    setGoals(gs=>gs.filter(x=>x.id!==confirmId))
    setConfirmId(null)
  }
  const doUndo = () => { if (undo) { setGoals(gs=>[...gs,undo.goal]); setUndo(null) } }

  const toggleExpand = (id: string) => setExpandedSubs(s=>{const n=new Set(s);n.has(id)?n.delete(id):n.add(id);return n})
  const addSub = (gid: string) => {
    const text = newSubText[gid]?.trim()
    if (!text) return
    setGoals(gs=>gs.map(g=>g.id!==gid?g:{...g,subs:[...g.subs,{id:mkId(),text,done:false}]}))
    setNewSubText(p=>({...p,[gid]:""}))
  }
  // Sidebar stats
  const doneCount = goals.filter(g=>g.done).length
  const activeCount = goals.filter(g=>!g.done).length
  const avgPct = useMemo(() => {
    const active = goals.filter(g=>!g.done)
    if (!active.length) return 0
    return Math.round(active.reduce((s,g)=>s+g.progress,0)/active.length)
  }, [goals])

  const catCounts = useMemo(() => {
    const m: Record<string,number> = {}
    goals.forEach(g=>{m[g.cat]=(m[g.cat]||0)+1})
    return m
  }, [goals])

  const upcoming = useMemo(() => {
    return goals.filter(g=>!g.done&&g.deadline).sort((a,b)=>a.deadline.localeCompare(b.deadline)).slice(0,5)
  }, [goals])

  const ChkSvg = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
  const SubChkSvg = () => <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>

  const renderCard = (g: Goal) => {
    const subsOpen = expandedSubs.has(g.id)
    const subsDone = g.subs.filter(s=>s.done).length
    return (
      <div key={g.id} className={[styles.card,g.done?styles.cardDone:""].filter(Boolean).join(" ")}>
        <div className={styles.gaActions}>
          <button onClick={()=>openEdit(g)} title="Edit"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
          <button className={styles.gaDelBtn} onClick={()=>confirmDel(g.id)} title="Delete"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button>
        </div>
        <div className={styles.cardTop}>
          <div className={[styles.chk,g.done?styles.chkOn:""].filter(Boolean).join(" ")} onClick={()=>toggleDone(g.id)}><ChkSvg/></div>
          <div className={styles.cardBody}>
            <div className={styles.gaTitle}>{g.title}</div>
            <div className={styles.gaDesc}>{g.desc}</div>
            <div className={styles.gaMeta}>
              <span className={[styles.gaTag,TAG_CLS[g.cat]].join(" ")}>{g.cat}</span>
              <span className={[styles.gaPri,PRI_CLS[g.pri]].join(" ")}>{g.pri}</span>
              {g.deadline&&<span className={styles.gaDate}>{g.deadline}</span>}
            </div>
          </div>
        </div>
        <div className={styles.gaProg}>
          <div className={styles.gaProgRow}><span className={styles.gaProgLbl}>Progress</span><span className={styles.gaProgPct}>{g.progress}%</span></div>
          <div className={styles.gaBar}><div className={[styles.gaFill,g.progress>=100?styles.gaFillFull:""].filter(Boolean).join(" ")} style={{width:g.progress+"%"}}/></div>
        </div>
        {g.subs.length>0&&(
          <div className={styles.gaSubs}>
            <button className={styles.gaSubToggle} onClick={()=>toggleExpand(g.id)}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{transform:subsOpen?"rotate(90deg)":"none",transition:"transform 0.15s ease"}}><polyline points="9 6 15 12 9 18"/></svg>
              {subsDone}/{g.subs.length} sub-goals
            </button>
            {subsOpen&&(
              <div className={styles.gaSubList}>
                {g.subs.map(s=>(
                  <div key={s.id} className={styles.gaSub}>
                    <div className={[styles.gaSubCk,s.done?styles.gaSubCkOn:""].filter(Boolean).join(" ")} onClick={()=>toggleSubDone(g.id,s.id)}><SubChkSvg/></div>
                    <span className={s.done?styles.gaSubNameDone:styles.gaSubName}>{s.text}</span>
                  </div>
                ))}
                <div className={styles.gaAddSub}>
                  <input placeholder="Add sub-goal..." value={newSubText[g.id]||""} onChange={e=>setNewSubText(p=>({...p,[g.id]:e.target.value}))} onKeyDown={e=>{if(e.key==="Enter")addSub(g.id)}} />
                  <button onClick={()=>addSub(g.id)}>+</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={styles.ga}>
      <div className={styles.hdr}>
        <div className={styles.hdrLeft}>
          <div className={styles.pageTitle}>Goals</div>
        </div>
        <button className={styles.btnAdd} onClick={openAdd}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add goal
        </button>
      </div>
      <div className={styles.gaWrap}>
        <div className={styles.gaList}>
          {goals.map(g=>renderCard(g))}
        </div>
        <div className={styles.gaSide}>
          <div className={styles.gaSbSection}>
            <div className={styles.gaSbTitle}>Progress</div>
            <div className={styles.gaAvg}>
              <div className={styles.gaAvgTop}>
                <div className={styles.gaAvgNum}>{avgPct}<span>%</span></div>
              </div>
              <div className={styles.gaAvgLbl}>{doneCount}/{activeCount+doneCount} goals completed</div>
              <div className={styles.gaAvgBar}><div className={styles.gaAvgFill} style={{width:avgPct+"%"}}/></div>
            </div>
          </div>
          <div className={styles.gaSbSection}>
            <div className={styles.gaSbTitle}>Categories</div>
            {CATS.map(c=>{
              const cnt = catCounts[c]||0
              const pct = goals.length?Math.round(cnt/goals.length*100):0
              return (
                <div key={c} className={styles.gaCatRow}>
                  <span className={styles.gaCatLbl}>{c}</span>
                  <div className={styles.gaCatBar}><div className={styles.gaCatFill} style={{width:pct+"%",background:CAT_COLORS[c]}}/></div>
                  <span className={styles.gaCatN}>{cnt}</span>
                </div>
              )
            })}
          </div>
          <div className={styles.gaSbSection}>
            <div className={styles.gaSbTitle}>Upcoming Deadlines</div>
            {upcoming.map(g=>(
              <div key={g.id} className={styles.gaDlItem}>
                <div className={styles.gaDlName}>{g.title}</div>
                <div className={styles.gaDlMeta}>
                  <span className={styles.gaDlDate}>{g.deadline}</span>
                  <span className={[styles.gaDlBadge,TAG_CLS[g.cat]].join(" ")}>{g.cat}</span>
                </div>
              </div>
            ))}
            {upcoming.length===0&&<div style={{fontSize:"11px",color:"oklch(0.35 0.03 280)"}}>No upcoming deadlines</div>}
          </div>
        </div>
      </div>
      <div className={[styles.gaMo,modalOpen?styles.gaMoOpen:""].filter(Boolean).join(" ")} onClick={()=>setModalOpen(false)}>
        <div className={styles.gaMbox} onClick={e=>e.stopPropagation()}>
          <h3>{editGoal?"Edit Goal":"New Goal"}</h3>
          <label>Title</label>
          <input value={fTitle} onChange={e=>setFTitle(e.target.value)} placeholder="Goal title..." />
          <label>Description</label>
          <textarea value={fDesc} onChange={e=>setFDesc(e.target.value)} placeholder="Describe your goal..." />
          <div className={styles.row}>
            <div>
              <label>Category</label>
              <select value={fCat} onChange={e=>setFCat(e.target.value as Cat)}>
                {CATS.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label>Priority</label>
              <select value={fPri} onChange={e=>setFPri(e.target.value as Pri)}>
                {(["high","medium","low"] as Pri[]).map(p=><option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <label>Deadline</label>
          <input type="date" value={fDeadline} onChange={e=>setFDeadline(e.target.value)} />
          <div className={styles.gaProgWrap}>
            <div className={styles.gaProgHeader}>
              <span>Progress</span>
              <em>{fProgress}%</em>
            </div>
            <div className={styles.gaProgTrack}>
              <div className={styles.gaProgFillTrack} style={{width:fProgress+"%"}}/>
              <input className={styles.gaProgRange} type="range" min="0" max="100" value={fProgress} onChange={e=>setFProgress(+e.target.value)} />
            </div>
            <div className={styles.gaProgNote}>Drag to set progress</div>
          </div>
          <div className={styles.gaMacts}>
            <button className={styles.gaCancel} onClick={()=>setModalOpen(false)}>Cancel</button>
            <button className={styles.gaSave} onClick={save}>Save</button>
          </div>
        </div>
      </div>
      <div className={[styles.gaConfirmMo,confirmId?styles.gaConfirmMoOpen:""].filter(Boolean).join(" ")} onClick={()=>setConfirmId(null)}>
        <div className={styles.gaConfirmBox} onClick={e=>e.stopPropagation()}>
          <div className={styles.gaConfirmIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
          </div>
          <div className={styles.gaConfirmTitle}>Delete this goal?</div>
          <div className={styles.gaConfirmDesc}>This will remove <strong>"{goals.find(g=>g.id===confirmId)?.title}"</strong> and all its sub-goals. You can undo within 5 seconds.</div>
          <div className={styles.gaConfirmActs}>
            <button className={styles.gaCc} onClick={()=>setConfirmId(null)}>Cancel</button>
            <button className={styles.gaCd} onClick={doDelete}>Delete</button>
          </div>
        </div>
      </div>
      <div className={[styles.gaUndo,undo&&undo.show?styles.gaUndoShow:""].filter(Boolean).join(" ")}>
        <span>Goal deleted</span>
        <button onClick={doUndo}>Undo</button>
      </div>
    </div>
  )
}

export default Goals