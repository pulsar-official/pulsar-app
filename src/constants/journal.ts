import type { JournalTemplate, JournalPrompt } from '@/types/productivity'

export const MOODS = ['😊', '😐', '😔', '😡', '🤩', '😴']

export const MOOD_COLORS: Record<string, string> = {
  '😊': 'oklch(0.65 0.18 150)',
  '😐': 'oklch(0.65 0.10 60)',
  '😔': 'oklch(0.55 0.15 260)',
  '😡': 'oklch(0.55 0.18 20)',
  '🤩': 'oklch(0.70 0.18 60)',
  '😴': 'oklch(0.55 0.10 290)',
}

export const MOOD_LABELS: Record<string, string> = {
  '😊': 'Happy',
  '😐': 'Neutral',
  '😔': 'Sad',
  '😡': 'Angry',
  '🤩': 'Excited',
  '😴': 'Tired',
}

export const MOOD_VALUES: Record<string, number> = {
  '🤩': 5,
  '😊': 4,
  '😐': 3,
  '😴': 2,
  '😔': 1,
  '😡': 0,
}

export const TAGS = ['gratitude', 'reflection', 'goals', 'ideas', 'personal', 'work']

export const TEMPLATES: JournalTemplate[] = [
  {
    id: 'gratitude',
    name: 'Gratitude Journal',
    description: 'Reflect on what you are thankful for today',
    icon: '🙏',
    category: 'gratitude',
    prompts: ['## Three things I am grateful for', '', '## Why these matter to me', '', '## One person I appreciate today', ''],
    defaultTags: ['gratitude'],
  },
  {
    id: 'morning',
    name: 'Morning Routine',
    description: 'Set intentions and plan your day',
    icon: '🌅',
    category: 'planning',
    prompts: ['## How I feel this morning', '', '## Top 3 priorities today', '', '## One thing I want to learn', ''],
    defaultTags: ['reflection', 'goals'],
  },
  {
    id: 'weekly-review',
    name: 'Weekly Review',
    description: 'Review your week and plan ahead',
    icon: '📋',
    category: 'review',
    prompts: ['## Wins this week', '', '## Challenges faced', '', '## Lessons learned', '', '## Goals for next week', ''],
    defaultTags: ['reflection', 'goals'],
  },
  {
    id: 'self-reflection',
    name: 'Self Reflection',
    description: 'Deep dive into your thoughts and feelings',
    icon: '🪞',
    category: 'reflection',
    prompts: ['## How am I really feeling?', '', '## What is on my mind?', '', '## What would make today great?', ''],
    defaultTags: ['reflection', 'personal'],
  },
  {
    id: 'goals-checkin',
    name: 'Goals Check-in',
    description: 'Track progress on your goals',
    icon: '🎯',
    category: 'planning',
    prompts: ['## Progress on current goals', '', '## Obstacles in the way', '', '## Next steps', '', '## Adjustments needed', ''],
    defaultTags: ['goals'],
  },
  {
    id: 'free-write',
    name: 'Free Write',
    description: 'Stream of consciousness writing',
    icon: '✍️',
    category: 'creative',
    prompts: ['Just start writing...', ''],
    defaultTags: ['personal'],
  },
]

export const PROMPTS: JournalPrompt[] = [
  { id: 'sr1', text: 'What is one thing you learned about yourself this week?', category: 'self-reflection' },
  { id: 'sr2', text: 'What emotions have you felt most strongly today?', category: 'self-reflection' },
  { id: 'sr3', text: 'If you could change one decision from today, what would it be?', category: 'self-reflection' },
  { id: 'sr4', text: 'What are you most proud of recently?', category: 'self-reflection' },
  { id: 'sr5', text: 'What patterns do you notice in your behavior lately?', category: 'self-reflection' },
  { id: 'g1', text: 'Name three things that made you smile today.', category: 'gratitude' },
  { id: 'g2', text: 'Who has positively impacted your life recently?', category: 'gratitude' },
  { id: 'g3', text: 'What simple pleasure did you enjoy today?', category: 'gratitude' },
  { id: 'g4', text: 'What skill or ability are you grateful to have?', category: 'gratitude' },
  { id: 'g5', text: 'What challenge are you grateful for, and why?', category: 'gratitude' },
  { id: 'go1', text: 'What is one small step you can take today toward your biggest goal?', category: 'goals' },
  { id: 'go2', text: 'Where do you see yourself in one year if you keep your current habits?', category: 'goals' },
  { id: 'go3', text: 'What is holding you back from achieving your next milestone?', category: 'goals' },
  { id: 'go4', text: 'What would you do if you knew you could not fail?', category: 'goals' },
  { id: 'go5', text: 'How can you make progress on your goals even on a bad day?', category: 'goals' },
  { id: 'c1', text: 'Write a short story that begins with: "The door opened, and..."', category: 'creativity' },
  { id: 'c2', text: 'Describe your perfect day in vivid detail.', category: 'creativity' },
  { id: 'c3', text: 'If you could have dinner with anyone, past or present, who and why?', category: 'creativity' },
  { id: 'c4', text: 'What would you create if you had unlimited resources?', category: 'creativity' },
  { id: 'c5', text: 'Write a letter to your future self, one year from now.', category: 'creativity' },
  { id: 'm1', text: 'Describe your current surroundings using all five senses.', category: 'mindfulness' },
  { id: 'm2', text: 'What are you holding onto that you need to let go of?', category: 'mindfulness' },
  { id: 'm3', text: 'Take three deep breaths and write how your body feels right now.', category: 'mindfulness' },
  { id: 'm4', text: 'What moment today were you most fully present?', category: 'mindfulness' },
  { id: 'm5', text: 'How does your mind feel right now: calm, busy, anxious, or something else?', category: 'mindfulness' },
  { id: 'gr1', text: 'What failure taught you the most valuable lesson?', category: 'growth' },
  { id: 'gr2', text: 'What is one thing you want to improve about yourself and why?', category: 'growth' },
  { id: 'gr3', text: 'How have you grown in the past six months?', category: 'growth' },
  { id: 'gr4', text: 'What constructive feedback have you received recently?', category: 'growth' },
  { id: 'gr5', text: 'What book, podcast, or conversation recently changed your perspective?', category: 'growth' },
]
