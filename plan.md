# Plan: Replace Goals Tracker & Replace Journal Calendar with Past Entries

## Part A — New Goal Tracker (Goals.tsx + Goals.module.scss)

### Problems with current Goals component
- Flat card list with no visual grouping or progress overview
- Sidebar stats are basic text — no charts or visual progress
- No filtering/sorting by category, priority, or status
- Sub-goals are hidden behind expand toggles, progress is manually entered
- No timeline / milestone view

### New Goals design (single file replacement)

**Layout: 3-panel**
```
┌─────────────────────────────────────────────────────┐
│ Header: "Goals" | filter pills | + Add goal         │
├──────────────────┬──────────────────┬────────────────┤
│  Goal Cards      │  Selected Goal   │  Stats         │
│  (scrollable     │  Detail Panel    │  Panel         │
│   list, left)    │  (center)        │  (right)       │
│                  │                  │                 │
│  • Grouped by    │  • Full title    │  • Ring chart:  │
│    category      │  • Description   │    overall %    │
│  • Progress ring │  • Sub-goals     │  • Category     │
│    on each card  │    with inline   │    breakdown    │
│  • Priority dot  │    add/toggle    │    bars         │
│  • Deadline      │  • Progress bar  │  • Streak:      │
│    countdown     │    (auto from    │    consecutive  │
│  • Quick-done    │    sub-goals)    │    goal days    │
│    checkbox      │  • Deadline      │  • Upcoming     │
│                  │    countdown     │    deadlines    │
│                  │  • Edit/Delete   │    timeline     │
│                  │                  │  • Priority     │
│                  │                  │    pie          │
└──────────────────┴──────────────────┴────────────────┘
```

**Key improvements over current:**
1. **Category grouping** — goals grouped by category with collapsible sections in the left panel
2. **Filter & sort** — pill filters for category + status (active/done/all), sort by deadline/progress/priority
3. **Auto-progress** — progress bar auto-calculates from sub-goal completion ratio (can still be manually overridden)
4. **Detail panel** — clicking a goal opens full detail in center panel with inline sub-goal management
5. **Visual stats** — SVG ring chart for overall progress, category distribution bars, priority breakdown, upcoming deadlines with countdown
6. **Deadline countdown** — shows "3 days left" or "overdue" badges with color coding
7. **Mini progress rings** on each card in the left panel (tiny SVG circle)
8. **Milestone markers** — completed goals show a trophy/check animation

**Files changed:**
- `src/components/Dashboard/modules/productivity/Goals.tsx` — full rewrite
- `src/components/Dashboard/modules/productivity/Goals.module.scss` — full rewrite

**No changes needed to:** types, store, MainContent, pillars (Goal types and store actions already sufficient)

---

## Part B — Replace Journal Calendar with "Past Entries" Browser

### Rationale
The calendar view is redundant — entries are date-sorted in the editor sidebar already. A "Past Entries" page that provides richer browsing/filtering is more useful.

### New JournalEntries component (replaces JournalCalendar)

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│ Header: "Past Entries" | search | filter | back btn │
├─────────────────────────────────────────────────────┤
│ Filter row: mood pills | tag pills | date range     │
├──────────────────┬──────────────────────────────────┤
│ Entry list       │ Preview panel                    │
│ (scrollable)     │ (selected entry full content)    │
│                  │                                  │
│ • Date header    │ • Title + mood + date            │
│   grouping       │ • Full body text                 │
│ • Mood dot       │ • Tags                           │
│ • Title + date   │ • Word count                     │
│ • Preview line   │ • "Open in editor" button        │
│ • Word count     │ • "Delete" button                │
│                  │                                  │
└──────────────────┴──────────────────────────────────┘
```

**Key features:**
1. **Grouped by date** — entries grouped under date headers ("Today", "Yesterday", "Mar 18", etc.)
2. **Mood filter** — click mood emojis to filter entries by mood
3. **Tag filter** — click tags to filter by tag
4. **Date range** — optional "from" / "to" date inputs for narrowing
5. **Search** — text search across title + content
6. **Preview panel** — full read-only preview of selected entry, with "Open in editor" button that navigates to journal page with the entry selected
7. **Stats footer** — total entries shown, mood distribution mini-bar for visible entries

**Files changed:**
- `src/components/Dashboard/modules/productivity/JournalCalendar.tsx` — **delete**
- `src/components/Dashboard/modules/productivity/JournalCalendar.module.scss` — **delete**
- `src/components/Dashboard/modules/productivity/JournalEntries.tsx` — **new**
- `src/components/Dashboard/modules/productivity/JournalEntries.module.scss` — **new**
- `src/components/Dashboard/MainContent.tsx` — swap `JournalCalendar` import for `JournalEntries` (keep same route key `journalcalendar` or rename to `journalentries`)
- `src/constants/pillars.ts` — rename "Calendar" to "Past Entries" in the Journal section, update page key
- `src/components/Dashboard/modules/productivity/JournalEditor.tsx` — update nav link text from "Calendar" to "Past Entries"

---

## Implementation Order
1. Build new Goals component (Goals.tsx + Goals.module.scss) — full rewrite
2. Build JournalEntries component (new files)
3. Delete JournalCalendar files
4. Update MainContent.tsx, pillars.ts, JournalEditor.tsx registrations
5. Verify build, commit, push
