'use client'

import React, { useState, useRef, useEffect } from 'react'
import styles from './Search.module.scss'

interface SearchProps {
  onSearch?: (query: string) => void
  onCommandExecute?: (command: string, args: string) => void
  collapsed?: boolean
}

export const Search: React.FC<SearchProps> = ({
  onSearch,
  onCommandExecute,
  collapsed = false,
}) => {
  const [value, setValue] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setValue(query)

    if (query.startsWith('/')) {
      // Command mode
      const parts = query.slice(1).split(' ')
      const command = parts[0]
      const args = parts.slice(1).join(' ')

      // Suggest commands
      const commands = ['search', 'tag', 'pillar', 'date', 'status']
      const filtered = commands.filter((c) => c.startsWith(command))
      setSuggestions(filtered.map((c) => `/${c}`))
    } else {
      // Regular search
      setSuggestions([])
      onSearch?.(query)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (value.startsWith('/')) {
        const parts = value.slice(1).split(' ')
        const command = parts[0]
        const args = parts.slice(1).join(' ')
        onCommandExecute?.(command, args)
        setValue('')
        setSuggestions([])
      } else {
        onSearch?.(value)
      }
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setValue(suggestion + ' ')
    inputRef.current?.focus()
  }

  return (
    <div className={styles.searchContainer}>
      <div className={styles.search}>
        <span className={styles.icon}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </span>
        <input
          ref={inputRef}
          className={styles.input}
          type="text"
          placeholder={collapsed ? '' : 'Search or /command'}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          aria-label="Search"
        />
      </div>

      {/* Command Suggestions */}
      {suggestions.length > 0 && (
        <div className={styles.suggestions}>
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              className={styles.suggestionItem}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default Search