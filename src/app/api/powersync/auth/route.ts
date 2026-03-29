import { auth } from '@clerk/nextjs/server'
import { SignJWT, importPKCS8 } from 'jose'

export async function GET() {
  const { orgId, userId } = await auth()
  if (!orgId || !userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.POWERSYNC_PRIVATE_KEY) {
    return Response.json({ error: 'PowerSync not configured' }, { status: 503 })
  }
  const privateKey = await importPKCS8(process.env.POWERSYNC_PRIVATE_KEY, 'RS256')

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
