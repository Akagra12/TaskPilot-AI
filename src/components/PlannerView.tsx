import { useState, useEffect } from "react";
import { DailyPlan, Profile } from "../types";
import { Calendar, Clock, Sparkles, CheckSquare, Loader2, Play, Smile } from "lucide-react";
import { motion } from "motion/react";

interface PlannerViewProps {
  profile: Profile;
  onGeneratePlan: () => Promise<DailyPlan>;
}

export default function PlannerView({ profile, onGeneratePlan }: PlannerViewProps) {
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const user = localStorage.getItem("aipilot_user");
    const headers = {
      ...(options.headers || {}),
    } as any;
    if (user) {
      headers["x-user-username"] = user;
    }
    return fetch(url, { ...options, headers });
  };

  // Load existing plan on mount
  useEffect(() => {
    async function loadPlan() {
      try {
        const response = await fetchWithAuth("/api/ai/daily-plan");
        if (response.ok) {
          const data = await response.json();
          if (data && data.schedule) {
            setPlan(data);
          }
        }
      } catch (err) {
        console.error("Error loading daily plan:", err);
      }
    }
    loadPlan();
  }, []);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const newPlan = await onGeneratePlan();
      setPlan(newPlan);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="planner-container" className="max-w-4xl mx-auto flex flex-col gap-6">
      {/* Top Banner */}
      <div id="planner-header" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-sans text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-500" />
            AI Daily Focus Agenda
          </h2>
          <p className="font-sans text-xs text-slate-400 mt-1 max-w-xl">
            Let Gemini analyze your style (<span className="text-rose-400">{profile.productivityStyle}</span>) and active targets to synthesize a balanced day-planner structured for output.
          </p>
        </div>
        <button
          id="btn-generate-planner"
          onClick={handleGenerate}
          disabled={isLoading}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 font-sans font-semibold text-sm text-white hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          Synthesize Daily Agenda
        </button>
      </div>

      {isLoading ? (
        <div id="planner-loading" className="bg-slate-900/50 border border-slate-800/80 rounded-2xl py-24 text-center flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-amber-400" />
          <p className="font-mono text-xs text-slate-400 tracking-widest animate-pulse uppercase">
            Gemini compiles workloads • Designing optimal focus blocks...
          </p>
        </div>
      ) : plan ? (
        <div id="planner-agenda-layout" className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Agenda list - ColSpan 2 */}
          <div id="agenda-blocks" className="md:col-span-2 flex flex-col gap-4">
            <h3 className="font-sans font-bold text-sm text-slate-400 uppercase tracking-wider pl-1">
              Today's Schedule • {plan.date}
            </h3>

            <div className="flex flex-col gap-3">
              {plan.schedule.map((item, idx) => {
                const isFocus = item.type === "focus";
                const isBreak = item.type === "break";
                const isReview = item.type === "review";

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                    className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                      isFocus
                        ? "bg-amber-500/5 border-amber-500/20 text-amber-300"
                        : isBreak
                        ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-300"
                        : "bg-violet-500/5 border-violet-500/20 text-violet-300"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Time tag */}
                      <span className="font-mono text-xs font-bold bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 text-slate-400 shrink-0">
                        {item.time}
                      </span>
                      <div>
                        <h4 className="font-sans font-bold text-sm text-white">
                          {item.taskTitle}
                        </h4>
                        <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">
                          Type: {item.type}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span className="font-mono text-xs text-slate-400">{item.duration}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* AI Coaching panel - ColSpan 1 */}
          <div id="agenda-coach-sidebar" className="md:col-span-1 flex flex-col gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4.5 h-4.5 text-amber-400" />
                <h4 className="font-sans font-bold text-sm text-white">AI Strategy for Today</h4>
              </div>

              <div className="text-xs text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-800 leading-relaxed italic">
                "{plan.coachingTip}"
              </div>

              <div className="text-xs text-slate-500 leading-relaxed border-t border-slate-800/80 pt-4 flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                  <Play className="w-3.5 h-3.5" />
                  <span>Execution Rule:</span>
                </div>
                <span>1. Tackle high-urgency focus blocks first.</span>
                <span>2. Honor all break periods to recharge dopamine stores.</span>
                <span>3. Complete review blocks to log progress.</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div id="planner-empty" className="bg-slate-900 border border-slate-800/80 rounded-2xl py-16 text-center text-slate-500 flex flex-col items-center justify-center gap-4">
          <Smile className="w-10 h-10 text-slate-600" />
          <div>
            <p className="font-sans font-bold text-slate-400 text-sm">No agenda generated for today yet.</p>
            <p className="font-sans text-xs text-slate-500 mt-1">Click the button above to generate a custom focus calendar.</p>
          </div>
        </div>
      )}
    </div>
  );
}
