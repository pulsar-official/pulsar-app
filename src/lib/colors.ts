export const getPillarColor = (hue: number) => {
  return `oklch(0.72 0.14 ${hue})`
}

export const getBackgroundColor = (hue: number) => {
  return `oklch(0.28 0.10 ${hue})`
}

export const getSurfaceColor = (level: number) => {
  const levels: Record<number, string> = {
    1: 'oklch(0.15 0.02 290)',
    2: 'oklch(0.18 0.02 290)',
    3: 'oklch(0.22 0.02 290)',
    4: 'oklch(0.26 0.02 290)',
  }
  return levels[level]
}