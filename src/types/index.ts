export type IconName = 
  | 'grid'
  | 'bell'
  | 'folder'
  | 'cal'
  | 'note'
  | 'graph'
  | 'stack'
  | 'card'
  | 'book'
  | 'check'
  | 'clip'
  | 'timer'
  | 'target'
  | 'repeat'
  | 'bar'
  | 'heat'
  | 'trend'
  | 'report'
  | 'sliders'
  | 'palette'
  | 'layout'
  | 'zap'
  | 'users'
  | 'chat'
  | 'lock'
  | 'plug'
  | 'store'
  | 'beaker'
  | 'code'
  | 'pin'
  | 'magic'
  | 'kbd'
  | 'search'
  | 'settings'
  | 'chevronUp'
  | 'chevronDown'

export interface Pillar {
  id: string
  label: string
  icon: IconName
  color: number
  sections: Section[]
}

export interface Section {
  title: string
  items: PillarItem[]
}

export interface PillarItem {
  icon: IconName
  name: string
  page: string
  badge?: string
}