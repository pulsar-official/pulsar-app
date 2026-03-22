import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { getChangesSince } from '@/lib/changeTracker'

/**
 * GET /api/productivity/changes
 * Get all changes since a specific timestamp for real-time sync
 */
export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await auth()

    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get since parameter from query
    const sinceParam = request.nextUrl.searchParams.get('since')
    const since = sinceParam ? new Date(sinceParam) : new Date(Date.now() - 60 * 60 * 1000) // Default: last hour

    const changes = await getChangesSince(orgId, userId, since)

    return NextResponse.json({
      changes,
      count: changes.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching changes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch changes' },
      { status: 500 }
    )
  }
}
