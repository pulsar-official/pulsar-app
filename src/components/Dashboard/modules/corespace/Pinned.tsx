'use client'

import React from 'react'
import { WidgetContainer } from '@/components/Dashboard/Corespace'
import { useUserTier } from '@/hooks/useUserTier'
import { ModulePlaceholder } from '../shared/ModulePlaceholder'

const Pinned: React.FC = () => {
  const { tier } = useUserTier()
  return (
    <WidgetContainer id="pinned" title="Pinned" tier="molecule" userTier={tier} defaultW={4} defaultH={3}>
      <ModulePlaceholder title="Pinned" emoji="📌" hue={260} />
    </WidgetContainer>
  )
}

export default Pinned
