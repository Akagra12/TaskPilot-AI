import { motion } from "motion/react";
import { Zap, ShieldAlert, Award, Calendar, CheckSquare, Sparkles, Code, Terminal, Play, LogIn, UserPlus } from "lucide-react";

interface LandingViewProps {
  onLogin: () => void;
  onSignup: () => void;
}

export default function LandingView({ onLogin, onSignup }: LandingViewProps) {
  return (
    <div id="landing-container" className="min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden">
      {/* Dynamic Header */}
      <header id="landing-header" className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-slate-900">
        <div id="landing-logo" className="flex items-center gap-2">
          <div id="logo-icon" className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/10">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-sans font-bold text-xl tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            AIPilot
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            id="btn-header-login"
            onClick={onLogin}
            className="px-4 py-2 rounded-lg text-xs font-sans font-semibold text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign In
          </button>
          <button
            id="btn-header-signup"
            onClick={onSignup}
            className="px-4 py-2 rounded-lg text-xs font-sans font-semibold text-white bg-gradient-to-r from-amber-500 to-rose-600 hover:opacity-95 transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-rose-500/10"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Sign Up
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section id="landing-hero" className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/5 border border-amber-500/20 text-xs font-medium text-amber-300 mb-8"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          AI-Powered Proactive Productivity Companion
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-sans text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight"
        >
          Conquer Your Deadlines <br />
          Before They <span className="bg-gradient-to-r from-amber-400 via-rose-500 to-rose-600 bg-clip-text text-transparent">Conquer You</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-2xl mx-auto font-sans text-lg text-slate-400 mb-10 leading-relaxed"
        >
          Current reminder apps fail because they are passive. AIPilot is a proactive full-stack partner that analyzes your commitments, auto-prioritizes tasks, breaks down projects into subtasks, and generates emergency "Rescue Plans" to save you.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto"
        >
          <button
            id="btn-hero-signup"
            onClick={onSignup}
            className="flex-1 px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 font-sans font-semibold text-white shadow-xl shadow-rose-500/20 hover:opacity-95 transition-all flex items-center justify-center gap-2 group cursor-pointer"
          >
            Get Started Free
            <Play className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
          <button
            id="btn-hero-login"
            onClick={onLogin}
            className="flex-1 px-8 py-4 rounded-xl bg-slate-900 border border-slate-800 font-sans font-semibold text-slate-300 hover:text-white hover:border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </button>
        </motion.div>
      </section>

      {/* Feature Bento Grid */}
      <section id="landing-features" className="max-w-7xl mx-auto px-6 py-20 border-t border-slate-900">
        <h2 className="font-sans text-3xl font-bold text-center text-white mb-12">
          Engineered to Outperform Passive Reminders
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center mb-6 border border-rose-500/20">
                <ShieldAlert className="w-6 h-6 text-rose-400" />
              </div>
              <h3 className="font-sans font-bold text-xl text-white mb-3">AI Urgency Analyzer</h3>
              <p className="font-sans text-slate-400 text-sm leading-relaxed">
                Calculates a smart urgency score by analyzing remaining time, priority factors, and estimated focus hours required. Updates priority tags on the fly.
              </p>
            </div>
            <div className="mt-6 text-xs font-mono text-rose-500">POWERED BY GEMINI 3.5 FLASH</div>
          </div>

          {/* Card 2 */}
          <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-6 border border-amber-500/20">
                <CheckSquare className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="font-sans font-bold text-xl text-white mb-3">Auto Milestone Breakdown</h3>
              <p className="font-sans text-slate-400 text-sm leading-relaxed">
                Stuck at the beginning of a giant task? Let Gemini dismantle it into a series of actionable, bite-sized micro-subtasks to eliminate freeze state.
              </p>
            </div>
            <div className="mt-6 text-xs font-mono text-amber-500">STRUCTURAL SUBTASK ENGINE</div>
          </div>

          {/* Card 3 */}
          <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center mb-6 border border-violet-500/20">
                <Sparkles className="w-6 h-6 text-violet-400" />
              </div>
              <h3 className="font-sans font-bold text-xl text-white mb-3">Emergency "Rescue Plan"</h3>
              <p className="font-sans text-slate-400 text-sm leading-relaxed">
                Is a critical deadline looming tomorrow? Our specialized Rescue Protocol generates custom hour-by-hour timeboxing and distraction shutdown strategies.
              </p>
            </div>
            <div className="mt-6 text-xs font-mono text-violet-500">ANTI-CRASH INTERVENTION</div>
          </div>
        </div>
      </section>



      {/* Footer */}
      <footer id="landing-footer" className="max-w-7xl mx-auto px-6 py-12 border-t border-slate-900 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-mono text-slate-500">
        <div>© 2026 AIPilot. Designed for absolute focus.</div>
        <div className="flex gap-4">
          <span>Speed: &lt; 2s Generation</span>
          <span>Security: Server-Side API Proxies</span>
        </div>
      </footer>
    </div>
  );
}
