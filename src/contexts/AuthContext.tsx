'use client'
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import type { User, Session } from '@supabase/supabase-js'

interface MappedUser {
  id: string
  email: string
  fullName: string
  firstName: string
  imageUrl: string
  appMetadata: Record<string, unknown>
  userMetadata: Record<string, unknown>
}

export interface OrgMembership {
  id: string
  name: string
  role: string
}

interface AuthContextValue {
  user: MappedUser | null
  userId: string | null
  isLoaded: boolean
  session: Session | null
  activeOrg: { id: string; name: string } | null
  memberships: OrgMembership[]
  signOut: () => Promise<void>
  setActiveOrg: (orgId: string) => Promise<void>
  createOrganization: (name: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function mapUser(user: User): MappedUser {
  const meta = user.user_metadata ?? {}
  return {
    id: user.id,
    email: user.email ?? '',
    fullName: (meta.full_name as string) ?? ((meta.first_name as string) ? `${meta.first_name} ${meta.last_name ?? ''}`.trim() : (user.email ?? '')),
    firstName: (meta.first_name as string) ?? (user.email ?? '').split('@')[0],
    imageUrl: (meta.avatar_url as string) ?? '',
    appMetadata: user.app_metadata ?? {},
    userMetadata: meta,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createSupabaseBrowserClient()
  const router = useRouter()

  const [user, setUser] = useState<MappedUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [memberships, setMemberships] = useState<OrgMembership[]>([])
  const [activeOrg, setActiveOrgState] = useState<{ id: string; name: string } | null>(null)

  const fetchMemberships = useCallback(async () => {
    const res = await fetch('/api/organizations')
    if (!res.ok) return []
    return (await res.json()) as OrgMembership[]
  }, [])

  const initFromSession = useCallback(async (sess: Session | null) => {
    if (!sess?.user) {
      setUser(null)
      setSession(null)
      setMemberships([])
      setActiveOrgState(null)
      setIsLoaded(true)
      return
    }
    setSession(sess)
    setUser(mapUser(sess.user))

    const orgs = await fetchMemberships()
    setMemberships(orgs)

    const activeId = sess.user.app_metadata?.active_org_id as string | undefined
    const org = orgs.find(o => o.id === activeId) ?? orgs[0] ?? null
    setActiveOrgState(org ? { id: org.id, name: org.name } : null)
    setIsLoaded(true)
  }, [fetchMemberships])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      initFromSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      initFromSession(session)
    })

    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    router.push('/')
  }, [supabase, router])

  const setActiveOrg = useCallback(async (orgId: string) => {
    await fetch('/api/auth/set-active-org', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orgId }),
    })
    const { data: { session } } = await supabase.auth.refreshSession()
    if (session) {
      setSession(session)
      setUser(mapUser(session.user))
      const org = memberships.find(o => o.id === orgId)
      if (org) setActiveOrgState({ id: org.id, name: org.name })
    }
  }, [supabase, memberships])

  const createOrganization = useCallback(async (name: string) => {
    const res = await fetch('/api/organizations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    if (!res.ok) return
    const org = await res.json() as OrgMembership
    setMemberships(prev => [...prev, org])
    await setActiveOrg(org.id)
  }, [setActiveOrg])

  return (
    <AuthContext.Provider value={{
      user, userId: user?.id ?? null, isLoaded, session,
      activeOrg, memberships, signOut, setActiveOrg, createOrganization,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used inside AuthProvider')
  return ctx
}
