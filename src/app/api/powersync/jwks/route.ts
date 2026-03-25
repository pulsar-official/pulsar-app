import * as jose from 'jose'

const KEY_ID = process.env.POWERSYNC_KEY_ID ?? 'pulsar-key-1'

// Cache per cold start
let jwk: jose.JWK | null = null

async function getPublicJwk(): Promise<jose.JWK> {
  if (jwk) return jwk
  const pem = process.env.POWERSYNC_PRIVATE_KEY!.replace(/\\n/g, '\n')
  const privateKey = await jose.importPKCS8(pem, 'ES256')
  const full = await jose.exportJWK(privateKey)
  // Strip the private 'd' component — serve public portion only
  const { d: _d, ...publicJwk } = full
  jwk = publicJwk
  return jwk
}

export async function GET() {
  const publicJwk = await getPublicJwk()
  return Response.json({
    keys: [
      {
        ...publicJwk,
        kid: KEY_ID,
        alg: 'ES256',
        use: 'sig',
      },
    ],
  })
}
