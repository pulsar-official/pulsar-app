import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  currentPage: string
  setCurrentPage: (page: string) => void
  currentPillarIndex: number
  setCurrentPillarIndex: (index: number) => void
  mobileMenuOpen: boolean
  toggleMobileMenu: () => void
  closeMobileMenu: () => void
  /** Optional extra breadcrumb segment pushed by detail views (e.g. board name, note title) */
  subBreadcrumb: string | null
  setSubBreadcrumb: (label: string | null) => void
  /** Tracks the last visited page per org for "continue where you left off" */
  lastVisited: Record<string, string>
  setLastVisited: (orgId: string, page: string) => void
  /** Focus Mode Overlay — dims UI, shows top task + Pomodoro timer */
  focusModeActive: boolean
  toggleFocusMode: () => void
  /** Blob mode for animated background effects */
  blobModeEnabled: boolean
  toggleBlobMode: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      currentPage: 'dashboard',
      // Clear sub-breadcrumb whenever navigating to a new top-level page
      setCurrentPage: (page) => set({ currentPage: page, mobileMenuOpen: false, subBreadcrumb: null }),
      currentPillarIndex: 0,
      setCurrentPillarIndex: (index) => set({ currentPillarIndex: index }),
      mobileMenuOpen: false,
      toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
      closeMobileMenu: () => set({ mobileMenuOpen: false }),
      subBreadcrumb: null,
      setSubBreadcrumb: (label) => set({ subBreadcrumb: label }),
      lastVisited: {},
      setLastVisited: (orgId, page) => set((state) => ({
        lastVisited: { ...state.lastVisited, [orgId]: page },
      })),
      focusModeActive: false,
      toggleFocusMode: () => set((state) => ({ focusModeActive: !state.focusModeActive })),
      blobModeEnabled: false,
      toggleBlobMode: () => set((state) => ({ blobModeEnabled: !state.blobModeEnabled })),
    }),
    {
      name: 'pulsar-ui-state',
      partialize: (state) => ({
        currentPage: state.currentPage,
        currentPillarIndex: state.currentPillarIndex,
        sidebarCollapsed: state.sidebarCollapsed,
        subBreadcrumb: state.subBreadcrumb,
        lastVisited: state.lastVisited,
        focusModeActive: state.focusModeActive,
        blobModeEnabled: state.blobModeEnabled,
        // Explicitly exclude: mobileMenuOpen (should close on reload)
      }),
    }
  )
)
