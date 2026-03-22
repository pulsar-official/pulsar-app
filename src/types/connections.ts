export type ConnectionItemType = 'task' | 'goal' | 'habit' | 'journal' | 'event'

export interface ConnectionItem {
  id: number
  type: ConnectionItemType
  title: string
}

export interface Connection {
  source: ConnectionItem
  target: ConnectionItem
  strength: number
  reasons: string[]
}
