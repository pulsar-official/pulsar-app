'use client'

import React from 'react'
import styles from './MainContent.module.scss'
import { useUIStore } from '@/stores/uiStore'

// Dashboard
import Dashboard from './modules/dashboard/Dashboard'
import PillarHome from './modules/shared/PillarHome'

// Corespace
import Pinned from './modules/corespace/Pinned'
import Notifications from './modules/corespace/Notifications'
import QuickCapture from './modules/corespace/QuickCapture'
import FocusLauncher from './modules/corespace/FocusLauncher'
import Momentum from './modules/corespace/Momentum'
import Inbox from './modules/corespace/Inbox'

// Knowledge
import Notes from './modules/knowledge/Notes'
import TopicLibrary from './modules/knowledge/TopicLibrary'
import StudySheets from './modules/knowledge/StudySheets'
import RefVault from './modules/knowledge/RefVault'
import ConceptMap from './modules/knowledge/ConceptMap'
import Accelerators from './modules/knowledge/Accelerators'
import KnowledgeInsights from './modules/knowledge/KnowledgeInsights'

// Productivity
import Tasks from './modules/productivity/Tasks'
import Calendar from './modules/productivity/Calendar'
import ProjectBoards from './modules/productivity/ProjectBoards'
import FocusSessions from './modules/productivity/FocusSessions'
import Habits from './modules/productivity/Habits'
import Goals from './modules/productivity/Goals'
import JournalEditor from './modules/productivity/JournalEditor'
import JournalEntries from './modules/productivity/JournalEntries'
import JournalTemplates from './modules/productivity/JournalTemplates'
import MoodTracker from './modules/productivity/MoodTracker'
import JournalPrompts from './modules/productivity/JournalPrompts'
import JournalStreaks from './modules/productivity/JournalStreaks'

// Insights
import ProdScore from './modules/insights/ProdScore'
import FocusHeatmap from './modules/insights/FocusHeatmap'
import KnowledgeGrowth from './modules/insights/KnowledgeGrowth'
import HabitTrends from './modules/insights/HabitTrends'
import GraphBuilder from './modules/insights/GraphBuilder'
import SessionLog from './modules/insights/SessionLog'
import WeeklySnapshot from './modules/insights/WeeklySnapshot'

// Customization
import LayoutStudio from './modules/customization/LayoutStudio'
import ThemeBuilder from './modules/customization/ThemeBuilder'
import NoteTypeEditor from './modules/customization/NoteTypeEditor'
import ModuleLibrary from './modules/customization/ModuleLibrary'
import TagExplorer from './modules/customization/TagExplorer'
import ShortcutEditor from './modules/customization/ShortcutEditor'
import ViewTemplates from './modules/customization/ViewTemplates'

// Collaboration
import TeamSpaces from './modules/collaboration/TeamSpaces'
import MultiplayerBoards from './modules/collaboration/MultiplayerBoards'
import SharedGoals from './modules/collaboration/SharedGoals'
import SharedKnowledge from './modules/collaboration/SharedKnowledge'
import Comments from './modules/collaboration/Comments'
import ActivityFeed from './modules/collaboration/ActivityFeed'
import Permissions from './modules/collaboration/Permissions'

// Settings
import Settings from './modules/settings/Settings'

// Extensions
import InstalledApps from './modules/extensions/InstalledApps'
import ImportExport from './modules/extensions/ImportExport'
import Automations from './modules/extensions/Automations'
import DevAPI from './modules/extensions/DevAPI'
import Labs from './modules/extensions/Labs'
import SessionBackup from './modules/extensions/SessionBackup'
import Marketplace from './modules/extensions/Marketplace'

const MODULES: Record<string, React.ComponentType<any>> = {
  // pillar homes
  'corespace-home': () => <PillarHome pillarId='corespace' />,
  'knowledge-home': () => <PillarHome pillarId='knowledge' />,
  'productivity-home': () => <PillarHome pillarId='productivity' />,
  'insights-home': () => <PillarHome pillarId='insights' />,
  'customization-home': () => <PillarHome pillarId='customization' />,
  'collaboration-home': () => <PillarHome pillarId='collaboration' />,
  'extensions-home': () => <PillarHome pillarId='extensions' />,
  // corespace
  dashboard: Dashboard,
  pinned: Pinned,
  notifications: Notifications,
  quickcapture: QuickCapture,
  focuslauncher: FocusLauncher,
  momentum: Momentum,
  inbox: Inbox,
  // knowledge
  notes: Notes,
  topiclibrary: TopicLibrary,
  studysheets: StudySheets,
  refvault: RefVault,
  conceptmap: ConceptMap,
  accelerators: Accelerators,
  knowledgeinsights: KnowledgeInsights,
  // productivity
  tasks: Tasks,
  calendar: Calendar,
  projects: ProjectBoards,
  focus: FocusSessions,
  habits: Habits,
  goals: Goals,
  journal: JournalEditor,
  journalentries: JournalEntries,
  journaltemplates: JournalTemplates,
  moodtracker: MoodTracker,
  journalprompts: JournalPrompts,
  journalstreaks: JournalStreaks,
  // insights
  prodscore: ProdScore,
  heatmap: FocusHeatmap,
  knowledgegrowth: KnowledgeGrowth,
  habittrends: HabitTrends,
  graphbuilder: GraphBuilder,
  sessionlog: SessionLog,
  weeklysnapshot: WeeklySnapshot,
  // customization
  layoutstudio: LayoutStudio,
  themebuilder: ThemeBuilder,
  notetypeeditor: NoteTypeEditor,
  modulelibrary: ModuleLibrary,
  tagexplorer: TagExplorer,
  shortcuts: ShortcutEditor,
  viewtemplates: ViewTemplates,
  // collaboration
  teamspaces: TeamSpaces,
  multiboards: MultiplayerBoards,
  sharedgoals: SharedGoals,
  sharedknowledge: SharedKnowledge,
  comments: Comments,
  activityfeed: ActivityFeed,
  permissions: Permissions,
  // settings
  settings: Settings,
  // extensions
  installedapps: InstalledApps,
  importexport: ImportExport,
  automations: Automations,
  devapi: DevAPI,
  labs: Labs,
  sessionbackup: SessionBackup,
  marketplace: Marketplace,
}

const FULLSCREEN_MODULES = new Set(['calendar'])

export const MainContent: React.FC = () => {
  const { currentPage, setCurrentPage } = useUIStore()

  const Component = MODULES[currentPage]
  const isFull = FULLSCREEN_MODULES.has(currentPage)

  if (!Component) return (
    <main className={styles.main}>
      <div style={{ color: 'oklch(0.62 0 0)', fontSize: '13px' }}>Module not found: {currentPage}</div>
    </main>
  )

  return (
    <main className={isFull ? styles.mainFull : styles.main}>
      <Component onNavigate={setCurrentPage} />
    </main>
  )
}

export default MainContent
