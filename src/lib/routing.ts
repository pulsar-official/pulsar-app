import { PILLARS } from '@/constants/pillars'

/**
 * Builds a reverse lookup map from page name → { pillarId, pillarLabel }
 * This allows quick resolution of which pillar contains a given page
 * Cached for performance to avoid rebuilding on every call
 */
let pageMapCache: Record<string, { pillarId: string; pillarLabel: string }> | null = null

function getPageMap(): Record<string, { pillarId: string; pillarLabel: string }> {
  if (pageMapCache) {
    return pageMapCache
  }

  const map: Record<string, { pillarId: string; pillarLabel: string }> = {}

  PILLARS.forEach((pillar) => {
    pillar.sections.forEach((section) => {
      section.items.forEach((item) => {
        map[item.page] = {
          pillarId: pillar.id,
          pillarLabel: pillar.label,
        }
      })
    })
  })

  pageMapCache = map
  return map
}

/**
 * Converts a page name to a URL path
 * @param page - The page name (e.g., 'tasks', 'calendar', 'focus')
 * @returns The URL path (e.g., '/dashboard/productivity/tasks')
 */
export function pageToUrl(page: string): string {
  const pageMap = getPageMap()
  const pageInfo = pageMap[page]

  if (!pageInfo) {
    // Fallback to dashboard if page not found
    return '/dashboard/corespace/dashboard'
  }

  return `/dashboard/${pageInfo.pillarId}/${page}`
}

/**
 * Converts URL segments to a page name
 * @param segments - Array of URL segments (e.g., ['productivity', 'tasks'])
 * @returns The page name (e.g., 'tasks'), or 'dashboard' if invalid
 */
export function urlToPage(segments: string[]): string {
  if (!segments || segments.length === 0) {
    return 'dashboard'
  }

  // Expected format: [pillarId, pageName, ...rest]
  if (segments.length < 2) {
    return 'dashboard'
  }

  const [pillarId, pageName] = segments

  // Validate that pillar exists
  const pillarExists = PILLARS.some((p) => p.id === pillarId)
  if (!pillarExists) {
    return 'dashboard'
  }

  // Validate that page exists in that pillar
  const pageExists = PILLARS.some(
    (p) =>
      p.id === pillarId &&
      p.sections.some((s) => s.items.some((i) => i.page === pageName))
  )

  if (pageExists) {
    return pageName
  }

  return 'dashboard'
}

/**
 * Checks if a page exists in the navigation structure
 * @param page - The page name to check
 * @returns true if the page exists, false otherwise
 */
export function pageExists(page: string): boolean {
  return PILLARS.some((pillar) =>
    pillar.sections.some((section) =>
      section.items.some((item) => item.page === page)
    )
  )
}
