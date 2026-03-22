'use client'

import React, { useRef, useEffect } from 'react'
import styles from './Dropdown.module.scss'

const ICON_SVGS: Record<string, string> = {
  grid: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
  pin: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 2l2.5 6.5H21l-5.5 4 2 6.5L12 15l-5.5 4 2-6.5L3 8.5h7.5z"/></svg>`,
  bell: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
  zap: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  timer: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/></svg>`,
  trend: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>`,
  note: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
  book: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
  card: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>`,
  stack: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`,
  graph: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="2"/><circle cx="4" cy="6" r="2"/><circle cx="20" cy="6" r="2"/><circle cx="4" cy="18" r="2"/><circle cx="20" cy="18" r="2"/><line x1="6" y1="7" x2="10" y2="11"/><line x1="14" y1="11" x2="18" y2="7"/><line x1="6" y1="17" x2="10" y2="13"/><line x1="14" y1="13" x2="18" y2="17"/></svg>`,
  bar: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
  check: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  cal: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  clip: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>`,
  repeat: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>`,
  target: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
  heat: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="3" width="4" height="4" rx="0.5"/><rect x="10" y="3" width="4" height="4" rx="0.5"/><rect x="17" y="3" width="4" height="4" rx="0.5"/><rect x="3" y="10" width="4" height="4" rx="0.5"/><rect x="10" y="10" width="4" height="4" rx="0.5"/><rect x="17" y="10" width="4" height="4" rx="0.5"/><rect x="3" y="17" width="4" height="4" rx="0.5"/><rect x="10" y="17" width="4" height="4" rx="0.5"/><rect x="17" y="17" width="4" height="4" rx="0.5"/></svg>`,
  sliders: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/><circle cx="9" cy="6" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="10" cy="18" r="2"/></svg>`,
  report: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><polyline points="14 2 14 8 20 8"/></svg>`,
  layout: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>`,
  palette: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10c0 1.657-2.686 3-6 3h-1c-1.105 0-2 .895-2 2s.895 2 2 2"/><circle cx="8" cy="10" r="1"/><circle cx="12" cy="7" r="1"/><circle cx="16" cy="10" r="1"/></svg>`,
  users: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  chat: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  lock: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  plug: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>`,
  folder: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
  code: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
  beaker: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M9 3h6M9 3v8l-5 10h16l-5-10V3"/></svg>`,
  kbd: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="2" y="6" width="20" height="12" rx="2"/><line x1="6" y1="10" x2="6" y2="10"/><line x1="10" y1="10" x2="10" y2="10"/><line x1="14" y1="10" x2="14" y2="10"/><line x1="18" y1="10" x2="18" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/></svg>`,
}

const PILLARS = {
  corespace:{label:'Corespace',accent:'oklch(0.75 0.15 260)',sections:[{title:'Your Space',items:[{i:'grid',n:'Dashboard',b:null,page:'dashboard'},{i:'pin',n:'Pinned',b:'4',page:'pinned'},{i:'bell',n:'Notifications',b:'12',page:'notifications'},{i:'zap',n:'Quick Capture',b:null,page:'quickcapture'}]},{title:'Recent',items:[{i:'timer',n:'Focus Launcher',b:null,page:'focuslauncher'},{i:'trend',n:'Momentum',b:null,page:'momentum'},{i:'note',n:'Inbox',b:'6',page:'inbox'}]}]},
  knowledge:{label:'Knowledge',accent:'oklch(0.72 0.14 150)',sections:[{title:'Create',items:[{i:'note',n:'Notes',b:null,page:'notes'},{i:'book',n:'Topic Library',b:null,page:'topiclibrary'},{i:'card',n:'Study Sheets',b:null,page:'studysheets'},{i:'stack',n:'Reference Vault',b:null,page:'refvault'}]},{title:'Explore',items:[{i:'graph',n:'Concept Map',b:null,page:'conceptmap'},{i:'zap',n:'Accelerators',b:null,page:'accelerators'},{i:'bar',n:'Insight Dashboard',b:null,page:'knowledgeinsights'}]}]},
  productivity:{label:'Productivity',accent:'oklch(0.72 0.16 60)',sections:[{title:'Do',items:[{i:'check',n:'Tasks',b:'7',page:'tasks'},{i:'cal',n:'Calendar',b:null,page:'calendar'},{i:'timer',n:'Focus Sessions',b:null,page:'focus'}]},{title:'Track',items:[{i:'repeat',n:'Habits',b:null,page:'habits'},{i:'target',n:'Goals',b:'2',page:'goals'},{i:'note',n:'Journal',b:null,page:'journal'}]}]},
  insights:{label:'Insights',accent:'oklch(0.72 0.14 200)',sections:[{title:'Metrics',items:[{i:'bar',n:'Productivity Score',b:null,page:'prodscore'},{i:'heat',n:'Focus Heatmap',b:null,page:'heatmap'},{i:'graph',n:'Knowledge Growth',b:null,page:'knowledgegrowth'},{i:'trend',n:'Habit & Goal Trends',b:null,page:'habittrends'}]},{title:'Reports',items:[{i:'sliders',n:'Custom Graph Builder',b:null,page:'graphbuilder'},{i:'timer',n:'Session Log',b:null,page:'sessionlog'},{i:'report',n:'Weekly Snapshot',b:'New',page:'weeklysnapshot'}]}]},
  customization:{label:'Customization',accent:'oklch(0.72 0.16 290)',sections:[{title:'Build',items:[{i:'layout',n:'Layout Studio',b:null,page:'layoutstudio'},{i:'palette',n:'Theme Builder',b:null,page:'themebuilder'},{i:'note',n:'Note Type Editor',b:null,page:'notetypeeditor'},{i:'stack',n:'Module Library',b:null,page:'modulelibrary'}]},{title:'Configure',items:[{i:'graph',n:'Tag Explorer',b:null,page:'tagexplorer'},{i:'kbd',n:'Shortcut Editor',b:null,page:'shortcuts'},{i:'layout',n:'View Templates',b:null,page:'viewtemplates'}]}]},
  collaboration:{label:'Collaboration',accent:'oklch(0.72 0.14 330)',sections:[{title:'Together',items:[{i:'users',n:'Team Spaces',b:'2',page:'teamspaces'},{i:'clip',n:'Project Boards',b:'3',page:'projects'},{i:'target',n:'Shared Goals',b:null,page:'sharedgoals'},{i:'stack',n:'Shared Knowledge',b:null,page:'sharedknowledge'}]},{title:'Communicate',items:[{i:'chat',n:'Comments & Threads',b:'5',page:'comments'},{i:'trend',n:'Activity Feed',b:null,page:'activityfeed'},{i:'lock',n:'Permission Layers',b:null,page:'permissions'}]}]},
  extensions:{label:'Extensions',accent:'oklch(0.72 0.14 20)',sections:[{title:'Connect',items:[{i:'plug',n:'Installed Apps',b:null,page:'installedapps'},{i:'folder',n:'Import / Export',b:null,page:'importexport'},{i:'zap',n:'Automations',b:null,page:'automations'},{i:'code',n:'Developer API',b:null,page:'devapi'}]},{title:'Explore',items:[{i:'beaker',n:'Labs',b:'3',page:'labs'},{i:'stack',n:'Session Backup',b:null,page:'sessionbackup'}]}]},
}

interface DropdownProps {
  isOpen: boolean
  currentPillarId: string
  onClose: () => void
  onNavigate?: (page: string) => void
  collapsed?: boolean
}

export const Dropdown: React.FC<DropdownProps> = ({
  isOpen,
  currentPillarId,
  onClose,
  onNavigate,
  collapsed = false,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const pillarData = PILLARS[currentPillarId as keyof typeof PILLARS]

  const buildDropdown = () => {
    if (!contentRef.current || !pillarData) return

    contentRef.current.innerHTML = pillarData.sections
      .map(
        (sec) => `
          <div class="${styles.section}">
            <div class="${styles.sectionLabel}">${sec.title}</div>
            ${sec.items.map((it) => `
              <div class="${styles.item}" data-page="${it.page}">
                <div class="${styles.itemIcon}" style="color:${pillarData.accent}">${ICON_SVGS[it.i] || ICON_SVGS.grid}</div>
                <span class="${styles.itemName}">${it.n}</span>
                ${it.b ? `<span class="${styles.itemBadge}">${it.b}</span>` : ''}
              </div>
            `).join('')}
          </div>
        `
      )
      .join('')

    contentRef.current.querySelectorAll(`.${styles.item}`).forEach((el) => {
      ;(el as HTMLElement).addEventListener('click', () => {
        const page = (el as HTMLElement).dataset.page
        if (page) onNavigate?.(page)
      })
    })
  }

  // Open dropdown
  useEffect(() => {
    if (!isOpen || !dropdownRef.current || !contentRef.current) return

    const dropdown = dropdownRef.current
    const content = contentRef.current

    buildDropdown()

    // Get height
    dropdown.style.transition = 'none'
    dropdown.style.height = 'auto'
    dropdown.style.opacity = '1'
    const height = dropdown.scrollHeight
    dropdown.style.height = '0'
    dropdown.style.opacity = '0'
    content.style.opacity = '0'

    void dropdown.offsetHeight

    requestAnimationFrame(() => {
      dropdown.style.transition = `height 360ms cubic-bezier(0.16,1,0.3,1), opacity 200ms ease`
      dropdown.style.height = `${height}px`
      dropdown.style.opacity = '1'

      setTimeout(() => {
        content.style.transition = 'opacity 240ms ease'
        content.style.opacity = '1'
      }, 80)
    })
  }, [isOpen])

  // Switch pillar - smooth height transition
  useEffect(() => {
    if (!isOpen || !dropdownRef.current || !contentRef.current) return

    const dropdown = dropdownRef.current
    const content = contentRef.current

    // Get current height BEFORE fading
    dropdown.style.transition = 'none'
    const oldHeight = dropdown.scrollHeight

    // Fade content out
    content.style.transition = 'opacity 120ms ease'
    content.style.opacity = '0'

    setTimeout(() => {
      // Build new content
      buildDropdown()

      // Get new height
      dropdown.style.transition = 'none'
      dropdown.style.height = 'auto'
      const newHeight = dropdown.scrollHeight

      // Set to old height immediately
      dropdown.style.height = `${oldHeight}px`

      void dropdown.offsetHeight

      // Animate to new height
      dropdown.style.transition = `height 360ms cubic-bezier(0.16,1,0.3,1)`
      dropdown.style.height = `${newHeight}px`

      // Fade back in
      setTimeout(() => {
        content.style.transition = 'opacity 160ms ease'
        content.style.opacity = '1'
      }, 80)
    }, 120)
  }, [currentPillarId, isOpen])

  // Close dropdown
  useEffect(() => {
    if (isOpen || !dropdownRef.current || !contentRef.current) return

    const dropdown = dropdownRef.current
    const content = contentRef.current

    content.style.transition = 'opacity 160ms ease'
    content.style.opacity = '0'

    setTimeout(() => {
      dropdown.style.transition = `height 320ms cubic-bezier(0.4,0,0.2,1), opacity 240ms ease`
      dropdown.style.height = '0'
      dropdown.style.opacity = '0'
    }, 60)
  }, [isOpen])

  // Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const dropdownClasses = [
    styles.dropdown,
    isOpen ? styles.isOpen : '',
    collapsed ? styles.collapsed : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div ref={dropdownRef} className={dropdownClasses}>
      <div ref={contentRef} className={styles.content} />
    </div>
  )
}

export default Dropdown