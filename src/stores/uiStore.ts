import { create } from 'zustand'

interface UIState {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  currentPage: string
  setCurrentPage: (page: string) => void
  mobileMenuOpen: boolean
  toggleMobileMenu: () => void
  closeMobileMenu: () => void
  /** Optional extra breadcrumb segment pushed by detail views (e.g. board name, note title) */
  subBreadcrumb: string | null
  setSubBreadcrumb: (label: string | null) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  currentPage: 'dashboard',
  // Clear sub-breadcrumb whenever navigating to a new top-level page
  setCurrentPage: (page) => set({ currentPage: page, mobileMenuOpen: false, subBreadcrumb: null }),
  mobileMenuOpen: false,
  toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
  closeMobileMenu: () => set({ mobileMenuOpen: false }),
  subBreadcrumb: null,
  setSubBreadcrumb: (label) => set({ subBreadcrumb: label }),
}))
