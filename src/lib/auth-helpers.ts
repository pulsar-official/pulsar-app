import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function getOrgAndUser() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { orgId: null, userId: null }
  return {
    userId: user.id,
    orgId: (user.app_metadata?.active_org_id as string | undefined) ?? null,
  }
}
