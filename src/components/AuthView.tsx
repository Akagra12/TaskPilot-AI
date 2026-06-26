import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Lock, 
  User, 
  Mail, 
  Key, 
  Sparkles, 
  ArrowRight, 
  Bot, 
  AlertCircle,
  CheckCircle,
  Terminal,
  Zap,
  HelpCircle
} from "lucide-react";

interface AuthViewProps {
  onAuthSuccess: (username: string, profile: any) => void;
}

export default function AuthView({ onAuthSuccess }: AuthViewProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [productivityStyle, setProductivityStyle] = useState("Sprint Finisher");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  
  // Status states
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const url = isLogin ? "/api/auth/login" : "/api/auth/signup";
    const payload = isLogin 
      ? { username, password }
      : { username, password, name, productivityStyle, geminiApiKey };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "An error occurred.");
      }

      if (isLogin) {
        setSuccess("Welcome back! Loading your workspace...");
        setTimeout(() => {
          onAuthSuccess(data.username, data.profile);
        }, 800);
      } else {
        setSuccess("Registration complete! Setting up your AI companion...");
        setTimeout(() => {
          onAuthSuccess(data.username, data.profile);
        }, 1200);
      }
    } catch (err: any) {
      setError(err.message || "Failed to authenticate.");
    } finally {
      setLoading(false);
    }
  };

  const fillGuestLogin = () => {
    setUsername("guest");
    setPassword("123");
    setIsLogin(true);
  };

  return (
    <div id="auth-container" className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 relative overflow-hidden font-sans select-none">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-amber-500/5 blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-rose-500/5 blur-[120px]" />

      {/* Floating Header */}
      <div className="flex items-center gap-2 mb-8 z-10">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
          <Zap className="w-5 h-5 text-white animate-pulse" />
        </div>
        <div className="flex flex-col">
          <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            AIPilot
          </span>
          <span className="text-[10px] font-mono text-amber-500 font-semibold tracking-widest uppercase">
            Productivity Workspace
          </span>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-slate-900/60 border border-slate-900 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative z-10 overflow-hidden"
      >
        {/* Glow indicator at the top border */}
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {isLogin ? "Sign in to Pilot" : "Claim Workspace"}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {isLogin ? "Access your custom prioritized schedule" : "Setup custom profile & AI coach"}
            </p>
          </div>
          <span className="text-[9px] font-mono font-bold text-slate-500 bg-slate-950/80 border border-slate-850 px-2.5 py-1 rounded-full shrink-0">
            HACKATHON v1.2
          </span>
        </div>

        {/* Tab switchers */}
        <div className="grid grid-cols-2 bg-slate-950 border border-slate-850 p-1 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => {
              setIsLogin(true);
              setError("");
              setSuccess("");
            }}
            className={`py-2 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
              isLogin ? "bg-slate-850 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLogin(false);
              setError("");
              setSuccess("");
            }}
            className={`py-2 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
              !isLogin ? "bg-slate-850 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Alert feedback banners */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-rose-950/30 border border-rose-900/50 rounded-xl p-3 mb-5 flex items-start gap-2 text-rose-300 text-xs"
            >
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          {success && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-emerald-950/30 border border-emerald-900/50 rounded-xl p-3 mb-5 flex items-start gap-2 text-emerald-300 text-xs"
            >
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>{success}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-slate-400">Username *</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. hackathon_runner"
                className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

          {!isLogin && (
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-slate-400">Full Name *</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-slate-400">Password *</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

          {/* Registrations Onboarding Details */}
          {!isLogin && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="flex flex-col gap-4 border-t border-slate-850/60 pt-4 mt-2"
            >
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-xs text-slate-400">Productivity Companion Style</label>
                <select
                  value={productivityStyle}
                  onChange={(e) => setProductivityStyle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="Sprint Finisher">Sprint Finisher (High Action, Speedy Milestones)</option>
                  <option value="Deep Work Enthusiast">Deep Work Enthusiast (Calm, Minimalist, Long Blocks)</option>
                  <option value="Mindful Planner">Mindful Planner (Balanced pacing, wellness intervals)</option>
                  <option value="Chaotic Creative Solver">Chaotic Creative Solver (Dynamic alarms, energetic tips)</option>
                </select>
              </div>

              {/* Paste Gemini API key onboarding section */}
              <div className="flex flex-col gap-1.5 p-3.5 rounded-xl bg-slate-950 border border-slate-850">
                <div className="flex justify-between items-center">
                  <label className="font-semibold text-xs text-amber-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Paste Gemini API Key (Optional)
                  </label>
                  <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-[10px] text-slate-400 hover:text-white flex items-center gap-0.5"
                  >
                    Get Key <ArrowRight className="w-2.5 h-2.5" />
                  </a>
                </div>
                <div className="relative mt-1">
                  <span className="absolute left-2.5 top-2.5 text-slate-500">
                    <Key className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="password"
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    placeholder="AIStudio key (AI coach integration)"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <p className="text-[9px] text-slate-500 leading-relaxed mt-1.5">
                  Save your key securely in your personal DB space. It handles active coaching and automated deadline rescue.
                </p>
              </div>
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 to-rose-600 text-white font-semibold text-sm py-3 rounded-xl hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 mt-4 shadow-lg shadow-amber-500/10 disabled:opacity-50"
          >
            {loading ? "Syncing..." : isLogin ? "Activate Pilot Engine" : "Register & Start Flying"}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {isLogin && (
          <div className="mt-6 pt-5 border-t border-slate-850/50 flex flex-col gap-3 text-center">
            <span className="text-[10px] text-slate-500">
              Want a quick evaluation ride? Click below to load the default sandbox space
            </span>
            <button
              type="button"
              onClick={fillGuestLogin}
              className="text-xs bg-slate-950 hover:bg-slate-900 border border-slate-850/80 hover:border-amber-500/50 text-slate-300 font-mono py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Terminal className="w-3.5 h-3.5 text-amber-500" />
              Quick Sandbox Sign In (guest / 123)
            </button>
          </div>
        )}
      </motion.div>

      {/* Multi-user live slots indicator badge */}
      <div className="mt-6 flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/40 border border-slate-900/60 rounded-full font-mono text-[10px] text-slate-500 z-10">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>HACKATHON MULTI-USER DB ENABLED (MAX 123 ACTIVE SLOTS)</span>
      </div>
    </div>
  );
}
