import { useState, FormEvent } from "react";
import { Profile } from "../types";
import {
  Zap, User, Lock, Mail, Sparkles, Flame, Eye, EyeOff,
  ArrowRight, Loader2, AlertCircle, CheckCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AuthViewProps {
  initialMode?: "login" | "signup";
  onAuthSuccess: (username: string, profile: Profile) => void;
  onBack: () => void;
}

export default function AuthView({ initialMode = "login", onAuthSuccess, onBack }: AuthViewProps) {
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [productivityStyle, setProductivityStyle] = useState("Sprint Finisher");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const styleDescriptions: Record<string, string> = {
    "Early Bird": "Mornings are your power hours.",
    "Night Owl": "Peak focus under nocturnal quiet.",
    "Sprint Finisher": "Thrives on imminent deadlines.",
    "Deep Focus Enthusiast": "Long, uninterrupted deep work."
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      if (mode === "signup") {
        if (!username.trim() || !password.trim() || !name.trim()) {
          setError("Username, password, and name are required.");
          setIsLoading(false);
          return;
        }

        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: username.trim(),
            password,
            name: name.trim(),
            productivityStyle,
            geminiApiKey: geminiApiKey.trim() || undefined
          })
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Signup failed. Please try again.");
          setIsLoading(false);
          return;
        }

        // Store user in localStorage
        localStorage.setItem("aipilot_user", data.username);
        setSuccess("Account created successfully!");

        setTimeout(() => {
          onAuthSuccess(data.username, data.profile);
        }, 600);

      } else {
        // Login
        if (!username.trim() || !password.trim()) {
          setError("Username and password are required.");
          setIsLoading(false);
          return;
        }

        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: username.trim(),
            password
          })
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Login failed. Check your credentials.");
          setIsLoading(false);
          return;
        }

        localStorage.setItem("aipilot_user", data.username);
        setSuccess("Login successful! Welcome back.");

        setTimeout(() => {
          onAuthSuccess(data.username, data.profile);
        }, 600);
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      setError("Connection failed. Please check your network and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="auth-container" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between border-b border-slate-900">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={onBack}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/10">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-sans font-bold text-xl tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            AIPilot
          </span>
        </div>
        <button
          onClick={onBack}
          className="text-xs font-sans text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          ← Back to Home
        </button>
      </header>

      {/* Main Auth Card */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Glassmorphism card */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            {/* Top gradient bar */}
            <div className="h-1 bg-gradient-to-r from-amber-500 via-rose-500 to-violet-500" />

            {/* Mode Toggle */}
            <div className="p-5 pb-0">
              <div className="bg-slate-950 border border-slate-800 p-1 rounded-xl flex">
                <button
                  type="button"
                  onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-sans font-bold transition-all cursor-pointer ${
                    mode === "login"
                      ? "bg-gradient-to-r from-amber-500/15 to-rose-500/15 text-white border border-amber-500/30"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setMode("signup"); setError(""); setSuccess(""); }}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-sans font-bold transition-all cursor-pointer ${
                    mode === "signup"
                      ? "bg-gradient-to-r from-amber-500/15 to-rose-500/15 text-white border border-amber-500/30"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Create Account
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
              {/* Title */}
              <div className="text-center mb-2">
                <h2 className="font-sans font-extrabold text-xl text-white">
                  {mode === "login" ? "Welcome Back, Pilot" : "Create Your Workspace"}
                </h2>
                <p className="font-sans text-xs text-slate-400 mt-1">
                  {mode === "login"
                    ? "Sign in to continue your productivity session."
                    : "Set up your account to start conquering deadlines."}
                </p>
              </div>

              {/* Error message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 text-xs text-rose-400 bg-rose-950/40 border border-rose-900/40 p-3 rounded-xl"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Success message */}
              <AnimatePresence>
                {success && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-900/40 p-3 rounded-xl"
                  >
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>{success}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Name field — signup only */}
              <AnimatePresence>
                {mode === "signup" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-col gap-1.5"
                  >
                    <label className="font-sans font-semibold text-xs text-slate-400">Display Name *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. John Doe"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Username */}
              <div className="flex flex-col gap-1.5">
                <label className="font-sans font-semibold text-xs text-slate-400">Username *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    autoComplete="username"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="font-sans font-semibold text-xs text-slate-400">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Signup-only fields */}
              <AnimatePresence>
                {mode === "signup" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-col gap-4"
                  >
                    {/* Productivity Style */}
                    <div className="flex flex-col gap-1.5">
                      <label className="font-sans font-semibold text-xs text-slate-400 flex items-center gap-1">
                        <Flame className="w-3 h-3 text-amber-500" />
                        Focus Style
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(styleDescriptions).map(([sty, desc]) => (
                          <button
                            key={sty}
                            type="button"
                            onClick={() => setProductivityStyle(sty)}
                            className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                              productivityStyle === sty
                                ? "bg-amber-500/10 border-amber-500 text-amber-400"
                                : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                            }`}
                          >
                            <span className="font-sans font-bold text-[11px] text-white block">{sty}</span>
                            <span className="text-[10px] text-slate-500 mt-0.5 block leading-snug">{desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Optional Gemini API Key */}
                    <div className="flex flex-col gap-1.5 bg-slate-950 border border-slate-800 p-3 rounded-xl">
                      <div className="flex justify-between items-center">
                        <label className="font-sans font-semibold text-[11px] text-amber-400 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Gemini API Key (Optional)
                        </label>
                        <a
                          href="https://aistudio.google.com/app/apikey"
                          target="_blank"
                          rel="noreferrer"
                          className="text-[9px] text-slate-500 hover:text-white"
                        >
                          Get Key ↗
                        </a>
                      </div>
                      <input
                        type="password"
                        value={geminiApiKey}
                        onChange={(e) => setGeminiApiKey(e.target.value)}
                        placeholder="Paste your key for AI features"
                        className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 font-sans font-bold text-sm text-white shadow-xl shadow-rose-500/15 hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer mt-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                {isLoading
                  ? (mode === "login" ? "Signing in..." : "Creating account...")
                  : (mode === "login" ? "Sign In to Workspace" : "Create Account & Launch")}
              </button>

              {/* Switch mode text */}
              <p className="text-center text-xs text-slate-500 mt-1">
                {mode === "login" ? (
                  <>
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => { setMode("signup"); setError(""); setSuccess(""); }}
                      className="text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                    >
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
                      className="text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                    >
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </form>
          </div>

          {/* Footer note */}
          <p className="text-center text-[10px] text-slate-600 mt-6 font-mono">
            Your data is stored per-account. Each user has isolated tasks, chat history, and settings.
          </p>
        </motion.div>
      </main>
    </div>
  );
}
