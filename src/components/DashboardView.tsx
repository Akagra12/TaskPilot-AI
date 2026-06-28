import { useState, FormEvent } from "react";
import { Task, RescuePlan, Profile } from "../types";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from "recharts";
import { 
  Plus, Sparkles, CheckCircle2, Circle, Clock, Flame, 
  AlertTriangle, Trash2, ListTodo, Trophy, Calendar, 
  ChevronRight, BrainCircuit, PlayCircle, Loader2, RefreshCw,
  Bell, BellOff, Volume2, Smartphone, Search
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

function getTomorrowDateTimeString(daysOffset = 1): string {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  date.setHours(12, 0, 0, 0); // Default to noon local time
  
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

interface DashboardViewProps {
  tasks: Task[];
  profile: Profile;
  onAddTask: (taskData: any) => Promise<void>;
  onUpdateTask: (id: string, updates: any) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onTriggerPrioritize: () => Promise<void>;
  onTriggerBreakdown: (taskId: string) => Promise<void>;
  onTriggerRescue: (taskId: string) => Promise<RescuePlan>;
}

const COLORS = ["#f59e0b", "#ec4899", "#8b5cf6", "#10b981", "#3b82f6", "#64748b"];

export default function DashboardView({
  tasks,
  profile,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onTriggerPrioritize,
  onTriggerBreakdown,
  onTriggerRescue,
}: DashboardViewProps) {
  // Modal & Form States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  
  // Custom friendly split Date, Time and Alarm states
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate() + 1); // Default to tomorrow
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });
  const [selectedHour, setSelectedHour] = useState(12); // 1-12
  const [selectedMinute, setSelectedMinute] = useState(0); // 0-59
  const [selectedPeriod, setSelectedPeriod] = useState<"AM" | "PM">("PM");
  const [alarmType, setAlarmType] = useState<"none" | "notification" | "ringing" | "vibration">("none");
  const [timePickerMode, setTimePickerMode] = useState<"hours" | "minutes">("hours");

  const [newPriority, setNewPriority] = useState<"high" | "medium" | "low">("medium");
  const [newHours, setNewHours] = useState("2");
  const [newCategory, setNewCategory] = useState("Development");
  
  // App action states
  const [isPrioritizing, setIsPrioritizing] = useState(false);
  const [loadingBreakdown, setLoadingBreakdown] = useState<string | null>(null);
  
  // Rescue modal states
  const [rescuePlan, setRescuePlan] = useState<RescuePlan | null>(null);
  const [rescuingTask, setRescuingTask] = useState<Task | null>(null);
  const [isRescueLoading, setIsRescueLoading] = useState(false);

  // Search & date filter query states
  const [taskSearchQuery, setTaskSearchQuery] = useState("");
  const [taskFilterDate, setTaskFilterDate] = useState("");

  // Stats calculation
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const pendingTasks = tasks.filter((t) => t.status === "pending");
  const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  const totalEstHours = pendingTasks.reduce((sum, t) => sum + t.estimatedHours, 0);
  const totalSpentHours = tasks.reduce((sum, t) => sum + t.timeSpent, 0);
  
  // Urgent deadlines check (within 24 hours)
  const urgentCount = pendingTasks.filter((t) => {
    const hoursLeft = (new Date(t.deadline).getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursLeft > 0 && hoursLeft <= 24;
  }).length;

  // Filter active tasks based on search and date criteria
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = taskSearchQuery.trim() === "" ||
      task.title.toLowerCase().includes(taskSearchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(taskSearchQuery.toLowerCase())) ||
      task.category.toLowerCase().includes(taskSearchQuery.toLowerCase());

    let matchesDate = true;
    if (taskFilterDate) {
      const taskDateObj = new Date(task.deadline);
      const yyyy = taskDateObj.getFullYear();
      const mm = String(taskDateObj.getMonth() + 1).padStart(2, "0");
      const dd = String(taskDateObj.getDate()).padStart(2, "0");
      const taskDateStr = `${yyyy}-${mm}-${dd}`;
      matchesDate = taskDateStr === taskFilterDate;
    }

    return matchesSearch && matchesDate;
  });

  // Recharts Chart Data Processing
  // 1. Priority distribution
  const priorityData = [
    { name: "High", value: pendingTasks.filter((t) => t.priority === "high").length, fill: "#ef4444" },
    { name: "Medium", value: pendingTasks.filter((t) => t.priority === "medium").length, fill: "#f59e0b" },
    { name: "Low", value: pendingTasks.filter((t) => t.priority === "low").length, fill: "#10b981" },
  ].filter(d => d.value > 0);

  // 2. Category distribution for pending
  const categories = pendingTasks.map((t) => t.category);
  const categoryCounts = Array.from(new Set(categories)).map((cat) => {
    return {
      name: cat,
      value: pendingTasks.filter((t) => t.category === cat).length,
    };
  });

  // Handle Form Submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    // Synthesize hour to 24h format
    let hour24 = selectedHour;
    if (selectedPeriod === "PM" && selectedHour < 12) hour24 += 12;
    if (selectedPeriod === "AM" && selectedHour === 12) hour24 = 0;
    
    const timeString = `${String(hour24).padStart(2, "0")}:${String(selectedMinute).padStart(2, "0")}`;
    const isoString = new Date(`${selectedDate}T${timeString}:00`).toISOString();
    
    await onAddTask({
      title: newTitle,
      description: newDesc,
      deadline: isoString,
      priority: newPriority,
      estimatedHours: Number(newHours),
      category: newCategory,
      alarmType: alarmType,
    });

    // Reset Form
    setNewTitle("");
    setNewDesc("");
    const today = new Date();
    today.setDate(today.getDate() + 1); // tomorrow preset
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
    setSelectedHour(12);
    setSelectedMinute(0);
    setSelectedPeriod("PM");
    setAlarmType("none");
    setIsAddOpen(false);
  };

  const addDaysToSelected = (days: number) => {
    const parts = selectedDate.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const target = new Date(year, month, day);
      target.setDate(target.getDate() + days);
      
      const yyyy = target.getFullYear();
      const mm = String(target.getMonth() + 1).padStart(2, "0");
      const dd = String(target.getDate()).padStart(2, "0");
      setSelectedDate(`${yyyy}-${mm}-${dd}`);
    } else {
      const target = new Date();
      target.setDate(target.getDate() + 1); // fallback to tomorrow
      const yyyy = target.getFullYear();
      const mm = String(target.getMonth() + 1).padStart(2, "0");
      const dd = String(target.getDate()).padStart(2, "0");
      setSelectedDate(`${yyyy}-${mm}-${dd}`);
    }
  };

  const resetDateToTomorrow = () => {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
  };

  // Run global prioritize
  const runPrioritize = async () => {
    setIsPrioritizing(true);
    try {
      await onTriggerPrioritize();
    } finally {
      setIsPrioritizing(false);
    }
  };

  // Run milestone breakdown
  const runBreakdown = async (taskId: string) => {
    setLoadingBreakdown(taskId);
    try {
      await onTriggerBreakdown(taskId);
    } finally {
      setLoadingBreakdown(null);
    }
  };

  // Trigger Rescue Plan
  const triggerRescue = async (task: Task) => {
    setRescuingTask(task);
    setIsRescueLoading(true);
    try {
      const plan = await onTriggerRescue(task.id);
      setRescuePlan(plan);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRescueLoading(false);
    }
  };

  // Log active status hours
  const incrementTime = async (task: Task) => {
    await onUpdateTask(task.id, { timeSpent: task.timeSpent + 1 });
  };

  return (
    <div id="dashboard-root" className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Top Welcome Panel */}
      <div id="welcome-panel" className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="font-sans text-2xl font-bold text-white">
            Welcome Back, {profile.name}!
          </h2>
          <p className="font-sans text-sm text-slate-400 mt-1 max-w-2xl">
            Focus Goal: <span className="text-amber-400">"{profile.focusGoal}"</span> • Style: <span className="text-rose-400 font-medium">{profile.productivityStyle}</span>
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button
            id="btn-global-prioritize"
            onClick={runPrioritize}
            disabled={isPrioritizing || pendingTasks.length === 0}
            className="flex-1 md:flex-none cursor-pointer px-4 py-2.5 rounded-xl bg-slate-800 text-amber-400 border border-slate-700 font-sans font-semibold text-sm hover:bg-slate-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isPrioritizing ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            ) : (
              <BrainCircuit className="w-4 h-4" />
            )}
            Run AI Prioritization
          </button>
          <button
            id="btn-open-add"
            onClick={() => setIsAddOpen(true)}
            className="flex-1 md:flex-none cursor-pointer px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 font-sans font-semibold text-sm text-white hover:opacity-95 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div id="stats-pending" className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
          <ListTodo className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <span className="font-sans text-xs text-slate-500 uppercase tracking-wider font-bold">Pending Commitments</span>
          <h3 className="font-sans text-2xl font-bold text-white mt-1">{pendingTasks.length}</h3>
        </div>
      </div>

      <div id="stats-urgency" className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
          <Flame className="w-5 h-5 text-rose-500" />
        </div>
        <div>
          <span className="font-sans text-xs text-slate-500 uppercase tracking-wider font-bold">24h Deadline Alerts</span>
          <h3 className="font-sans text-2xl font-bold text-white mt-1">{urgentCount}</h3>
        </div>
      </div>

      <div id="stats-time" className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
          <Clock className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <span className="font-sans text-xs text-slate-500 uppercase tracking-wider font-bold">Est. Hours Needed</span>
          <h3 className="font-sans text-2xl font-bold text-white mt-1">{totalEstHours} hrs</h3>
        </div>
      </div>

      <div id="stats-rate" className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
          <Trophy className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="flex-1">
          <span className="font-sans text-xs text-slate-500 uppercase tracking-wider font-bold">Completion Rate</span>
          <div className="flex items-center justify-between gap-2 mt-1">
            <h3 className="font-sans text-2xl font-bold text-white">{completionRate}%</h3>
            <span className="font-sans text-xs text-slate-400">({completedTasks}/{totalTasks})</span>
          </div>
        </div>
      </div>

      {/* Main Task list & details panel - ColSpan 3 */}
      <div id="task-panel" className="lg:col-span-3 flex flex-col gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-sans text-lg font-bold text-white flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-amber-500" />
              Active Task Deliverables
            </h3>
            {isPrioritizing && (
              <span className="text-xs font-mono text-amber-400 flex items-center gap-1.5 animate-pulse">
                <Sparkles className="w-3.5 h-3.5" /> AI priority re-calculating...
              </span>
            )}
          </div>

          {tasks.length === 0 ? (
            <div className="text-center py-12 px-6 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-center justify-center mb-4 text-amber-500/50">
                <ListTodo className="w-8 h-8 text-amber-400" />
              </div>
              <h4 className="font-sans font-bold text-white text-base">Your Active Runway is Clear</h4>
              <p className="font-sans text-xs text-slate-400 mt-2 max-w-sm leading-relaxed mx-auto">
                No active commitments or deadlines configured yet. Use the <strong className="text-amber-400 font-semibold">Add Task</strong> button at the top right to register your high-stakes targets.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 justify-center max-w-md border-t border-slate-800/60 pt-5 w-full">
                <span className="text-[10px] font-mono text-slate-500 px-2 py-1 rounded bg-slate-950/40 border border-slate-900">1. REGISTER TARGET</span>
                <span className="text-[10px] font-mono text-slate-500 px-2 py-1 rounded bg-slate-950/40 border border-slate-900">2. RUN AI PRIORITIZE</span>
                <span className="text-[10px] font-mono text-slate-500 px-2 py-1 rounded bg-slate-950/40 border border-slate-900">3. DISMANTLE STEPS</span>
              </div>
            </div>
          ) : (
            <>
              {/* Search & Calendar Date Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between p-4 mb-6 rounded-xl bg-slate-950 border border-slate-850">
                <div className="relative w-full sm:w-72">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="w-4 h-4 text-slate-500" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search tasks, categories..."
                    value={taskSearchQuery}
                    onChange={(e) => setTaskSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all"
                  />
                  {taskSearchQuery && (
                    <button
                      onClick={() => setTaskSearchQuery("")}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-white text-[10px] font-mono"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <div className="relative w-full sm:w-48 flex items-center">
                    <span className="absolute left-3 pointer-events-none text-slate-500 flex items-center">
                      <Calendar className="w-4 h-4 text-amber-500" />
                    </span>
                    <input
                      type="date"
                      value={taskFilterDate}
                      onChange={(e) => setTaskFilterDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                    />
                    {taskFilterDate && (
                      <button
                        onClick={() => setTaskFilterDate("")}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-white text-[10px] font-mono"
                        title="Clear date filter"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {(taskSearchQuery || taskFilterDate) && (
                    <button
                      onClick={() => {
                        setTaskSearchQuery("");
                        setTaskFilterDate("");
                      }}
                      className="px-3 py-2 text-xs font-semibold text-rose-400 bg-rose-950/20 border border-rose-900/30 rounded-xl hover:bg-rose-900/40 hover:text-rose-200 transition-colors cursor-pointer shrink-0"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>

              {filteredTasks.length === 0 ? (
                <div className="text-center py-12 px-6 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center mb-3 text-slate-500">
                    <Search className="w-5 h-5 text-slate-400" />
                  </div>
                  <h4 className="font-sans font-bold text-slate-400 text-sm">No tasks matched your search</h4>
                  <p className="font-sans text-xs text-slate-500 mt-1 max-w-sm leading-relaxed mx-auto">
                    Try adjusting your search terms or checking a different date using the calendar input above.
                  </p>
                  <button
                    onClick={() => {
                      setTaskSearchQuery("");
                      setTaskFilterDate("");
                    }}
                    className="mt-4 px-3 py-1.5 text-xs font-semibold text-amber-400 bg-amber-950/20 border border-amber-900/30 rounded-xl hover:bg-amber-900/40 transition-all cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-sans text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500 font-medium">
                        <th className="pb-3 w-10">Status</th>
                        <th className="pb-3 pl-2">Task Details</th>
                        <th className="pb-3">Deadline</th>
                        <th className="pb-3">Priority</th>
                        <th className="pb-3">Hours</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTasks.map((task) => {
                    const deadlineDate = new Date(task.deadline);
                    const hoursRemaining = (deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60);
                    const isOverdue = hoursRemaining < 0 && task.status === "pending";
                    const isUrgent = hoursRemaining > 0 && hoursRemaining <= 24 && task.status === "pending";

                    const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
                    const totalSubtasks = task.subtasks.length;
                    const subtaskPercent = totalSubtasks ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

                    return (
                      <tr key={task.id} className="border-b border-slate-800/55 hover:bg-slate-900/20 transition-all">
                        <td className="py-4 text-center">
                          <button
                            id={`btn-toggle-status-${task.id}`}
                            onClick={() =>
                              onUpdateTask(task.id, {
                                status: task.status === "completed" ? "pending" : "completed",
                              })
                            }
                            className="text-slate-500 hover:text-amber-500 transition-colors cursor-pointer"
                          >
                            {task.status === "completed" ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-400/10" />
                            ) : (
                              <Circle className="w-5 h-5" />
                            )}
                          </button>
                        </td>
                        <td className="py-4 pl-2 max-w-xs pr-4">
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold ${task.status === 'completed' ? 'line-through text-slate-500' : 'text-white'}`}>
                              {task.title}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400">
                              {task.category}
                            </span>
                          </div>
                          {task.description && (
                            <p className="text-xs text-slate-500 mt-1 truncate">{task.description}</p>
                          )}
                          
                          {/* Subtask Mini Progress Bar */}
                          {totalSubtasks > 0 && (
                            <div className="mt-2.5">
                              <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                                <span>Milestones: {completedSubtasks}/{totalSubtasks} ({subtaskPercent}%)</span>
                              </div>
                              <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                                <div 
                                  className="bg-emerald-500 h-full transition-all" 
                                  style={{ width: `${subtaskPercent}%` }}
                                ></div>
                              </div>
                            </div>
                          )}

                          {/* AI Priority Note Banner */}
                          {task.aiNotes && task.status === "pending" && (
                            <div className="mt-2 text-[11px] bg-amber-500/5 border border-amber-500/20 p-2 rounded-lg text-amber-300 flex items-start gap-1.5 leading-relaxed">
                              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                              <span>{task.aiNotes}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className={`text-xs ${isOverdue ? 'text-rose-500 font-bold' : isUrgent ? 'text-amber-400 font-bold' : 'text-slate-400'}`}>
                              {deadlineDate.toLocaleDateString()} {deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500">
                              {isOverdue ? (
                                <span className="text-rose-500 font-semibold">Overdue</span>
                              ) : isUrgent ? (
                                <span className="text-amber-400 font-bold">Expiring Soon!</span>
                              ) : (
                                <span>{Math.ceil(hoursRemaining / 24)} days left</span>
                              )}

                              {/* Registered Alarm Mode badge */}
                              {task.alarmType && task.alarmType !== "none" && (
                                <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-mono uppercase font-bold border ${
                                  task.alarmType === "ringing" 
                                    ? "bg-rose-500/10 border-rose-500/20 text-rose-400" 
                                    : task.alarmType === "vibration" 
                                    ? "bg-blue-500/10 border-blue-500/20 text-blue-400" 
                                    : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                                }`}>
                                  ⏰ {task.alarmType}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-bold border ${
                            task.priority === 'high' 
                              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' 
                              : task.priority === 'medium'
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          }`}>
                            {task.priority.toUpperCase()}
                            {task.urgencyScore !== undefined && task.status === 'pending' && (
                              <span className="text-[10px] font-mono text-slate-400">({task.urgencyScore})</span>
                            )}
                          </span>
                        </td>
                        <td className="py-4">
                          <div className="text-slate-400 text-xs">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-500" />
                              <span>{task.timeSpent}/{task.estimatedHours}h</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {task.status === "pending" && (
                              <>
                                {/* Log Time Button */}
                                <button
                                  id={`btn-log-time-${task.id}`}
                                  title="Log 1 Hour Focus Work"
                                  onClick={() => incrementTime(task)}
                                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                                >
                                  <Clock className="w-4 h-4" />
                                </button>

                                {/* AI Breakdown Button */}
                                <button
                                  id={`btn-breakdown-${task.id}`}
                                  title="Trigger AI Breakdown"
                                  onClick={() => runBreakdown(task.id)}
                                  disabled={loadingBreakdown !== null}
                                  className="p-1.5 rounded-lg bg-slate-800 text-amber-400 hover:bg-slate-700 cursor-pointer disabled:opacity-50"
                                >
                                  {loadingBreakdown === task.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                                  ) : (
                                    <BrainCircuit className="w-4 h-4" />
                                  )}
                                </button>

                                {/* Emergency Rescue Button for High/Medium Priority */}
                                <button
                                  id={`btn-rescue-${task.id}`}
                                  title="Emergency Rescue Plan"
                                  onClick={() => triggerRescue(task)}
                                  className="p-1.5 rounded-lg bg-rose-950 border border-rose-900 text-rose-400 hover:bg-rose-900 cursor-pointer"
                                >
                                  <Flame className="w-4 h-4" />
                                </button>
                              </>
                            )}

                            {/* Subtask interactive manager inline (only show if subtasks present) */}
                            {totalSubtasks > 0 && task.status === "pending" && (
                              <button
                                id={`btn-expand-sub-${task.id}`}
                                onClick={() => {
                                  // toggle expansion or select task detail
                                  onUpdateTask(task.id, {
                                    subtasks: task.subtasks.map(s => ({...s})) // retrigger state
                                  });
                                }}
                                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            )}

                            {/* Delete Button */}
                            <button
                              id={`btn-delete-${task.id}`}
                              onClick={() => onDeleteTask(task.id)}
                              className="p-1.5 rounded-lg bg-slate-800 text-slate-500 hover:text-rose-500 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
        </div>

        {/* Subtask Breakdown expansion box if subtasks exist */}
        {tasks.filter(t => t.subtasks.length > 0 && t.status === 'pending').map((task) => (
          <div key={`sub-list-${task.id}`} className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5">
            <h4 className="font-sans font-bold text-white text-sm flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Subtask Checklist: {task.title}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {task.subtasks.map((sub) => (
                <div 
                  key={sub.id} 
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    sub.completed 
                      ? 'bg-slate-950/40 border-slate-800 text-slate-500' 
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <button
                    id={`btn-toggle-sub-${task.id}-${sub.id}`}
                    onClick={() => {
                      const updatedSubtasks = task.subtasks.map((s) =>
                        s.id === sub.id ? { ...s, completed: !s.completed } : s
                      );
                      onUpdateTask(task.id, { subtasks: updatedSubtasks });
                    }}
                    className="cursor-pointer"
                  >
                    {sub.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-400/10" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-500" />
                    )}
                  </button>
                  <span className={`text-xs ${sub.completed ? 'line-through' : ''}`}>
                    {sub.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Column - ColSpan 1 */}
      <div id="analytics-panel" className="lg:col-span-1 flex flex-col gap-6">
        {/* Priority Recharts */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h4 className="font-sans font-bold text-sm text-white mb-4">Priority Volume</h4>
          {priorityData.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No active priority data</p>
          ) : (
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0b1329", border: "1px solid #1e293b", borderRadius: "8px" }} 
                    itemStyle={{ color: "#fff", fontSize: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 text-xs font-semibold text-slate-400 mt-2">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> High</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Med</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Low</span>
              </div>
            </div>
          )}
        </div>

        {/* Category Breakdown Recharts */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h4 className="font-sans font-bold text-sm text-white mb-4">Category Workload</h4>
          {categoryCounts.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No workload categorization</p>
          ) : (
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryCounts}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0b1329", border: "1px solid #1e293b", borderRadius: "8px" }}
                    itemStyle={{ color: "#fff", fontSize: "12px" }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {categoryCounts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Proactive AI Tip Banner */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 bg-gradient-to-tr from-amber-500/5 to-rose-600/5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4.5 h-4.5 text-amber-400" />
            <h4 className="font-sans font-bold text-sm text-white">AI Health Suggestion</h4>
          </div>
          <p className="font-sans text-xs text-slate-400 leading-relaxed">
            {completionRate > 50 
              ? "Excellent performance today! Keep the flow going, and schedule a small break to prevent fatigue."
              : "Let's focus on finishing your high-urgency tasks first. Breaking them into subtasks is proven to minimize initiation anxiety."}
          </p>
        </div>
      </div>

      {/* --- Modals and Overlays --- */}

      {/* Add Task Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
          >
            {/* Header: Sticky at the top */}
            <div className="border-b border-slate-800 p-5 flex items-center justify-between flex-shrink-0 bg-slate-900">
              <h3 className="font-sans font-bold text-white text-lg animate-pulse bg-gradient-to-r from-amber-400 to-rose-400 bg-clip-text text-transparent">Create New Task Target</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-white font-mono text-lg cursor-pointer transition-colors p-1">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-grow overflow-hidden">
              {/* Scrollable midsection for fields */}
              <div className="p-6 overflow-y-auto flex flex-col gap-4 flex-grow custom-scrollbar">
                <div className="flex flex-col gap-1.5">
                  <label className="font-sans font-semibold text-xs text-slate-400">Task Title *</label>
                  <input 
                    type="text" 
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Finish PPT slide deck"
                    className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-sans font-semibold text-xs text-slate-400">Description</label>
                  <textarea 
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Provide context or constraints to help Gemini plan..."
                    className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white h-20 resize-none focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-sans font-semibold text-xs text-slate-400">Category</label>
                    <select 
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      <option value="Development">Development</option>
                      <option value="Design">Design</option>
                      <option value="Study">Study</option>
                      <option value="Writing">Writing</option>
                      <option value="General">General</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-sans font-semibold text-xs text-slate-400">Estimated Hours</label>
                    <input 
                      type="number" 
                      min="1"
                      max="100"
                      value={newHours}
                      onChange={(e) => setNewHours(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Custom Split Friendly Date & Alert Configuration Section */}
                  <div className="md:col-span-2 flex flex-col gap-3 p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                    <span className="font-mono text-[10px] uppercase font-bold text-amber-500 tracking-wider">Date, Time & Alert Configuration</span>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Date Picker Input */}
                      <div className="flex flex-col gap-1.5">
                        <label className="font-sans font-semibold text-xs text-slate-400">1. Target Date *</label>
                        <input 
                          type="date" 
                          required
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                        />
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          <button
                            type="button"
                            onClick={() => addDaysToSelected(1)}
                            className="text-[10px] px-2 py-1 rounded bg-amber-950/40 border border-amber-900/40 text-amber-300 hover:border-amber-500 hover:text-amber-200 transition-all cursor-pointer font-mono font-bold flex items-center gap-1"
                          >
                            <span>+1 Day</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => addDaysToSelected(-1)}
                            className="text-[10px] px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200 transition-all cursor-pointer font-mono font-bold flex items-center gap-1"
                          >
                            <span>-1 Day</span>
                          </button>
                          <button
                            type="button"
                            onClick={resetDateToTomorrow}
                            className="text-[10px] px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:border-amber-500 hover:text-amber-300 transition-all cursor-pointer font-sans"
                          >
                            Reset (Tomorrow)
                          </button>
                        </div>
                      </div>

                      {/* Time Selector Indicator Button */}
                      <div className="flex flex-col gap-1.5">
                        <label className="font-sans font-semibold text-xs text-slate-400">2. Target Time *</label>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white flex justify-between items-center">
                            <span className="font-mono text-amber-400 font-bold">
                              {String(selectedHour).padStart(2, "0")}:{String(selectedMinute).padStart(2, "0")} {selectedPeriod}
                            </span>
                            <span className="text-[10px] text-slate-500">Interactive Face</span>
                          </div>
                          {/* AM/PM switcher */}
                          <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-0.5">
                            {(["AM", "PM"] as const).map((period) => (
                              <button
                                type="button"
                                key={period}
                                onClick={() => setSelectedPeriod(period)}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                  selectedPeriod === period 
                                    ? "bg-amber-500/15 border border-amber-500/30 text-amber-400 font-extrabold" 
                                    : "text-slate-400 hover:text-white"
                                }`}
                              >
                                {period}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Circular Interactive Analog-Style Clock Selector */}
                    <div className="mt-2 bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center relative">
                      <div className="flex gap-2 mb-4 bg-slate-900 p-0.5 rounded-lg border border-slate-800 w-full max-w-[240px] justify-center">
                        <button
                          type="button"
                          onClick={() => setTimePickerMode("hours")}
                          className={`flex-1 py-1 text-xs font-sans font-bold rounded-md transition-all cursor-pointer ${
                            timePickerMode === "hours" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
                          }`}
                        >
                          Hours Focus
                        </button>
                        <button
                          type="button"
                          onClick={() => setTimePickerMode("minutes")}
                          className={`flex-1 py-1 text-xs font-sans font-bold rounded-md transition-all cursor-pointer ${
                            timePickerMode === "minutes" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
                          }`}
                        >
                          Minutes Focus
                        </button>
                      </div>

                      {/* Clock Face container */}
                      <div className="w-48 h-48 rounded-full bg-slate-900 border border-slate-800 relative flex items-center justify-center shadow-inner">
                        {/* Central Pin */}
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500 z-20 shadow shadow-amber-500/50" />
                        
                        {/* Rotating Hand line pointer */}
                        <div 
                          className="absolute bottom-1/2 left-1/2 w-0.5 bg-gradient-to-t from-amber-500/30 to-amber-500 origin-bottom"
                          style={{
                            height: "68px",
                            transform: `translate(-50%, 0) rotate(${
                              timePickerMode === "hours" 
                                ? (selectedHour % 12) * 30 
                                : selectedMinute * 6
                            }deg)`,
                            transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
                          }}
                        />

                        {/* Render hour numbers (1 to 12) or minutes (00 to 55 by 5s) inside the circle */}
                        {timePickerMode === "hours" ? (
                          [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((h, i) => {
                            const angleRad = (i * 30 * Math.PI) / 180;
                            const r = 70; // radius in px
                            const x = Math.sin(angleRad) * r;
                            const y = -Math.cos(angleRad) * r;

                            const isSelected = selectedHour === h;
                            return (
                              <button
                                type="button"
                                key={`hour-${h}`}
                                onClick={() => setSelectedHour(h)}
                                className={`absolute w-7 h-7 rounded-full text-xs font-mono font-bold flex items-center justify-center cursor-pointer transition-all ${
                                  isSelected 
                                    ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 scale-110 z-10" 
                                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                }`}
                                style={{
                                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                                  left: "50%",
                                  top: "50%"
                                }}
                              >
                                {h}
                              </button>
                            );
                          })
                        ) : (
                          // Minutes selector by 5s
                          [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m, i) => {
                            const angleRad = (i * 30 * Math.PI) / 180;
                            const r = 70; // radius
                            const x = Math.sin(angleRad) * r;
                            const y = -Math.cos(angleRad) * r;

                            const isSelected = selectedMinute === m;
                            return (
                              <button
                                type="button"
                                key={`minute-${m}`}
                                onClick={() => setSelectedMinute(m)}
                                className={`absolute w-7 h-7 rounded-full text-xs font-mono font-bold flex items-center justify-center cursor-pointer transition-all ${
                                  isSelected 
                                    ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 scale-110 z-10" 
                                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                }`}
                                style={{
                                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                                  left: "50%",
                                  top: "50%"
                                }}
                              >
                                {String(m).padStart(2, "0")}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Set Alarm Preference Segmented Control */}
                    <div className="mt-3 flex flex-col gap-1.5 border-t border-slate-800 pt-3">
                      <div className="flex justify-between items-center">
                        <label className="font-sans font-semibold text-xs text-slate-400 font-sans">3. Alert Preference / Action</label>
                        <span className="text-[9px] font-mono text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded font-bold tracking-widest">REAL-TIME</span>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { id: "none", label: "Mute", icon: BellOff, color: "text-slate-500" },
                          { id: "notification", label: "Notify", icon: Bell, color: "text-amber-500" },
                          { id: "ringing", label: "Ringing", icon: Volume2, color: "text-rose-500" },
                          { id: "vibration", label: "Vibrate", icon: Smartphone, color: "text-blue-500" },
                        ].map((alarm) => {
                          const Icon = alarm.icon;
                          const isSelected = alarmType === alarm.id;
                          return (
                            <button
                              key={alarm.id}
                              type="button"
                              onClick={() => setAlarmType(alarm.id as any)}
                              className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                                isSelected 
                                  ? "bg-amber-500/10 border-amber-500 text-amber-400 scale-[1.02] shadow shadow-amber-500/10" 
                                  : "bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800 hover:text-white"
                              }`}
                            >
                              <Icon className={`w-4 h-4 ${alarm.color}`} />
                              <span className="text-[10px] font-sans font-semibold">{alarm.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Priority Tier field */}
                  <div className="flex flex-col gap-1.5 md:col-span-2 mt-2">
                    <label className="font-sans font-semibold text-xs text-slate-400">4. Priority Tier</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["low", "medium", "high"] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setNewPriority(p)}
                          className={`py-2.5 text-xs font-bold rounded-xl border capitalize cursor-pointer transition-all ${
                            newPriority === p 
                              ? 'bg-amber-500/10 border-amber-500 text-amber-400' 
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Footer: Sticky at the bottom */}
              <div className="flex gap-3 justify-end p-5 border-t border-slate-800 bg-slate-950 flex-shrink-0">
                <button 
                  type="button" 
                  onClick={() => setIsAddOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-sans font-semibold text-sm hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 text-white font-sans font-semibold text-sm hover:opacity-95 transition-all cursor-pointer shadow-lg shadow-amber-500/5"
                >
                  Create Target
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Rescue Protocol Modal */}
      {(isRescueLoading || rescuePlan) && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-950 border border-rose-900 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative"
          >
            {/* Red alert top bar */}
            <div className="bg-rose-950/40 border-b border-rose-900 px-6 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Flame className="w-5 h-5 text-rose-500 animate-pulse" />
                <h3 className="font-sans font-bold text-rose-400 text-lg">AI Rescue Protocol Engaged</h3>
              </div>
              <button 
                onClick={() => {
                  setRescuePlan(null);
                  setRescuingTask(null);
                }} 
                className="text-rose-500 hover:text-white font-mono text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 flex flex-col gap-6 max-h-[80vh] overflow-y-auto">
              {isRescueLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <Loader2 className="w-10 h-10 animate-spin text-rose-500" />
                  <p className="font-mono text-xs text-rose-400 animate-pulse">
                    GENERATING RESCUE PLAN • PREVENTING CRASH...
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-rose-950/20 border border-rose-900/40 p-4 rounded-xl">
                    <span className="font-mono text-[10px] text-rose-500 uppercase font-bold tracking-wider">Critical Target</span>
                    <h4 className="font-sans font-bold text-white text-base mt-1">{rescuingTask?.title}</h4>
                    <p className="font-sans text-xs text-slate-400 mt-2 leading-relaxed">
                      Estimated hours: {rescuingTask?.estimatedHours}h • Due: {rescuingTask && new Date(rescuingTask.deadline).toLocaleString()}
                    </p>
                  </div>

                  {/* Immediate Action step */}
                  <div>
                    <h5 className="font-mono text-[11px] text-amber-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <PlayCircle className="w-4 h-4 text-amber-500" />
                      Step 1: Immediate Micro-Action (Next 5 Mins)
                    </h5>
                    <p className="font-sans text-sm text-white bg-slate-900 border border-slate-800 p-4 rounded-xl leading-relaxed">
                      {rescuePlan?.immediateFirstStep}
                    </p>
                  </div>

                  {/* Time Boxing & Focus strategy */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-mono text-[11px] text-rose-400 font-bold uppercase tracking-wider mb-2">
                        Time-Boxing Strategy
                      </h5>
                      <p className="font-sans text-xs text-slate-300 bg-slate-900 border border-slate-800/80 p-4 rounded-xl h-24 overflow-y-auto leading-relaxed">
                        {rescuePlan?.timeBoxingStrategy}
                      </p>
                    </div>

                    <div>
                      <h5 className="font-mono text-[11px] text-rose-400 font-bold uppercase tracking-wider mb-2">
                        Distraction Shielding Checklist
                      </h5>
                      <p className="font-sans text-xs text-slate-300 bg-slate-900 border border-slate-800/80 p-4 rounded-xl h-24 overflow-y-auto leading-relaxed">
                        {rescuePlan?.distractionShutdown}
                      </p>
                    </div>
                  </div>

                  {/* Encouraging closing */}
                  <div className="border-t border-rose-950 pt-5 text-center">
                    <p className="font-sans text-sm italic text-amber-300 font-medium">
                      "{rescuePlan?.reassuringEncouragement}"
                    </p>
                  </div>

                  <div className="flex justify-end gap-3 mt-4">
                    <button
                      id="btn-close-rescue"
                      onClick={() => {
                        setRescuePlan(null);
                        setRescuingTask(null);
                      }}
                      className="px-6 py-2.5 rounded-xl bg-rose-950 border border-rose-900 text-rose-300 hover:bg-rose-900 font-sans font-semibold text-sm transition-colors cursor-pointer"
                    >
                      Understood, I am on it!
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
