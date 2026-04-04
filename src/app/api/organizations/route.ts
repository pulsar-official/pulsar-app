import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { db } from '@/lib/db'
import { organizations, organizationMembers } from '@/db/schema'
import { eq, inArray } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

const getAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const memberships = await db.select().from(organizationMembers)
      .where(eq(organizationMembers.userId, user.id))

    if (memberships.length === 0) return NextResponse.json([])

    const orgIds = memberships.map(m => m.orgId)
    const orgs = await db.select().from(organizations).where(inArray(organizations.id, orgIds))

    const result = memberships.map(m => {
      const org = orgs.find(o => o.id === m.orgId)
      return { id: m.orgId, name: org?.name ?? 'Workspace', role: m.role }
    })

    return NextResponse.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const cause = (err as { cause?: unknown })?.cause
    console.error('[GET /api/organizations] error:', msg, 'cause:', cause)
    return NextResponse.json({ error: msg, cause: String(cause) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { name } = await request.json()
    if (!name?.trim()) return NextResponse.json({ error: 'name required' }, { status: 400 })

    const existing = await db.select().from(organizationMembers).where(eq(organizationMembers.userId, user.id))
    if (existing.length >= 3) return NextResponse.json({ error: 'Workspace limit reached (max 3)' }, { status: 400 })

    const [org] = await db.insert(organizations).values({
      name: name.trim(),
      createdBy: user.id,
    }).returning()

    await db.insert(organizationMembers).values({
      orgId: org.id,
      userId: user.id,
      role: 'owner',
    })

    // Set as active org
    await getAdmin().auth.admin.updateUserById(user.id, {
      app_metadata: { ...user.app_metadata, active_org_id: org.id },
    })

    return NextResponse.json({ id: org.id, name: org.name, role: 'owner' }, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const cause = (err as { cause?: unknown })?.cause
    console.error('[POST /api/organizations] error:', msg, 'cause:', cause)
    return NextResponse.json({ error: msg, cause: String(cause) }, { status: 500 })
  }
}
