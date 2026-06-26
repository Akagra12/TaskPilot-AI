export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  deadline: string;
  priority: "high" | "medium" | "low";
  estimatedHours: number;
  timeSpent: number;
  status: "pending" | "completed";
  subtasks: Subtask[];
  category: string;
  createdAt: string;
  aiNotes?: string;
  urgencyScore?: number;
  alarmType?: "none" | "notification" | "ringing" | "vibration";
  alarmTriggered?: boolean;
}

export interface Profile {
  name: string;
  productivityStyle: string;
  focusGoal: string;
  geminiApiKey?: string;
}

export interface ChatMessage {
  role: "user" | "model";
  text: string;
  timestamp: string;
}

export interface ScheduleItem {
  id: string;
  time: string;
  taskTitle: string;
  duration: string;
  type: "focus" | "break" | "review";
}

export interface DailyPlan {
  date: string;
  schedule: ScheduleItem[];
  coachingTip: string;
}

export interface RescuePlan {
  immediateFirstStep: string;
  timeBoxingStrategy: string;
  distractionShutdown: string;
  reassuringEncouragement: string;
}
