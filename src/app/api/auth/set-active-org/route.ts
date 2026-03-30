import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { db } from '@/lib/db'
import { organizationMembers } from '@/db/schema'
import { and, eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { orgId } = await request.json()
  if (!orgId) return NextResponse.json({ error: 'orgId required' }, { status: 400 })

  // Verify membership
  const [membership] = await db.select().from(organizationMembers)
    .where(and(eq(organizationMembers.orgId, orgId), eq(organizationMembers.userId, user.id)))
  if (!membership) return NextResponse.json({ error: 'Not a member' }, { status: 403 })

  await supabaseAdmin.auth.admin.updateUserById(user.id, {
    app_metadata: { ...user.app_metadata, active_org_id: orgId },
  })

  return NextResponse.json({ ok: true })
}
