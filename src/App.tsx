import { useState, useEffect } from "react";
import { Task, Profile, DailyPlan, RescuePlan } from "./types";
import LandingView from "./components/LandingView";
import DashboardView from "./components/DashboardView";
import PlannerView from "./components/PlannerView";
import CoachView from "./components/CoachView";
import ProfileSettingsView from "./components/ProfileSettingsView";
import { 
  Zap, ListTodo, Calendar, Bot, User, ShieldAlert, Sparkles, Award
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"landing" | "dashboard" | "planner" | "coach" | "settings">("landing");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [profile, setProfile] = useState<Profile>({
    name: "Developer",
    productivityStyle: "Sprint Finisher",
    focusGoal: "Conquer my goals with deep focus, high quality execution, and optimized task prioritization."
  });

  // Single default active user session bypassing login/signup screens
  const [currentUser] = useState<string>("default");

  // Authenticated fetch helper injecting x-user-username header
  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const headers = {
      ...(options.headers || {}),
      "x-user-username": "default"
    } as any;
    
    return fetch(url, {
      ...options,
      headers
    });
  };

  const handleUpdateProfileLocal = (userProfile: Profile) => {
    setProfile(userProfile);
  };
  
  // Active Alarm State
  const [activeAlert, setActiveAlert] = useState<Task | null>(null);

  // Sticky key missing notifier
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [apiErrorMessage, setApiErrorMessage] = useState("");

  // Play a self-contained premium synthesized ring alarm using Web Audio API
  const playRingingAlarm = () => {
    if (typeof window === "undefined") return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    try {
      const ctx = new AudioContextClass();
      let t = ctx.currentTime;
      // Play 6 successive high-pitched high-attention pulse beeps
      for (let i = 0; i < 6; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, t + i * 0.4); 
        osc.frequency.setValueAtTime(1200, t + i * 0.4 + 0.1);
        
        gain.gain.setValueAtTime(0, t + i * 0.4);
        gain.gain.linearRampToValueAtTime(0.4, t + i * 0.4 + 0.05);
        gain.gain.linearRampToValueAtTime(0, t + i * 0.4 + 0.25);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t + i * 0.4);
        osc.stop(t + i * 0.4 + 0.3);
      }
    } catch (err) {
      console.warn("AudioContext failing to play alarm chime:", err);
    }
  };

  // Trigger tactile/haptic device vibration
  const triggerVibration = () => {
    if (typeof window !== "undefined" && navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }
  };

  // Load baseline app data
  const loadTasks = async () => {
    if (!currentUser) return;
    try {
      const res = await fetchWithAuth("/api/tasks");
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (e) {
      console.error("Failed to load tasks", e);
    }
  };

  // Request system notification permission and start the deadline ticker
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  // Check deadlines every 4 seconds to trigger alarms
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      tasks.forEach((task) => {
        if (
          task.status === "pending" &&
          task.alarmType &&
          task.alarmType !== "none" &&
          !task.alarmTriggered
        ) {
          const deadlineTime = new Date(task.deadline).getTime();
          if (deadlineTime <= now) {
            // Trigger local view popup
            setActiveAlert(task);

            // System Notification
            if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
              new Notification("🚨 AIPilot DEADLINE REACHED", {
                body: `"${task.title}" is due now! Take proactive action immediately.`,
              });
            }

            // Play Sound
            if (task.alarmType === "ringing") {
              playRingingAlarm();
            }

            // Vibrate Device
            if (task.alarmType === "vibration") {
              triggerVibration();
            }

            // Sync with DB to avoid double trigger
            handleUpdateTask(task.id, { alarmTriggered: true });
          }
        }
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [tasks]);

  const loadProfile = async () => {
    if (!currentUser) return;
    try {
      const res = await fetchWithAuth("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (e) {
      console.error("Failed to load profile", e);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadTasks();
      loadProfile();
    }
  }, [currentUser]);

  // Sync helpers
  const handleAddTask = async (taskData: any) => {
    try {
      const res = await fetchWithAuth("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });
      if (res.ok) {
        await loadTasks();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateTask = async (id: string, updates: any) => {
    try {
      const res = await fetchWithAuth(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        await loadTasks();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      const res = await fetchWithAuth(`/api/tasks/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await loadTasks();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateProfile = async (updates: Partial<Profile>) => {
    try {
      const res = await fetchWithAuth("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // --- AI Triggers ---
  const handleTriggerPrioritize = async () => {
    setApiKeyMissing(false);
    try {
      const res = await fetchWithAuth("/api/ai/prioritize", { method: "POST" });
      if (res.ok) {
        await loadTasks();
      } else {
        const err = await res.json();
        setApiErrorMessage(err.error || "AI service unresponsive.");
        setApiKeyMissing(true);
      }
    } catch (e: any) {
      console.error(e);
      setApiKeyMissing(true);
    }
  };

  const handleTriggerBreakdown = async (taskId: string) => {
    setApiKeyMissing(false);
    try {
      const res = await fetchWithAuth("/api/ai/breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      });
      if (res.ok) {
        await loadTasks();
      } else {
        const err = await res.json();
        setApiErrorMessage(err.error || "AI service unresponsive.");
        setApiKeyMissing(true);
      }
    } catch (e) {
      console.error(e);
      setApiKeyMissing(true);
    }
  };

  const handleTriggerRescue = async (taskId: string): Promise<RescuePlan> => {
    setApiKeyMissing(false);
    try {
      const res = await fetchWithAuth("/api/ai/rescue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      });
      if (res.ok) {
        return await res.json();
      } else {
        const err = await res.json();
        setApiErrorMessage(err.error || "AI service unresponsive.");
        setApiKeyMissing(true);
        throw new Error(err.error);
      }
    } catch (e: any) {
      console.error(e);
      setApiKeyMissing(true);
      throw e;
    }
  };

  const handleGeneratePlan = async (): Promise<DailyPlan> => {
    setApiKeyMissing(false);
    try {
      const res = await fetchWithAuth("/api/ai/daily-plan", { method: "POST" });
      if (res.ok) {
        return await res.json();
      } else {
        const err = await res.json();
        setApiErrorMessage(err.error || "AI service unresponsive.");
        setApiKeyMissing(true);
        throw new Error(err.error);
      }
    } catch (e: any) {
      console.error(e);
      setApiKeyMissing(true);
      throw e;
    }
  };

  // Switch to main dashboard
  const handleLaunchWorkspace = () => {
    setActiveTab("dashboard");
  };

  if (activeTab === "landing") {
    return <LandingView onEnterApp={() => setActiveTab("dashboard")} />;
  }

  return (
    <div id="app-wrapper" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header id="app-header" className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-900 px-6 py-4 flex items-center justify-between">
        <div id="app-logo" className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab("landing")}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/10">
            <Zap className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="font-sans font-extrabold text-base tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            AIPilot
          </span>
        </div>

        {/* Global Nav */}
        <nav id="app-nav" className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button
            id="tab-dashboard"
            onClick={() => setActiveTab("dashboard")}
            className={`px-4 py-2 rounded-lg font-sans font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "dashboard" ? "bg-slate-850 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <ListTodo className="w-3.5 h-3.5 text-amber-500" />
            Dashboard
          </button>
          <button
            id="tab-planner"
            onClick={() => setActiveTab("planner")}
            className={`px-4 py-2 rounded-lg font-sans font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "planner" ? "bg-slate-850 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-amber-500" />
            AI Daily Planner
          </button>
          <button
            id="tab-coach"
            onClick={() => setActiveTab("coach")}
            className={`px-4 py-2 rounded-lg font-sans font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "coach" ? "bg-slate-850 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-amber-500" />
            AI Coach
          </button>
          <button
            id="tab-settings"
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2 rounded-lg font-sans font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "settings" ? "bg-slate-850 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <User className="w-3.5 h-3.5 text-amber-500" />
            Profile Settings
          </button>
        </nav>

        {/* Action badge */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono text-amber-400">
            <Award className="w-3.5 h-3.5 text-amber-500" />
            <span>Companion Workspace</span>
          </div>
        </div>
      </header>

      {/* Persistent Missing Key Alert Banner */}
      {apiKeyMissing && (
        <div id="api-key-alert" className="bg-rose-950/80 border-b border-rose-900 text-rose-300 px-6 py-3 flex items-center justify-between gap-4 text-xs font-semibold">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
            <span>
              <strong>Gemini API Error:</strong> {apiErrorMessage}. To run smart scheduling, prioritizations, breakdowns, and coaching, please provide your key in <strong>Settings (cog icon) &gt; Secrets</strong> pane.
            </span>
          </div>
          <button 
            onClick={() => setApiKeyMissing(false)}
            className="text-rose-400 hover:text-white font-mono font-bold text-sm bg-rose-900/40 px-2 py-0.5 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Workspace Body */}
      <main id="app-main" className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="w-full"
          >
            {activeTab === "dashboard" && (
              <DashboardView
                tasks={tasks}
                profile={profile}
                onAddTask={handleAddTask}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
                onTriggerPrioritize={handleTriggerPrioritize}
                onTriggerBreakdown={handleTriggerBreakdown}
                onTriggerRescue={handleTriggerRescue}
              />
            )}
            {activeTab === "planner" && (
              <PlannerView
                profile={profile}
                onGeneratePlan={handleGeneratePlan}
              />
            )}
            {activeTab === "coach" && (
              <CoachView
                profile={profile}
              />
            )}
            {activeTab === "settings" && (
              <ProfileSettingsView
                profile={profile}
                onUpdateProfile={handleUpdateProfile}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating active alarm trigger modal */}
      <AnimatePresence>
        {activeAlert && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border-2 border-rose-600/80 rounded-2xl max-w-md w-full p-6 text-center shadow-2xl relative overflow-hidden"
            >
              {/* Pulsing alarm glow circle */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-rose-600 to-amber-500 animate-pulse" />
              
              <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-4 animate-bounce text-rose-500">
                <ShieldAlert className="w-8 h-8" />
              </div>

              <span className="font-mono text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider font-bold">
                🚨 Deadline Alarm Active ({activeAlert.alarmType})
              </span>

              <h3 className="font-sans font-bold text-white text-xl mt-4 leading-tight">
                {activeAlert.title}
              </h3>

              <p className="font-sans text-xs text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
                Your high-priority target deadline has been reached! Take immediate action to complete this milestone or engage the Rescue plan.
              </p>

              {activeAlert.category && (
                <div className="mt-3 flex justify-center">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400">
                    Category: {activeAlert.category}
                  </span>
                </div>
              )}

              <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
                <button
                  onClick={() => {
                    setActiveAlert(null);
                    setActiveTab("dashboard");
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 text-white font-sans font-semibold text-xs hover:opacity-95 transition-opacity cursor-pointer"
                >
                  Inspect on Dashboard
                </button>
                <button
                  onClick={() => setActiveAlert(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-sans font-semibold text-xs hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Dismiss Alarm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Subtle Footer */}
      <footer id="app-footer" className="bg-slate-950 border-t border-slate-900 px-6 py-6 text-center text-xs text-slate-500 font-mono">
        © 2026 AIPilot. Designed for extreme focus & optimal execution.
      </footer>
    </div>
  );
}
