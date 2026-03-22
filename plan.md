# Journal Sub-Pillar Components — Implementation Plan

## Overview
Replace the current single Journal page with a full Journal section under Productivity, containing 6 sub-pages: Journal Editor, Calendar, Templates, Mood Tracker, Prompts, and Streaks.

---

## Step 1: Types (`src/types/productivity.ts`)
Add two new interfaces:
- `JournalTemplate` — id, name, description, icon, category, prompts[], defaultTags[]
- `JournalPrompt` — id, text, category

No changes to existing `JournalEntry` (mood/tags/date already flexible enough).

## Step 2: Shared Constants (`src/constants/journal.ts` — NEW)
Extract from Journal.tsx and expand:
- `MOODS`, `MOOD_COLORS`, `MOOD_LABELS` maps
- `TAGS` array
- `TEMPLATES` array (6 templates: gratitude, morning routine, weekly review, self-reflection, goals check-in, free write)
- `PROMPTS` array (~30 prompts across 6 categories)

## Step 3: Store Extensions (`src/stores/productivityStore.ts`)
Add:
- `selectedJournalEntryId: number | null` + setter (for cross-component navigation)
- `getJournalEntriesByDate(date)` — filter entries by date
- `getJournalMoodDistribution()` — tally mood occurrences
- `getJournalStreak()` — compute current/longest streak, total days, dates Set
- Expand `SAMPLE_JOURNAL` to ~15-20 entries across last 30 days with varied moods/tags

## Step 4: JournalEditor (`JournalEditor.tsx` + `.module.scss` — NEW, replaces Journal.tsx)
Page string: `journal` (unchanged)
Enhanced version of current Journal.tsx:
- Same two-pane layout (sidebar list + editor)
- Search/filter input on sidebar, sort toggle (date/title)
- Word count + reading time in footer
- Auto-save indicator
- "Use template" and "View calendar" navigation buttons
- Reads `selectedJournalEntryId` on mount for cross-component entry selection

## Step 5: JournalCalendar (`JournalCalendar.tsx` + `.module.scss` — NEW)
Page string: `journalcalendar`
- Month navigation with left/right arrows
- 7-column CSS grid calendar; each day shows mood dot + entry count badge
- Today highlighted with accent border
- Day detail panel showing entries for selected date
- Click entry → sets `selectedJournalEntryId` → navigates to `journal`
- "New entry" button pre-fills selected date

## Step 6: JournalTemplates (`JournalTemplates.tsx` + `.module.scss` — NEW)
Page string: `journaltemplates`
- Grid of template cards (icon, name, description, category pill)
- Category filter pills at top
- Click card to expand/preview template prompts
- "Use template" creates a new entry pre-filled with template content, navigates to editor

## Step 7: JournalPrompts (`JournalPrompts.tsx` + `.module.scss` — NEW)
Page string: `journalprompts`
- Category tabs (All, Self-reflection, Gratitude, Goals, Creativity, Mindfulness, Growth)
- Scrollable prompt cards with "Use this prompt" button
- Shuffle/random button
- Using a prompt creates a new entry with the prompt as content, navigates to editor

## Step 8: MoodTracker (`MoodTracker.tsx` + `.module.scss` — NEW)
Page string: `moodtracker`
- **Mood over time** SVG line chart (last 30 days, mood→numeric scale, emoji data points, area fill)
- **Mood distribution** horizontal bar chart (count per mood, colored by MOOD_COLORS)
- **Mood-tag correlation** HTML table grid (moods × tags, intensity shading)
- Uses ResizeObserver pattern from Habits.tsx for responsive SVG

## Step 9: JournalStreaks (`JournalStreaks.tsx` + `.module.scss` — NEW)
Page string: `journalstreaks`
- **Stats row**: current streak, longest streak, total entries, this month (fraction)
- **Streak heatmap**: GitHub-style 12-week SVG grid, colored by entry count per day
- **Weekly completion bar chart**: last 8 weeks, bar height = days with entries
- Uses ResizeObserver pattern from Habits.tsx

## Step 10: Registration
**`src/constants/pillars.ts`**: Remove Journal from "Track" section. Add new "Journal" section:
```
{ title: 'Journal', items: [
  { icon: 'note', name: 'Journal', page: 'journal' },
  { icon: 'cal', name: 'Calendar', page: 'journalcalendar' },
  { icon: 'card', name: 'Templates', page: 'journaltemplates' },
  { icon: 'trend', name: 'Mood Tracker', page: 'moodtracker' },
  { icon: 'zap', name: 'Prompts', page: 'journalprompts' },
  { icon: 'heat', name: 'Streaks', page: 'journalstreaks' },
]}
```

**`src/components/Dashboard/MainContent.tsx`**: Add imports for all 6 new components, register in MODULES map, remove old Journal import.

## Step 11: Cleanup
Delete old `Journal.tsx` and `Journal.module.scss`.

---

## Key Patterns to Follow
- **SVG charts**: Copy ResizeObserver + viewBox + computed geometry pattern from `Habits.tsx`
- **Styling**: Use SCSS modules with oklch colors, productivity hue (60), existing CSS variables
- **Store**: All data derived from existing `journalEntries` array — no new API calls
- **Navigation**: Components use `onNavigate` prop from MainContent to switch pages
