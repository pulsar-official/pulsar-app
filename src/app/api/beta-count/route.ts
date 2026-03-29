import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/db/schema'
import { sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

const BETA_TOTAL = 100

export async function GET() {
  try {
    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(users)
    const filled = Math.min(Number(count), BETA_TOTAL)
    const remaining = Math.max(0, BETA_TOTAL - filled)
    return NextResponse.json({ count: filled, total: BETA_TOTAL, remaining, filled })
  } catch (err) {
    console.error('[beta-count]', err)
    return NextResponse.json({ count: 1, total: BETA_TOTAL, remaining: BETA_TOTAL - 1, filled: 1 })
  }
}
