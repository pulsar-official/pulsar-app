import { exportJWK } from 'jose'
import { createPublicKey, createPrivateKey } from 'crypto'

function algForKey(keyObject: ReturnType<typeof createPublicKey>): string {
  const t = keyObject.asymmetricKeyType
  if (t === 'rsa') return 'RS256'
  if (t === 'ec') {
    const curve = (keyObject.asymmetricKeyDetails as { namedCurve?: string } | undefined)?.namedCurve
    if (curve === 'secp384r1') return 'ES384'
    if (curve === 'secp521r1') return 'ES512'
    return 'ES256'
  }
  if (t === 'ed25519' || t === 'ed448') return 'EdDSA'
  throw new Error(`Unsupported key type: ${t}`)
}

export async function GET() {
  const rawPublic = process.env.POWERSYNC_PUBLIC_KEY
  const rawPrivate = process.env.POWERSYNC_PRIVATE_KEY

  if (!rawPublic && !rawPrivate) {
    return Response.json({ error: 'PowerSync not configured' }, { status: 503 })
  }

  try {
    let publicKey: ReturnType<typeof createPublicKey>

    if (rawPublic) {
      // Use explicitly provided public key
      publicKey = createPublicKey({ key: rawPublic.replace(/\\n/g, '\n'), format: 'pem' })
    } else {
      // Derive public key from private key — no separate env var needed
      const privateKey = createPrivateKey({ key: rawPrivate!.replace(/\\n/g, '\n'), format: 'pem' })
      publicKey = createPublicKey(privateKey)
    }

    const alg = algForKey(publicKey)
    const jwk = await exportJWK(publicKey)

    return Response.json(
      { keys: [{ ...jwk, use: 'sig', alg, kid: 'powersync-1' }] },
      { headers: { 'Cache-Control': 'public, max-age=3600' } }
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[powersync/jwks] error:', msg)
    return Response.json({ error: 'Failed to export JWKS', detail: msg }, { status: 500 })
  }
}
