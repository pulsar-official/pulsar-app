import { getOrgAndUser } from '@/lib/auth-helpers'
import { aiRatelimit, checkRatelimit } from '@/lib/ratelimit'

export async function POST(req: Request) {
  const { userId } = await getOrgAndUser()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = await checkRatelimit(aiRatelimit, userId)
  if (limited) return limited

  return new Response('Not implemented', { status: 501 })
}
