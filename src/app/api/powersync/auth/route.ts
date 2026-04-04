import { getOrgAndUser } from '@/lib/auth-helpers'
import { SignJWT } from 'jose'
import { createPrivateKey } from 'crypto'

function algForKey(keyObject: ReturnType<typeof createPrivateKey>): string {
  const t = keyObject.asymmetricKeyType
  if (t === 'rsa') return 'RS256'
  if (t === 'ec') {
    const curve = (keyObject.asymmetricKeyDetails as { namedCurve?: string } | undefined)?.namedCurve
    if (curve === 'secp384r1') return 'ES384'
    if (curve === 'secp521r1') return 'ES512'
    return 'ES256' // prime256v1 / P-256
  }
  if (t === 'ed25519') return 'EdDSA'
  if (t === 'ed448') return 'EdDSA'
  throw new Error(`Unsupported key type: ${t}`)
}

export async function GET() {
  const { orgId, userId } = await getOrgAndUser()
  if (!orgId || !userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.POWERSYNC_PRIVATE_KEY) {
    return Response.json({ error: 'PowerSync not configured' }, { status: 503 })
  }

  try {
    // Normalise literal \n sequences (common when pasting PEM into Vercel dashboard)
    const rawKey = process.env.POWERSYNC_PRIVATE_KEY.replace(/\\n/g, '\n')

    // createPrivateKey handles PKCS#8, PKCS#1 RSA, and EC PEM formats
    const privateKey = createPrivateKey({ key: rawKey, format: 'pem' })
    const alg = algForKey(privateKey)

    console.log('[powersync/auth] key type:', privateKey.asymmetricKeyType, 'alg:', alg)

    const token = await new SignJWT({ sub: userId, user_id: userId, org_id: orgId })
      .setProtectedHeader({ alg, kid: 'powersync-1' })
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
