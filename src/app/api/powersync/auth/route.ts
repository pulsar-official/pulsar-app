import { getOrgAndUser } from '@/lib/auth-helpers'
import { SignJWT } from 'jose'
import { createPrivateKey } from 'crypto'

export async function GET() {
  const { orgId, userId } = await getOrgAndUser()
  if (!orgId || !userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.POWERSYNC_PRIVATE_KEY) {
    return Response.json({ error: 'PowerSync not configured' }, { status: 503 })
  }

  try {
    // Normalise literal \n sequences (common when pasting PEM into env var UIs)
    const rawKey = process.env.POWERSYNC_PRIVATE_KEY.replace(/\\n/g, '\n')

    // createPrivateKey handles both PKCS#8 (BEGIN PRIVATE KEY) and
    // PKCS#1 (BEGIN RSA PRIVATE KEY) PEM formats, unlike jose importPKCS8
    const privateKey = createPrivateKey({ key: rawKey, format: 'pem' })

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
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[powersync/auth] key error:', msg)
    return Response.json({ error: 'Failed to sign token', detail: msg }, { status: 500 })
  }
}
