# Blob Mode System - Quick Reference Card

## Installation

```bash
npm install
```

## Basic Usage

```tsx
import { BlobWrapper } from '@/components/Dashboard/widgets/BlobWrapper'

<BlobWrapper enableBlob={true} blobColor="oklch(0.55 0.18 290)">
  {/* Your widget content */}
</BlobWrapper>
```

## With Hook

```tsx
import { BlobWrapper } from '@/components/Dashboard/widgets/BlobWrapper'
import { useBlob } from '@/components/Dashboard/widgets/useBlob'

const blob = useBlob({ enableBlob: true })
<BlobWrapper {...blob}>{/* content */}</BlobWrapper>
```

## Color Presets

| Name | Value | Use |
|------|-------|-----|
| Purple | `oklch(0.55 0.18 290)` | Goals, Habits, Tasks |
| Amber | `oklch(0.62 0.16 80)` | Journal |
| Green | `oklch(0.65 0.14 150)` | Done States |
| Red | `oklch(0.65 0.15 20)` | Delete/Danger |
| Blue | `oklch(0.6 0.15 260)` | Accents |

## Props Reference

| Prop | Type | Default | Options |
|------|------|---------|---------|
| `enableBlob` | boolean | false | true/false |
| `blobColor` | string | oklch(0.55 0.18 290) | OKLCH format |
| `morphSpeed` | number | 3000 | 1000-5000 |
| `complexity` | number | 8 | 6-12 |
| `intensity` | string | 'med' | 'low'/'med'/'high' |

## Hook Methods

```tsx
const blob = useBlob()

// Setters
blob.setEnableBlob(true)
blob.setBlobColor('oklch(0.62 0.16 80)')
blob.setMorphSpeed(3500)
blob.setComplexity(8)
blob.setIntensity('high')

// Actions
blob.applyPreset('purple')
blob.updateFromContainerSize(width, height)
blob.reset()

// State
blob.enableBlob
blob.blobColor
blob.isValid
blob.errors
```

## localStorage Persistence

```tsx
const blob = useBlob()
const { saveToStorage, loadFromStorage } = useLocalBlobStorage('widget-key', blob)

// Load on mount
useEffect(() => loadFromStorage(), [])

// Save on change
useEffect(() => saveToStorage(), [blob.blobColor])
```

## Utility Functions

```tsx
import {
  isValidOklchColor,
  parseOklchColor,
  createOklchColor,
  getBlobColorPreset,
  calculateComplexityFromSize,
  validateBlobConfig,
  getIntensityOpacity,
  getRecommendedTextColor,
} from '@/components/Dashboard/widgets/blobUtils'

// Validate
isValidOklchColor('oklch(0.55 0.18 290)') // true

// Parse
parseOklchColor('oklch(0.55 0.18 290)')
// { lightness: 0.55, chroma: 0.18, hue: 290 }

// Create
createOklchColor(0.55, 0.18, 290)
// 'oklch(0.55 0.18 290)'

// Preset
getBlobColorPreset('purple')
// { name, value, description, use }

// Size-based complexity
calculateComplexityFromSize(800, 600) // 8 or 6-12

// Validation
validateBlobConfig({ morphSpeed: 2500 }) // ['Morph speed must be at least 1000ms']

// Intensity opacity
getIntensityOpacity('med') // 0.65

// Text color
getRecommendedTextColor('oklch(0.55 0.18 290)') // oklch(0.95 0 0)
```

## Common Patterns

### Conditional Enable
```tsx
const blobsEnabled = useUIStore(s => s.blobsEnabled)
<BlobWrapper enableBlob={blobsEnabled}>{/* content */}</BlobWrapper>
```

### Size-Responsive
```tsx
const blob = useBlob()
useEffect(() => {
  blob.updateFromContainerSize(width, height)
}, [blob])
```

### Persistent Settings
```tsx
const blob = useBlob()
const { saveToStorage, loadFromStorage } = useLocalBlobStorage('key', blob)
useEffect(() => loadFromStorage(), [])
useEffect(() => saveToStorage(), [blob.morphSpeed])
```

### Device-Aware
```tsx
const isLowEnd = navigator.deviceMemory <= 4
<BlobWrapper
  enableBlob={!isLowEnd && blobsEnabled}
  complexity={isLowEnd ? 6 : 8}
>{/* content */}</BlobWrapper>
```

### Reduce Motion
```tsx
const prefersReducedMotion =
  window.matchMedia('(prefers-reduced-motion: reduce)').matches
<BlobWrapper enableBlob={!prefersReducedMotion}>{/* content */}</BlobWrapper>
```

## File Locations

| File | Purpose |
|------|---------|
| `BlobWrapper.tsx` | Main component |
| `blobGenerator.ts` | Path generation |
| `blob.types.ts` | Type definitions |
| `blobUtils.ts` | Utilities |
| `useBlob.ts` | React hook |
| `README.md` | Quick guide |
| `BLOB_SYSTEM.md` | Technical docs |

## Documentation Links

- **Quick Start**: `src/components/Dashboard/widgets/README.md`
- **Integration**: `BLOB_INTEGRATION_GUIDE.md`
- **Technical**: `src/components/Dashboard/widgets/BLOB_SYSTEM.md`
- **Examples**: `BLOB_PRODUCTIVITY_EXAMPLES.md`
- **Files**: `BLOB_FILES_MANIFEST.md`

## Testing

```tsx
import {
  generateMockBlobPath,
  assertValidSvgPath,
  assertValidOklchColor,
  testBlobConsistency,
  BlobBenchmark,
} from '@/components/Dashboard/widgets/__tests__/blob.test.utils'

// Test generation
testBlobConsistency()

// Benchmark
const time = BlobBenchmark.measureGeneration(400, 400, 100)
```

## Performance Tips

1. **Disable on low-end devices**
   ```tsx
   enableBlob={!isLowEnd && blobsEnabled}
   ```

2. **Reduce complexity on mobile**
   ```tsx
   complexity={window.innerWidth < 768 ? 6 : 8}
   ```

3. **Slower morph for better appearance**
   ```tsx
   morphSpeed={4000}
   ```

4. **Low intensity for battery**
   ```tsx
   intensity={isPowerSaver ? 'low' : 'med'}
   ```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Blob not showing | Check `enableBlob={true}` |
| Jerky animation | Increase `morphSpeed` to 4000+ |
| Wrong color | Use valid OKLCH: `oklch(L C H)` |
| High memory | Reduce `complexity` to 6 |
| Color mismatch | Check format: `oklch(0-1 0-0.4 0-360)` |

## API Reference

### BlobWrapper Props
```typescript
interface BlobWrapperProps {
  children: ReactNode
  enableBlob?: boolean
  blobColor?: string
  morphSpeed?: number
  complexity?: number
  intensity?: 'low' | 'med' | 'high'
  className?: string
}
```

### useBlob Hook
```typescript
const blob = useBlob(options?)

// Returns
{
  enableBlob: boolean
  blobColor: string
  morphSpeed: number
  complexity: number
  intensity: BlobIntensity
  isValid: boolean
  errors: string[]
  setEnableBlob: (v: boolean) => void
  setBlobColor: (v: string) => void
  setMorphSpeed: (v: number) => void
  setComplexity: (v: number) => void
  setIntensity: (v: BlobIntensity) => void
  reset: () => void
  applyPreset: (key: string) => boolean
  updateFromContainerSize: (w: number, h: number) => void
}
```

### useLocalBlobStorage Hook
```typescript
const { saveToStorage, loadFromStorage } =
  useLocalBlobStorage(key, blob)
```

## Configuration Constants

```typescript
// Defaults
morphSpeed: 3000
complexity: 8
intensity: 'med'

// Ranges
complexity: 6-12
morphSpeed: 1000-5000
intensity: 'low' | 'med' | 'high'
opacity: 0.4 (low) / 0.65 (med) / 1.0 (high)
```

## Browser Compatibility

✅ Chrome 90+
✅ Firefox 88+
✅ Safari 14+
✅ Edge 90+

## Dependencies

- `anime` - Smooth animations
- `@georgedoescode/spline` - Curve interpolation
- `simplex-noise` - Organic variation

---

**For detailed information, see the full documentation in the project directory.**

**Quick Links**:
- 🚀 [Integration Guide](BLOB_INTEGRATION_GUIDE.md)
- 📖 [Technical Docs](src/components/Dashboard/widgets/BLOB_SYSTEM.md)
- 💡 [Examples](BLOB_PRODUCTIVITY_EXAMPLES.md)
- ✅ [Completion Status](BLOB_IMPLEMENTATION_COMPLETE.md)
