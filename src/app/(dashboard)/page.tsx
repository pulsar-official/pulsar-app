'use client'

import React from 'react'

export default function Home() {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ 
          fontSize: '20px', 
          fontWeight: 600, 
          marginBottom: '3px', 
          color: 'oklch(0.95 0 0)',
          letterSpacing: '-0.3px',
          lineHeight: '1.2',
          margin: '0 0 3px 0'
        }}>
          Dashboard
        </h1>
        <p style={{ 
          fontSize: '12px', 
          color: 'oklch(0.65 0 0)', 
          margin: 0
        }}>
          Your personal command center
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
        width: '100%',
      }}>
        {[
          { title: 'Tasks Done', value: '24', trend: '↑ 12% this week', color: 60 },
          { title: 'Focus Time', value: '6.2h', trend: '↑ 3% this week', color: 200 },
          { title: 'Notes Created', value: '8', trend: '↑ 5% this week', color: 150 },
        ].map((card) => (
          <div
            key={card.title}
            style={{
              background: 'oklch(0.18 0.02 290)',
              border: '1px solid oklch(0.24 0.01 290)',
              borderRadius: '10px',
              padding: '14px',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              transition: 'background 140ms ease, border-color 140ms ease, transform 140ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'oklch(0.22 0.02 290)'
              e.currentTarget.style.borderColor = 'oklch(0.28 0.01 290)'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'oklch(0.18 0.02 290)'
              e.currentTarget.style.borderColor = 'oklch(0.24 0.01 290)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              background: `oklch(0.22 0.08 ${card.color})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '10px',
              flexShrink: 0,
              color: `oklch(0.75 0.14 ${card.color})`,
              fontSize: '13px',
            }}>
              ↗
            </div>
            <h3 style={{ 
              fontSize: '12px', 
              fontWeight: 600, 
              color: 'oklch(0.95 0 0)', 
              margin: '0 0 3px 0'
            }}>
              {card.title}
            </h3>
            <div style={{ 
              fontSize: '22px', 
              fontWeight: 700, 
              color: 'oklch(0.95 0 0)', 
              letterSpacing: '-0.4px', 
              margin: '0 0 2px 0'
            }}>
              {card.value}
            </div>
            <p style={{ 
              fontSize: '10px', 
              color: `oklch(0.65 0.14 ${card.color})`, 
              margin: 0 
            }}>
              {card.trend}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}