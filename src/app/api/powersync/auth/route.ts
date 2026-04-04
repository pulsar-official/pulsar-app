import { getOrgAndUser } from '@/lib/auth-helpers'
import { SignJWT, importPKCS8 } from 'jose'

export async function GET() {
  const { orgId, userId } = await getOrgAndUser()
  if (!orgId || !userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.POWERSYNC_PRIVATE_KEY) {
    return Response.json({ error: 'PowerSync not configured' }, { status: 503 })
  }
  const rawKey = process.env.POWERSYNC_PRIVATE_KEY.replace(/\\n/g, '\n')
  const privateKey = await importPKCS8(rawKey, 'RS256')

  const token = await new SignJWT({ sub: userId, user_id: userId, org_id: orgId })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(privateKey)

  return Response.json({
    token,
    powersync_url: process.env.NEXT_PUBLIC_POWERSYNC_URL,
    expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
  })
}
