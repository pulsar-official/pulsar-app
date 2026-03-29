import { exportJWK, importSPKI } from 'jose'

export async function GET() {
  if (!process.env.POWERSYNC_PUBLIC_KEY) {
    return Response.json({ error: 'PowerSync not configured' }, { status: 503 })
  }
  const publicKey = await importSPKI(process.env.POWERSYNC_PUBLIC_KEY, 'RS256')
  const jwk = await exportJWK(publicKey)
  return Response.json(
    { keys: [{ ...jwk, use: 'sig', alg: 'RS256', kid: 'powersync-1' }] },
    { headers: { 'Cache-Control': 'public, max-age=3600' } }
  )
}
