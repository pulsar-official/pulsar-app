// --- FOCUS SESSIONS - TYPES ---

export type Phase = 'dashboard' | 'session' | 'rest' | 'complete';

export type Priority = 'high' | 'medium' | 'low';

export type TimerTypeId = 'pomodoro' | 'deepwork' | 'sprint' | 'adaptive' | 'custom';

export interface Task {
  id: number;
  title: string;
  priority: Priority;
  done: boolean;
  deferred: boolean;
}

export interface TimerType {
  id: TimerTypeId;
  label: string;
  icon: string;
  desc: string;
  work: number;
  rest: number;
  longRest: number;
  cyclesBeforeLong: number;
  color: string;
  colorRgb: string;
}

export interface TimerConfig {
  work: number;
  rest: number;
  longRest: number;
  cyclesBeforeLong: number;
}

export interface Resource {
  icon: string;
  label: string;
}