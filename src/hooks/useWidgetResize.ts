'use client'

import { useCallback, useRef, useState } from 'react'
import { useCorespaceStore } from '@/stores/corespaceStore'

interface UseWidgetResizeOptions {
  widgetId: string
  minW?: number
  minH?: number
  maxW?: number
  maxH?: number
  gridCellSize?: number
}

interface ResizeHandleProps {
  onMouseDown: (e: React.MouseEvent) => void
  style: React.CSSProperties
}

interface UseWidgetResizeReturn {
  resizeHandleProps: ResizeHandleProps
  isResizing: boolean
}

export function useWidgetResize({
  widgetId,
  minW = 2,
  minH = 2,
  maxW = 12,
  maxH = 10,
  gridCellSize = 80,
}: UseWidgetResizeOptions): UseWidgetResizeReturn {
  const updateLayout = useCorespaceStore((state) => state.updateLayout)
  const widgets = useCorespaceStore((state) => state.widgets)
  const [isResizing, setIsResizing] = useState(false)

  const startPos = useRef<{ x: number; y: number } | null>(null)
  const startSize = useRef<{ w: number; h: number } | null>(null)

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const widget = widgets[widgetId]
      if (!widget) return

      startPos.current = { x: e.clientX, y: e.clientY }
      startSize.current = { w: widget.w, h: widget.h }
      setIsResizing(true)

      const onMouseMove = (moveEvent: MouseEvent) => {
        if (!startPos.current || !startSize.current) return

        const dx = moveEvent.clientX - startPos.current.x
        const dy = moveEvent.clientY - startPos.current.y

        const deltaW = Math.round(dx / gridCellSize)
        const deltaH = Math.round(dy / gridCellSize)

        const newW = Math.min(maxW, Math.max(minW, startSize.current.w + deltaW))
        const newH = Math.min(maxH, Math.max(minH, startSize.current.h + deltaH))

        updateLayout(widgetId, { w: newW, h: newH })
      }

      const onMouseUp = () => {
        setIsResizing(false)
        startPos.current = null
        startSize.current = null
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('mouseup', onMouseUp)
      }

      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
    },
    [widgetId, widgets, updateLayout, gridCellSize, minW, minH, maxW, maxH]
  )

  const resizeHandleProps: ResizeHandleProps = {
    onMouseDown,
    style: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 16,
      height: 16,
      cursor: 'se-resize',
    },
  }

  return { resizeHandleProps, isResizing }
}
