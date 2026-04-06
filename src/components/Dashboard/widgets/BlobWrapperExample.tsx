'use client'

/**
 * Example usage of BlobWrapper component
 * This file demonstrates how to integrate blob styling into widgets
 */

import React, { useState } from 'react'
import { BlobWrapper } from './BlobWrapper'

export function BlobWrapperExample() {
  const [enableBlob, setEnableBlob] = useState(false)
  const [blobColor, setBlobColor] = useState('oklch(0.55 0.18 290)') // Purple
  const [intensity, setIntensity] = useState<'low' | 'med' | 'high'>('med')

  return (
    <div style={{ padding: '2rem', gap: '2rem', display: 'flex', flexDirection: 'column' }}>
      {/* Controls */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            checked={enableBlob}
            onChange={(e) => setEnableBlob(e.target.checked)}
          />
          Enable Blob
        </label>

        <select
          value={blobColor}
          onChange={(e) => setBlobColor(e.target.value)}
          disabled={!enableBlob}
          style={{
            padding: '0.5rem',
            borderRadius: '6px',
            border: '1px solid #ccc',
          }}
        >
          <option value="oklch(0.55 0.18 290)">Purple (Goals/Habits/Tasks)</option>
          <option value="oklch(0.62 0.16 80)">Amber (Journal)</option>
          <option value="oklch(0.65 0.14 150)">Green (Done State)</option>
          <option value="oklch(0.65 0.15 20)">Red (Delete/Danger)</option>
          <option value="oklch(0.6 0.15 260)">Blue (Accent)</option>
        </select>

        <select
          value={intensity}
          onChange={(e) => setIntensity(e.target.value as 'low' | 'med' | 'high')}
          disabled={!enableBlob}
          style={{
            padding: '0.5rem',
            borderRadius: '6px',
            border: '1px solid #ccc',
          }}
        >
          <option value="low">Low Intensity</option>
          <option value="med">Medium Intensity</option>
          <option value="high">High Intensity</option>
        </select>
      </div>

      {/* Demo Blob Widget */}
      <div style={{ minHeight: '300px', width: '100%' }}>
        <BlobWrapper
          enableBlob={enableBlob}
          blobColor={blobColor}
          morphSpeed={3000}
          complexity={8}
          intensity={intensity}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              textAlign: 'center',
            }}
          >
            <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem' }}>Blob Widget Demo</h2>
            <p style={{ margin: 0, opacity: 0.7 }}>
              {enableBlob
                ? 'Blob animating... Click controls above to customize'
                : 'Enable blob to see animation'}
            </p>
          </div>
        </BlobWrapper>
      </div>

      {/* Information */}
      <div
        style={{
          padding: '1rem',
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
          borderRadius: '8px',
          fontSize: '0.875rem',
          lineHeight: '1.5',
        }}
      >
        <h3 style={{ margin: '0 0 0.5rem 0' }}>How to use BlobWrapper:</h3>
        <pre
          style={{
            margin: '0.5rem 0 0 0',
            overflow: 'auto',
            padding: '0.75rem',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '4px',
          }}
        >
{`<BlobWrapper
  enableBlob={true}
  blobColor="oklch(0.55 0.18 290)"
  morphSpeed={3000}
  complexity={8}
  intensity="med"
>
  {/* Your widget content here */}
</BlobWrapper>`}
        </pre>
      </div>
    </div>
  )
}

export default BlobWrapperExample
