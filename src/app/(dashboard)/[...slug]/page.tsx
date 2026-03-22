'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUIStore } from '@/stores/uiStore'
import { urlToPage, pageExists } from '@/lib/routing'
import MainContent from '@/components/Dashboard/MainContent'

interface PageProps {
  params: {
    slug: string[]
  }
}

export default function DynamicModulePage({ params }: PageProps) {
  const router = useRouter()
  const { setCurrentPage } = useUIStore()

  const page = urlToPage(params.slug)

  useEffect(() => {
    // Validate page exists
    if (!pageExists(page)) {
      // Redirect to dashboard if page is invalid
      router.push('/dashboard')
      return
    }

    // Update UIStore with the current page
    setCurrentPage(page)
  }, [page, router, setCurrentPage])

  return <MainContent />
}
