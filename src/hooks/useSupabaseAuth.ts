'use client'
import { useAuthContext } from '@/contexts/AuthContext'

export function useAuth() {
  const { userId, isLoaded, activeOrg } = useAuthContext()
  return { userId, isLoaded, orgId: activeOrg?.id ?? null }
}

export function useUser() {
  const { user } = useAuthContext()
  return { user }
}

export function useSignOut() {
  const { signOut } = useAuthContext()
  return signOut
}

export function useOrganization() {
  const { activeOrg } = useAuthContext()
  return { organization: activeOrg }
}

export function useOrganizationList() {
  const { memberships, isLoaded, setActiveOrg, createOrganization, deleteOrganization, renameOrganization } = useAuthContext()
  return {
    memberships,
    isLoaded,
    setActive: ({ organization }: { organization: string }) => setActiveOrg(organization),
    createOrganization,
    deleteOrganization,
    renameOrganization,
  }
}
