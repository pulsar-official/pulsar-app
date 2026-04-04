import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { db } from '@/lib/db'
import { organizations, organizationMembers } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

const getAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { name } = await request.json()
  if (!name?.trim()) return NextResponse.json({ error: 'name required' }, { status: 400 })

  // Verify user is a member of this org
  const [membership] = await db.select().from(organizationMembers)
    .where(and(eq(organizationMembers.orgId, id), eq(organizationMembers.userId, user.id)))
  if (!membership) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [updated] = await db.update(organizations)
    .set({ name: name.trim() })
    .where(eq(organizations.id, id))
    .returning()

  return NextResponse.json({ id: updated.id, name: updated.name })
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  // Verify user is a member
  const [membership] = await db.select().from(organizationMembers)
    .where(and(eq(organizationMembers.orgId, id), eq(organizationMembers.userId, user.id)))
  if (!membership) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Don't allow deleting last workspace
  const allMemberships = await db.select().from(organizationMembers)
    .where(eq(organizationMembers.userId, user.id))
  if (allMemberships.length <= 1) {
    return NextResponse.json({ error: 'Cannot delete your only workspace' }, { status: 400 })
  }

  // If deleting the active org, switch to another
  const activeOrgId = user.app_metadata?.active_org_id as string | undefined
  if (activeOrgId === id) {
    const next = allMemberships.find(m => m.orgId !== id)
    if (next) {
      await getAdmin().auth.admin.updateUserById(user.id, {
        app_metadata: { ...user.app_metadata, active_org_id: next.orgId },
      })
    }
  }

  // Delete the org (cascades to organizationMembers via FK)
  await db.delete(organizations).where(eq(organizations.id, id))

  return new NextResponse(null, { status: 204 })
}
