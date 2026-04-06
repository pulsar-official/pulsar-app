# Habit Dashboard Widgets - Integration Guide

Two new dashboard widgets have been created for the Corespace dashboard:

## 1. HabitChecklist Widget

**File**: `src/components/Dashboard/widgets/HabitChecklist.tsx`

**Styling**: `src/components/Dashboard/widgets/HabitChecklist.module.scss`

### Features
- Displays today's uncompleted habits in a scrollable checklist format
- Sticky header ("Habits Today") that stays visible during scroll
- Interactive checkboxes that mark habits as complete
- Completed habits move to a separate "completed section" at the bottom (grayed out)
- Empty state displays "All done for today! 🎉" when all habits are completed
- Smooth animations when habits transition to completed state
- Minimum size: 300x400px
- Responsive scrolling for > 5 habits

### Data Source
- Integrates with `useProductivityStore` (productivityStore)
- Uses `habits` array and `habitChecks` array
- Gets today's date automatically
- Calls `toggleHabitCheck(habitId, TODAY)` to mark habits complete

### Props (Optional)
```typescript
interface HabitChecklistProps {
  habits?: Habit[]              // Override store habits
  habitChecks?: HabitCheck[]    // Override store habit checks
  onCheck?: (habitId: string) => void  // Custom check callback
}
```

### Integration Example
```tsx
import HabitChecklist from '@/components/Dashboard/widgets/HabitChecklist'
import { WidgetContainer } from '@/components/Dashboard/Corespace'

// In your layout component:
<WidgetContainer
  id="habitChecklist"
  title="Habits Today"
  tier="atom"
  userTier={tier}
  defaultW={4}
  defaultH={5}
>
  <HabitChecklist />
</WidgetContainer>
```

### Styling Notes
- Uses OKLCH color system with purple accent (`oklch(0.55 0.18 290)`)
- Green checkmark color for completed: `oklch(0.65 0.14 150)`
- Dark theme background: `oklch(0.09 0.02 270)`
- Follows existing widget styling patterns from CalendarWeekWidget
- Custom scrollbar styling with transparency

---

## 2. HabitChartWidget

**File**: `src/components/Dashboard/widgets/HabitChartWidget.tsx`

**Styling**: `src/components/Dashboard/widgets/HabitChartWidget.module.scss`

### Features
- Mini SVG line chart showing habit completion trends
- 7-14 day time range (default: 7 days)
- Displays completion percentage (0-100%) on Y-axis
- Shows dates on X-axis (displays "Today" for current date)
- Responsive sizing - adapts to container width/height
- Data points plotted with circles
- Filled area under the line with gradient transparency
- Grid line at 50% mark
- Minimum size: 300x250px
- No header/title (chart speaks for itself)

### Data Source
- Integrates with `useProductivityStore`
- Uses `habits` array and `habitChecks` array
- Automatically calculates completion percentage per day
- Works with any number of habits

### Props (Optional)
```typescript
interface HabitChartWidgetProps {
  habits?: Habit[]              // Override store habits
  habitChecks?: HabitCheck[]    // Override store habit checks
  days?: number                 // 7 or 14 (default: 7)
}
```

### Integration Example
```tsx
import HabitChartWidget from '@/components/Dashboard/widgets/HabitChartWidget'
import { WidgetContainer } from '@/components/Dashboard/Corespace'

// In your layout component:
<WidgetContainer
  id="habitChart"
  title="Habit Trends"
  tier="molecule"
  userTier={tier}
  defaultW={6}
  defaultH={3}
>
  <HabitChartWidget days={7} />
</WidgetContainer>
```

### Styling Notes
- Uses OKLCH color system with purple accent: `oklch(0.55 0.18 290)`
- Fill area opacity: 15% of accent color
- Grid line is subtle and dashed
- X/Y axis labels use muted gray colors
- Responsive via ResizeObserver for accurate SVG sizing
- Follows widget size conventions (300x250px minimum)

---

## Adding to CorespaceLayout

To add these widgets to the Corespace dashboard, update `src/components/Dashboard/modules/corespace/CorespaceLayout.tsx`:

### 1. Add imports
```tsx
import HabitChecklist from '@/components/Dashboard/widgets/HabitChecklist'
import HabitChartWidget from '@/components/Dashboard/widgets/HabitChartWidget'
```

### 2. Add to AVAILABLE_WIDGETS
```tsx
const AVAILABLE_WIDGETS = [
  // ... existing widgets ...
  { id: 'habitChecklist',  name: 'Habits — Checklist',    tier: 'atom' },
  { id: 'habitChart',      name: 'Habits — Chart',        tier: 'molecule' },
] as const
```

### 3. Add to widget grid
```tsx
<WidgetContainer
  id="habitChecklist"
  title="Habits Today"
  tier="atom"
  userTier={tier}
  defaultW={4}
  defaultH={5}
>
  <HabitChecklist />
</WidgetContainer>

<WidgetContainer
  id="habitChart"
  title="Habit Trends"
  tier="molecule"
  userTier={tier}
  defaultW={6}
  defaultH={3}
>
  <HabitChartWidget days={7} />
</WidgetContainer>
```

---

## Component Architecture

### HabitChecklist
- Uses local `animatingId` state to track which habit is being checked
- Separates habits into "uncompleted" and "completed" arrays
- Items animate down when completed (with `slideDown` keyframe animation)
- Header stays fixed with `position: sticky` and `z-index: 10`
- Content area scrollable with custom scrollbar styling

### HabitChartWidget
- Uses ResizeObserver to adapt SVG size to container
- Calculates geometry with padding (PL, PR, PT, PB)
- Points generated from chart data
- SVG paths for line and area are rendered separately
- Grid line for visual reference at 50% mark

---

## Type Safety

Both components are fully typed with TypeScript:

```typescript
import type { Habit, HabitCheck } from '@/types/productivity'
```

The store provides:
- `habits`: Array of Habit objects (id, name, emoji, category, archived, etc.)
- `habitChecks`: Array of HabitCheck objects (habitId, date, checked)
- `toggleHabitCheck(habitId, date)`: Method to toggle a habit check

---

## Minimum Size Requirements

- **HabitChecklist**: 300px width × 400px height (enforced by widget system)
- **HabitChartWidget**: 300px width × 250px height (enforced by widget system)

These minimums ensure proper usability and readability of the content.

---

## Theme Integration

Both widgets respect the existing theme:
- Dark background: `oklch(0.09 0.02 270)` (very dark purple)
- Borders: `oklch(0.18 0.03 270)` (dark purple)
- Primary accent: `oklch(0.55 0.18 290)` (vibrant purple)
- Success/done color: `oklch(0.65 0.14 150)` (green)
- Text: `oklch(0.92 0.01 270)` (light gray)

All colors use OKLCH color space for consistency with the design system.

---

## Browser Compatibility

- ResizeObserver: Modern browsers (Chrome 64+, Firefox 69+, Safari 13.1+)
- SVG rendering: All modern browsers
- Custom scrollbar: WebKit browsers (Chrome, Safari, Edge)
- CSS sticky positioning: All modern browsers

---

## Performance Notes

- HabitChecklist: O(n) rendering where n = number of habits
- HabitChartWidget: O(d) rendering where d = number of days (7-14 typically)
- Both use useMemo for expensive calculations (check map, chart data)
- ResizeObserver cleanup properly manages memory
- No external charting libraries required (pure SVG)
