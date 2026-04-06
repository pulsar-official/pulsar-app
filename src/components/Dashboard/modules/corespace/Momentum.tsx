'use client'

import React from 'react'
import { WidgetContainer } from '@/components/Dashboard/Corespace'
import { useUserTier } from '@/hooks/useUserTier'
import { ModulePlaceholder } from '../shared/ModulePlaceholder'

const Momentum: React.FC = () => {
  const { tier } = useUserTier()
  return (
    <WidgetContainer id="momentum" title="Momentum" tier="atom" userTier={tier} defaultW={6} defaultH={4}>
      <ModulePlaceholder title="Momentum" emoji="📈" hue={260} />
    </WidgetContainer>
  )
}

export default Momentum
