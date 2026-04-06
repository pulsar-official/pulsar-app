import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WidgetLayout {
  id: string
  x: number      // grid column start (1-based)
  y: number      // grid row start (1-based)
  w: number      // grid column span
  h: number      // grid row span
  collapsed: boolean
  visible: boolean
}

interface CorespaceState {
  widgets: Record<string, WidgetLayout>
  activeSessionWidgetId: string | null

  // Actions
  updateLayout: (id: string, layout: Partial<WidgetLayout>) => void
  addWidget: (id: string, defaults: Omit<WidgetLayout, 'id'>) => void
  removeWidget: (id: string) => void
  toggleCollapse: (id: string) => void
  toggleVisible: (id: string) => void
  setActiveSession: (widgetId: string | null) => void
  resetLayout: () => void
}

export const useCorespaceStore = create<CorespaceState>()(
  persist(
    (set) => ({
      widgets: {},
      activeSessionWidgetId: null,

      updateLayout: (id, layout) =>
        set((state) => ({
          widgets: {
            ...state.widgets,
            ...(state.widgets[id]
              ? { [id]: { ...state.widgets[id], ...layout } }
              : {}),
          },
        })),

      addWidget: (id, defaults) =>
        set((state) => ({
          widgets: {
            ...state.widgets,
            [id]: { id, ...defaults },
          },
        })),

      removeWidget: (id) =>
        set((state) => {
          const next = { ...state.widgets }
          delete next[id]
          return { widgets: next }
        }),

      toggleCollapse: (id) =>
        set((state) => ({
          widgets: {
            ...state.widgets,
            ...(state.widgets[id]
              ? { [id]: { ...state.widgets[id], collapsed: !state.widgets[id].collapsed } }
              : {}),
          },
        })),

      toggleVisible: (id) =>
        set((state) => ({
          widgets: {
            ...state.widgets,
            ...(state.widgets[id]
              ? { [id]: { ...state.widgets[id], visible: !state.widgets[id].visible } }
              : {}),
          },
        })),

      setActiveSession: (widgetId) => set({ activeSessionWidgetId: widgetId }),

      resetLayout: () => set({ widgets: {}, activeSessionWidgetId: null }),
    }),
    {
      name: 'pulsar-corespace',
      partialize: (state) => ({
        widgets: state.widgets,
        activeSessionWidgetId: state.activeSessionWidgetId,
      }),
    }
  )
)
