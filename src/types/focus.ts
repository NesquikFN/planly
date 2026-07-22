export interface FocusTask {
  title: string;
  time: string;
}

export interface WeeklyProgress {
  points: number[];
  days: string[];
  completed: number;
  total: number;
  percent: number;
}
