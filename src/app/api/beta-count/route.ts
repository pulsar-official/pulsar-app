import { NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'

export const dynamic = 'force-dynamic'

const BETA_TOTAL = 100

export async function GET() {
  try {
    const client = await clerkClient()
    const count = await client.users.getCount()
    return NextResponse.json({
      count,
      total: BETA_TOTAL,
      remaining: Math.max(0, BETA_TOTAL - count),
      filled: Math.min(count, BETA_TOTAL),
    })
  } catch {
    // Fallback if Clerk key not set (local dev without env vars)
    return NextResponse.json({ count: 77, total: 100, remaining: 23, filled: 77 })
  }
}
