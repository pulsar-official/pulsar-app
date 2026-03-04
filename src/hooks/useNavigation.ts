import { useState } from 'react'
import { PILLARS } from '@/constants/pillars'

export const useNavigation = () => {
  const [currentPillarIndex, setCurrentPillarIndex] = useState(6)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [breadcrumbs, setBreadcrumbs] = useState([{ label: 'Dashboard' }])

  const handleNavigate = (page: string, pillarIndex: number) => {
    setCurrentPillarIndex(pillarIndex)
    const pillar = PILLARS[pillarIndex]
    let pageLabel = page

    for (const section of pillar.sections) {
      const item = section.items.find(i => i.page === page)
      if (item) {
        pageLabel = item.name
        break
      }
    }

    setBreadcrumbs([
      { label: pillar.label },
      { label: pageLabel }
    ])
  }

  return {
    currentPillarIndex,
    setCurrentPillarIndex,
    dropdownOpen,
    setDropdownOpen,
    breadcrumbs,
    setBreadcrumbs,
    handleNavigate
  }
}