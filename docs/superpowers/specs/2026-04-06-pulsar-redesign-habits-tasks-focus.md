# Pulsar Productivity Redesign
## Focus: Habits, Tasks, Focus Sessions Integration

**Date:** 2026-04-06
**Priority:** High (ROI = student future impact)
**Scope:** 3 interconnected modules + Corespace redesign

---

## Global: Tier & Dev Features

### Tier System
- **Atom** (free) = baseline widgets (Focus Timer, Habits Today, Today's Tasks, Notifications)
- **Molecule** ($12/mo) = unlocks Time Blocking, Habit Insights, Focus Insights widgets
- **Neuron** ($20/mo) = unlocks Focus Launcher, advanced filters
- **Quantum** ($30/mo) = all features unlocked

### Dev Sidebar (yoshigar304@gmail.com only)
- Visible in top-right corner
- Shows current tier: [Atom] [Molecule] [Neuron] [Quantum]
- **Clickable tier buttons** → instantly switch tier for testing
- Dev label visible to indicate admin/test mode

### Pillar Access (All Users)
- **All pillar pages** (Productivity, Knowledge, Collaboration, Insights) are accessible to all users
- Tier gating applies **only to Corespace widgets** and **premium features within modules**
- Example: Everyone can view Tasks module, but "Time Blocking Suggestions" widget is Molecule+ only

---

## 1. Corespace (Customizable Dashboard)

### Design Principle
Clean, minimal default. Customize mode reveals drag handles and widget management. Tier-locked widgets show overlay with "Unlock in [Tier Name] plan" CTA.

### Layout (for yoshigar304@gmail.com with Dev Sidebar)
```
┌─────────────────────────────────────────────────────────────┐
│ Corespace                  [+ Add Widget] [Cust]  DEV: [A][M][N][Q] │
├──────────────────────────┬──────────────────────────────────┤
│                          │                                    │
│  NOTIFICATIONS           │  FOCUS TIMER                      │
│  (pinned: left 240px)    │  (top right, 4 cols)              │
│                          │                                    │
│  • Deep Work in 2h       │  00:25:34                         │
│  • Task due tomorrow     │  [||  Pause]  Focused Work        │
│                          │                                    │
├──────────────────────────┼──────────────────────────────────┤
│                          │                                    │
│  HABITS TODAY            │  TODAY'S TASKS                    │
│  (6 cols)                │  (6 cols)                         │
│                          │                                    │
│  Deep Work:    0h / 2h   │  Math 110 Problem Set             │
│  Review:      25m / 1h   │  Read Ch 5 Economics              │
│  Exercise:    30m / 30m  │  Start Project                    │
│                          │                                    │
└──────────────────────────┴──────────────────────────────────┘
```

### Tier-Locked Widget Overlay
When user's tier < widget tier, widget shows blur overlay:

```
┌────────────────────────────────┐
│ Time Blocking Suggestions      │
│                                │
│  [blur overlay]                │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓     │
│  ▓  Unlock in Molecule Plan ▓  │
│  ▓  [Upgrade to Molecule]   ▓  │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓     │
│                                │
└────────────────────────────────┘
```

**Dev Testing (yoshigar304@gmail.com only):**
- Top-right corner shows tier buttons: `[A] [M] [N] [Q]` (Atom, Molecule, Neuron, Quantum)
- Click any button to instantly switch tier and test features
- Dev label visible: "DEV: [A][M][N][Q]"
- All tier-locked widgets become accessible when tier is switched
- localStorage `pulsar-user-tier` is updated, persists across refresh
- Allows rapid testing without needing real subscriptions

### Customize Mode
- "Customize" button highlights when active
- All accessible widgets show **drag handle** (top-left corner, grid icon)
- Bottom-right **resize handle** on each widget
- "+ Add Widget" opens slide-in panel from right edge (only shows widgets user can add)
- Widgets show tier badge indicator (Atom / Molecule / Neuron / Quantum)

### Widget Picker Panel
When user clicks "+ Add Widget", slide-in shows:

```
┌──────────────────────────────┐
│ Available Widgets            │
├──────────────────────────────┤
│                              │
│ Focus Timer           [Atom] │ ← Available
│ Habits Today          [Atom] │ ← Available
│ Today's Tasks         [Atom] │ ← Available
│                              │
│ Time Blocking Suggest [Mol]  │ ← Locked
│   Unlock: $12/mo             │
│                              │
│ Focus Insights        [Mol]  │ ← Locked
│   Unlock: $12/mo             │
│                              │
│ Focus Launcher        [Neur] │ ← Locked
│   Unlock: $20/mo             │
│                              │
└──────────────────────────────┘
```

Only shows widgets user hasn't already added. For locked widgets, shows upgrade CTA.

### Default Widget Set (for all users, Atom tier)
1. Focus Timer (4 cols x 2 rows)
2. Habits Today (6 cols x 2 rows)
3. Today's Tasks (6 cols x 2 rows)
4. Notifications (pinned left sidebar, 240px)

### Additional Widgets (Unlocked by Tier)
- Time Blocking Suggestions (Molecule+)
- Focus Insights card (Molecule+)
- Habit Insights card (Molecule+)
- Focus Launcher (Neuron+)

---

## Module Access (All Pillars Available to All Users)

**Pillar Pages (100% free access):**
- Productivity > Habits (read/write, all features)
- Productivity > Tasks (read/write, all features)
- Productivity > Focus Sessions (read/write, all features)
- Productivity > Calendar (read/write)
- Productivity > Goals (read/write)
- Productivity > Journal (read/write)
- Knowledge > Notes (read/write)
- Insights > Dashboard (read-only, displays your data)
- Collaboration > Class Chat (MVP shell, all can see/join)

**Tier Gating applies to:**
- Corespace widgets (as listed above)
- Advanced features in modules (see per-module details below)

**Example:** A free (Atom) user can:
- Open the Tasks module and see all their tasks
- Create new tasks, edit, delete them
- View list/board views
- BUT cannot see "Time Blocking Suggestions" in the Tasks list view (that's a Molecule+ feature)
- BUT cannot see "Advanced Insights" widget in Corespace (that's Molecule+)

---

## 2. Habits Module

### Visual Design: Monthly Grid System

**Requirement:** Account for variable month lengths (28-31 days) and leap years.

#### Month Grid Structure
```
┌─────────────────────────────────────────────────────────────────┐
│ Habits > April 2026                   [◀ Mar] [May ▶] [Today]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│ Deep Work                                    Streak: 12 days     │
│ 78% complete (22/28 days this month)                            │
│                                                                   │
│ Mon  Tue  Wed  Thu  Fri  Sat  Sun           (April 2026: 30d)   │
│ ─────────────────────────────────────────────────────────────   │
│  1    2    3    4    5    6    7                                │
│ [█] [█] [█] [ ] [█] [█] [█]                                     │
│                                                                   │
│  8    9   10   11   12   13   14                                │
│ [█] [█] [█] [█] [ ] [█] [█]                                     │
│                                                                   │
│ 15   16   17   18   19   20   21                                │
│ [█] [█] [█] [█] [█] [█] [█]                                     │
│                                                                   │
│ 22   23   24   25   26   27   28                                │
│ [█] [█] [█] [ ] [█] [█] [ ]                                     │
│                                                                   │
│ 29   30                                                          │
│ [█] [ ]                                                          │
│                                                                   │
│ Longest Streak: 15 days (March 10-24)                           │
│ Total this month: 22 completions                                │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

#### Day Cell Colors
- **Empty [ ]** = not completed (light gray background)
- **Filled [█]** = completed (solid accent color)
- **Today's cell** = thick border (current date context)
- **Partial marker** (if applicable) = 50% fill (for habits with numeric targets)

#### Habit Card Details
```
┌──────────────────────────────────────────┐
│ Deep Work                                 │
│ Target: 2 hours daily                    │
│                                          │
│ This Month: 22/30 (73%)                  │
│ Current Streak: 12 consecutive days      │
│ Best Streak: 15 days (March 10-24)       │
│                                          │
│ [Edit] [Delete] [View History]           │
└──────────────────────────────────────────┘
```

#### Multi-Month Support
- **Month Navigation:** Left/right arrows, month/year selector
- **Leap Year Handling:** Feb shows 28 cells (non-leap) or 29 cells (leap year)
- **Grid Adjustment:** Unused cells at end of month are blank/disabled

#### Habit Creation/Edit
```
Add Habit
────────
Habit Name:        [Deep Work              ]
Target:            [Daily      ▼]  (Daily/3x Week/Weekly/Custom)
Target Duration:   [2 hours    ]
Color:             [Select color picker]
Emoji (optional):  [None selected]
Description:       [Focus on challenging work without distractions]

[Create]  [Cancel]
```

---

## 3. Tasks Module

### View 1: List View
```
┌──────────────────────────────────────────────────────────────────┐
│ Tasks > April 2026                                               │
│ [Filter: All] [Sort: Due Date] [View: List ▼]                   │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│ Pri │ Task                          │ Status    │ Due      │ Tag  │
│ ────┼───────────────────────────────┼───────────┼──────────┼──────│
│ ⬤⬤  │ Math 110 Problem Set         │ In Work   │ Apr 8    │ Math │
│     │ Linked to Habit: Deep Work   │           │          │      │
│     │                              │           │          │      │
│ ⬤   │ Read Ch 5 Economics          │ To Do     │ Apr 10   │ Econ │
│     │                              │           │          │      │
│ ⬤⬤⬤ │ Start Project (CS 170)       │ Blocked   │ Apr 15   │ CS   │
│     │ Depends on: 4 other tasks    │           │          │      │
│     │                              │           │          │      │
│ ⬤   │ Review notes from lecture    │ Done      │ Apr 6    │ Gen  │
│     │                              │           │          │      │
└──────────────────────────────────────────────────────────────────┘

Legend:
⬤ = Low priority
⬤⬬ = Medium priority
⬬⬬⬬ = High priority
```

### View 2: Board View (Kanban)
```
┌──────────────────────────────────────────────────────────────────┐
│ Tasks > Kanban                                                   │
├──────────────┬──────────────┬──────────────┬──────────────────────┤
│ BACKLOG      │ TO DO        │ IN PROGRESS  │ DONE                 │
│ (5 cards)    │ (8 cards)    │ (3 cards)    │ (12 cards)           │
├──────────────┼──────────────┼──────────────┼──────────────────────┤
│              │              │              │                      │
│ Task A       │ Task C       │ Task E       │ Task M               │
│ (High)       │ (Low)        │ (Medium)     │ ✓ Completed          │
│              │ Due Apr 10   │ Focused Qty: │                      │
│              │              │ 2h / 2h      │ Task N               │
│              │              │              │ ✓ Completed          │
│              │ Task D       │              │                      │
│              │ (Low)        │ Task F       │ ... 10 more          │
│              │              │ (High)       │                      │
│              │              │ In 1h focus  │                      │
│              │              │ session      │                      │
│              │              │              │                      │
│ [+ New]      │ [+ New]      │ [+ New]      │ [+ New]              │
└──────────────┴──────────────┴──────────────┴──────────────────────┘
```

### View 3: Timeline (Gantt)
```
┌──────────────────────────────────────────────────────────────────┐
│ Tasks > Timeline                                                 │
│ Week of Apr 8 - Apr 14, 2026                                     │
├─────────────┬──────────────────────────────────────────────────────┤
│ Task        │ Mon  Tue  Wed  Thu  Fri  Sat  Sun                   │
├─────────────┼──────────────────────────────────────────────────────┤
│ MATH 110    │      [====================================]          │
│ Prob Set    │      Due Apr 8                                      │
│             │      Dep: outline ready                             │
│             │                                                     │
│ - Outline   │ [=====]                                             │
│ - Solve P1  │       [==========]                                  │
│ - Write up  │                    [=============]                  │
│             │                                                     │
│ CS 170      │              [=========================>            │
│ Project     │              Due Apr 15                             │
│             │              (in progress)                          │
│             │                                                     │
│ ECON 101    │                        [=====]                      │
│ Read Ch 5   │                        Due Apr 10                   │
│             │                                                     │
│ Today ──→   │       ^                                             │
│             │      (Apr 9)                                        │
└─────────────┴──────────────────────────────────────────────────────┘

Legend:
[====] = Task bar (colored by status: blue=todo, amber=in-progress, green=done)
→      = Dependency (task blocks another)
```

### Task Creation
```
New Task
────────
Title:              [Math 110 Problem Set    ]
Description:        [Solve problems 1-10, show all work]
Priority:           [Medium ▼]
Status:             [To Do ▼]
Due Date:           [Apr 8, 2026]
Estimated Hours:    [3 hours]

Link to Habit:      [Deep Work ▼]  (optional, for focus queue)
Depends On:         [+ Add dependency]
Tags:               [+ Add tags]

[Create]  [Cancel]
```

---

## 4. Focus Sessions Module

### Screen 1: Home (Session Type Selection)
```
┌──────────────────────────────────────────────────────────────────┐
│ Focus Sessions                                                   │
│                                                                   │
│ Select a focus preset or create custom:                          │
│                                                                   │
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│ │ Pomodoro     │  │ Deep Work    │  │ Quick        │            │
│ │              │  │              │  │              │            │
│ │ 25m / 5m     │  │ 90m / 18m    │  │ 15m / 3m     │            │
│ │ 4 cycles     │  │ 2 cycles     │  │ 3 cycles     │            │
│ │              │  │              │  │              │            │
│ │ [Select]     │  │ [Select]     │  │ [Select]     │            │
│ └──────────────┘  └──────────────┘  └──────────────┘            │
│                                                                   │
│ ┌──────────────┐  ┌──────────────┐                              │
│ │ Long         │  │ Custom       │                              │
│ │              │  │              │                              │
│ │ 120m / 24m   │  │ Build your   │                              │
│ │ 2 cycles     │  │ own timing   │                              │
│ │              │  │              │                              │
│ │ [Select]     │  │ [Configure]  │                              │
│ └──────────────┘  └──────────────┘                              │
│                                                                   │
│ This Week: 12 hours 34 minutes of focus                         │
│ Longest Streak: 8 days                                          │
│                                                                   │
│ 30-Day Activity (Color = intensity)                             │
│ [░][░][░][█][█][░][▓][▓][█][░][░][░][█][█][▓]                 │
│ [░][▓][█][█][░][░][░][█][▓][▓][░][░][░][█][░]                 │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### Screen 2: Build Queue (Select Habits + Tasks)
```
┌──────────────────────────────────────────────────────────────────┐
│ Focus Sessions > Build Queue                                     │
│                                                                   │
│ Select Habit:  [Deep Work ▼]                                    │
│ Target:        [2 hours required]                               │
│                                                                   │
│ Add Tasks to Queue:                                             │
│                                                                   │
│ [ ] Math 110 Problem Set          (High priority, 3h est)       │
│ [X] Read Ch 5 Economics            (Low priority, 45m est)      │
│ [X] CS 170 Project outline         (Medium priority, 1h est)    │
│ [ ] Review lecture notes           (Low priority, 30m est)      │
│                                                                   │
│ Queue Summary:                                                   │
│ • 2 tasks selected (Est. 1h 45m)                                │
│ • Habit target: 2 hours                                         │
│ • You'll need ~15 more minutes after tasks to hit habit target │
│                                                                   │
│ Drag to reorder priority:          (handles on left :::)        │
│ 1. ::: Read Ch 5 Economics                                      │
│ 2. ::: CS 170 Project outline                                  │
│                                                                   │
│ [Start Focus Session]  [Cancel]                                │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### Screen 3: Running (Active Timer)
```
┌──────────────────────────────────────────────────────────────────┐
│ Focus Session Active                                             │
│                                                                   │
│ Phase: FOCUS WORK                                               │
│ Cycle: 1 of 2                                                   │
│                                                                   │
│              ┌─────────────┐                                     │
│              │   00:25:34  │                                     │
│              │             │                                     │
│              │  (progress  │                                     │
│              │   arc)      │                                     │
│              └─────────────┘                                     │
│                                                                   │
│ Current Task: Read Ch 5 Economics                               │
│ Time Logged: 15 minutes (25 remaining in task)                  │
│                                                                   │
│ Habit Progress: 1h 45m / 2h                                     │
│ [████████████████    ] 87% to habit completion                  │
│                                                                   │
│ [|| Pause]  [Skip Break]  [Quit Session]                        │
│                                                                   │
│ Motivational thought:                                           │
│ "Focus on the next 10 minutes. You've got this."               │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### Screen 4: Break (Short Rest)
```
┌──────────────────────────────────────────────────────────────────┐
│ Short Break                                                      │
│                                                                   │
│              ┌─────────────┐                                     │
│              │   00:05:00  │                                     │
│              │             │                                     │
│              │  (countdown)│                                     │
│              └─────────────┘                                     │
│                                                                   │
│ Take a moment. Stretch. Hydrate.                                │
│                                                                   │
│ Next: Focus session #2                                          │
│                                                                   │
│ [Skip Break]                                                     │
│                                                                   │
│ Queue:                                                           │
│ 1. Read Ch 5 Economics (continued)                              │
│ 2. CS 170 Project outline                                       │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### Screen 5: Session Complete
```
┌──────────────────────────────────────────────────────────────────┐
│ Session Complete!                                                │
│                                                                   │
│ Habit "Deep Work" ✓ COMPLETED                                   │
│ You hit your 2-hour target!                                     │
│                                                                   │
│ Session Summary:                                                │
│ • Duration: 2h 3m                                               │
│ • Cycles: 2 completed                                           │
│ • Tasks: 2/2 completed                                          │
│ • Break time: 23m                                               │
│                                                                   │
│ Streak: You're on a 12-day focus streak!                        │
│ (Yesterday was day 11, keep it going!)                          │
│                                                                   │
│ Completed Tasks:                                                │
│ ✓ Read Ch 5 Economics                                           │
│ ✓ CS 170 Project outline                                        │
│                                                                   │
│ [Start New Session]  [Back to Home]                             │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### Quit Deterrence Modal
```
┌────────────────────────────────────────────┐
│ Are You Sure?                              │
│                                            │
│ You're 47 minutes into Deep Work.          │
│ Your 12-day streak ends if you quit.       │
│                                            │
│ ┌──────────────────────────────────────┐  │
│ │ Time remaining to hit habit: 1h 13m  │  │
│ │ Push through?                        │  │
│ └──────────────────────────────────────┘  │
│                                            │
│ [Keep Going] [End Session]                 │
│                                            │
└────────────────────────────────────────────┘
```

---

## 5. Integration: Habit ↔ Task ↔ Focus Session

### Data Flow
```
HABIT "Deep Work 2h"
    ↓
TASK (tagged with habit)
    │
    └─→ "Math 110 Problem Set" (linked to Deep Work)
    └─→ "CS 170 Project outline" (linked to Deep Work)

FOCUS SESSION
    ↓
Select Habit → Deep Work
    ↓
Queue Tasks → 2 tasks selected
    ↓
Run Timer → 2 hours
    ↓
Completion
    ├─→ Tasks marked "Done"
    ├─→ Habit auto-checked (date cell fills)
    ├─→ Habit streak increments
    └─→ Corespace updates (habits today, streak badge)
```

### Auto-Check Logic
1. User selects a habit for focus session
2. User queues tasks linked to that habit
3. Timer runs for X minutes/hours
4. On completion:
   - If total focus time ≥ habit target → habit date cell fills
   - Streak counter increments (if not already checked today)
   - Habit card updates "Longest Streak", "This Month" stats

### Edge Cases
- User completes focus session but has already checked habit today → no duplicate check
- User starts 2h deep work, completes 1.5h → habit not checked (unless user's target allows partial)
- User switches habits mid-session → allocate time to whichever habit they end with

---

## 6. Landing Page: Remove Emojis

Current landing page uses emojis extensively. New version:
- Replace all emoji with **icons** (inline SVGs or iconography)
- Examples:
  - 🚀 → rocket icon
  - ✓ → checkmark icon
  - 🔥 → flame icon (if keeping visual metaphor)
  - 📅 → calendar icon
  - ⏱ → timer icon

---

## 7. Implementation Phases

### Phase 1: Corespace Redesign + Habits Module
- Simplify Corespace (remove clutter, add Add Widget button)
- Implement monthly grid with variable month lengths
- Habit card UI + streak tracking
- **Duration:** 1 week

### Phase 2: Tasks Expansion
- List, Board, Timeline views
- Task-Habit linking
- Dependency visualization
- **Duration:** 1 week

### Phase 3: Focus Sessions Integration
- Rewrite focus session UI (5 screens)
- Task queue builder
- Habit auto-check logic
- Session analytics
- **Duration:** 1 week

### Phase 4: Polish + Testing
- Remove landing page emojis
- Cross-module integration tests
- Performance optimization
- **Duration:** 3 days

---

## 8. Success Criteria

- [ ] Corespace feels discoverable (users can find Add Widget, Customize buttons immediately)
- [ ] Habits module renders correctly for all month lengths (28, 29, 30, 31 days)
- [ ] Users can see tasks in list/board/timeline and understand dependencies
- [ ] Focus session completes habit check automatically when duration target is met
- [ ] Task queue shows habit progress bar (e.g., "1h 45m / 2h")
- [ ] Streak counter works correctly across day boundaries
- [ ] No emojis visible in UI (icons only)
- [ ] Landing page emoji-free

