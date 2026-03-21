import { create } from 'zustand'

interface UIState {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  currentPage: string
  setCurrentPage: (page: string) => void
  mobileMenuOpen: boolean
  toggleMobileMenu: () => void
  closeMobileMenu: () => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  currentPage: 'dashboard',
  setCurrentPage: (page) => set({ currentPage: page, mobileMenuOpen: false }),
  mobileMenuOpen: false,
  toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
  closeMobileMenu: () => set({ mobileMenuOpen: false }),
}))
