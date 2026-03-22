import type { IconName } from '@/types'

export interface PillarItem {
  icon: IconName
  name: string
  page: string
  badge?: string
}

export interface Section {
  title: string
  items: PillarItem[]
}

export interface Pillar {
  id: string
  label: string
  icon: IconName
  color: number
  sections: Section[]
}

export const PILLARS: Pillar[] = [
  {
    id: 'corespace',
    label: 'Corespace',
    icon: 'grid',
    color: 260,
    sections: [
      {
        title: 'Your Space',
        items: [
          { icon: 'grid', name: 'Dashboard', page: 'dashboard' },
          { icon: 'pin', name: 'Pinned', page: 'pinned', badge: '4' },
          { icon: 'bell', name: 'Notifications', page: 'notifications', badge: '12' },
          { icon: 'zap', name: 'Quick Capture', page: 'quickcapture' },
        ]
      },
      {
        title: 'Recent',
        items: [
          { icon: 'timer', name: 'Focus Launcher', page: 'focuslauncher' },
          { icon: 'trend', name: 'Momentum', page: 'momentum' },
          { icon: 'note', name: 'Inbox', page: 'inbox', badge: '6' },
        ]
      }
    ]
  },
  {
    id: 'knowledge',
    label: 'Knowledge',
    icon: 'book',
    color: 150,
    sections: [
      {
        title: 'Create',
        items: [
          { icon: 'note', name: 'Notes', page: 'notes' },
          { icon: 'book', name: 'Topic Library', page: 'topiclibrary' },
          { icon: 'card', name: 'Study Sheets', page: 'studysheets' },
          { icon: 'stack', name: 'Reference Vault', page: 'refvault' },
        ]
      },
      {
        title: 'Explore',
        items: [
          { icon: 'graph', name: 'Concept Map', page: 'conceptmap' },
          { icon: 'zap', name: 'Accelerators', page: 'accelerators' },
          { icon: 'bar', name: 'Insight Dashboard', page: 'knowledgeinsights' },
        ]
      }
    ]
  },
  {
    id: 'productivity',
    label: 'Productivity',
    icon: 'check',
    color: 60,
    sections: [
      {
        title: 'Do',
        items: [
          { icon: 'check', name: 'Tasks', page: 'tasks', badge: '7' },
          { icon: 'cal', name: 'Calendar', page: 'calendar' },
          { icon: 'clip', name: 'Project Boards', page: 'projects', badge: '3' },
          { icon: 'timer', name: 'Focus Sessions', page: 'focus' },
        ]
      },
      {
        title: 'Track',
        items: [
          { icon: 'repeat', name: 'Habits', page: 'habits' },
          { icon: 'target', name: 'Goals', page: 'goals', badge: '2' },
        ]
      },
      {
        title: 'Journal',
        items: [
          { icon: 'note', name: 'Journal', page: 'journal' },
          { icon: 'stack', name: 'Past Entries', page: 'journalentries' },
          { icon: 'card', name: 'Templates', page: 'journaltemplates' },
          { icon: 'trend', name: 'Mood Tracker', page: 'moodtracker' },
          { icon: 'zap', name: 'Prompts', page: 'journalprompts' },
          { icon: 'heat', name: 'Streaks', page: 'journalstreaks' },
        ]
      }
    ]
  },
  {
    id: 'insights',
    label: 'Insights',
    icon: 'graph',
    color: 200,
    sections: [
      {
        title: 'Metrics',
        items: [
          { icon: 'bar', name: 'Productivity Score', page: 'prodscore' },
          { icon: 'heat', name: 'Focus Heatmap', page: 'heatmap' },
          { icon: 'graph', name: 'Knowledge Growth', page: 'knowledgegrowth' },
          { icon: 'trend', name: 'Habit & Goal Trends', page: 'habittrends' },
        ]
      },
      {
        title: 'Reports',
        items: [
          { icon: 'sliders', name: 'Custom Graph Builder', page: 'graphbuilder' },
          { icon: 'timer', name: 'Session Log', page: 'sessionlog' },
          { icon: 'report', name: 'Weekly Snapshot', page: 'weeklysnapshot', badge: 'New' },
        ]
      }
    ]
  },
  {
    id: 'customization',
    label: 'Customization',
    icon: 'palette',
    color: 290,
    sections: [
      {
        title: 'Build',
        items: [
          { icon: 'layout', name: 'Layout Studio', page: 'layoutstudio' },
          { icon: 'palette', name: 'Theme Builder', page: 'themebuilder' },
          { icon: 'note', name: 'Note Type Editor', page: 'notetypeeditor' },
          { icon: 'stack', name: 'Module Library', page: 'modulelibrary' },
        ]
      },
      {
        title: 'Configure',
        items: [
          { icon: 'graph', name: 'Tag Explorer', page: 'tagexplorer' },
          { icon: 'kbd', name: 'Shortcut Editor', page: 'shortcuts' },
          { icon: 'layout', name: 'View Templates', page: 'viewtemplates' },
        ]
      }
    ]
  },
  {
    id: 'collaboration',
    label: 'Collaboration',
    icon: 'users',
    color: 330,
    sections: [
      {
        title: 'Together',
        items: [
          { icon: 'users', name: 'Team Spaces', page: 'teamspaces', badge: '2' },
          { icon: 'clip', name: 'Multiplayer Boards', page: 'multiboards' },
          { icon: 'target', name: 'Shared Goals', page: 'sharedgoals' },
          { icon: 'stack', name: 'Shared Knowledge', page: 'sharedknowledge' },
        ]
      },
      {
        title: 'Communicate',
        items: [
          { icon: 'chat', name: 'Comments & Threads', page: 'comments', badge: '5' },
          { icon: 'trend', name: 'Activity Feed', page: 'activityfeed' },
          { icon: 'lock', name: 'Permission Layers', page: 'permissions' },
        ]
      }
    ]
  },
  {
    id: 'extensions',
    label: 'Extensions',
    icon: 'plug',
    color: 20,
    sections: [
      {
        title: 'Connect',
        items: [
          { icon: 'plug', name: 'Installed Apps', page: 'installedapps' },
          { icon: 'folder', name: 'Import / Export', page: 'importexport' },
          { icon: 'zap', name: 'Automations', page: 'automations' },
          { icon: 'code', name: 'Developer API', page: 'devapi' },
        ]
      },
      {
        title: 'Explore',
        items: [
          { icon: 'beaker', name: 'Labs', page: 'labs', badge: '3' },
          { icon: 'stack', name: 'Session Backup', page: 'sessionbackup' },
        ]
      }
    ]
  },
]

export const BOTTOM_NAV = [
  { id: 'marketplace', label: 'Marketplace', icon: 'store' as IconName }
]

export const BOTTOM_NAV_RIGHT = [
  { id: 'notifications-nav', label: 'Notifications', icon: 'bell' as IconName },
  { id: 'feedback', label: 'Feedback', icon: 'chat' as IconName },
  { id: 'settings', label: 'Settings', icon: 'settings' as IconName }
]