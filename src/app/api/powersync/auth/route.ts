import { auth } from '@clerk/nextjs/server'
import * as jose from 'jose'

const POWERSYNC_URL = process.env.NEXT_PUBLIC_POWERSYNC_URL!
const KEY_ID = process.env.POWERSYNC_KEY_ID ?? 'pulsar-key-1'

// Cache the imported key per cold start (jose v6 uses CryptoKey, not KeyLike)
let privateKey: CryptoKey | null = null

async function getPrivateKey(): Promise<CryptoKey> {
  if (privateKey) return privateKey
  const pem = process.env.POWERSYNC_PRIVATE_KEY!.replace(/\\n/g, '\n')
  privateKey = await jose.importPKCS8(pem, 'ES256')
  return privateKey
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const key = await getPrivateKey()

  const token = await new jose.SignJWT({
    sub: userId,       // maps to auth.user_id() in PowerSync sync rules
    aud: 'pulsar-app', // must match the audience in PowerSync console
  })
    .setProtectedHeader({ alg: 'ES256', kid: KEY_ID })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(key)

  return Response.json({
    endpoint: POWERSYNC_URL,
    token,
  })
}
