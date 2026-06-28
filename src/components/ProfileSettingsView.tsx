import { useState, FormEvent } from "react";
import { Profile } from "../types";
import { User, Award, Flame, Sparkles, CheckCircle, ShieldAlert } from "lucide-react";
import { motion } from "motion/react";

interface ProfileSettingsViewProps {
  profile: Profile;
  onUpdateProfile: (updates: Partial<Profile>) => Promise<void>;
}

export default function ProfileSettingsView({ profile, onUpdateProfile }: ProfileSettingsViewProps) {
  const [name, setName] = useState(profile.name);
  const [style, setStyle] = useState(profile.productivityStyle);
  const [goal, setGoal] = useState(profile.focusGoal);
  const [geminiApiKey, setGeminiApiKey] = useState(profile.geminiApiKey || "");
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaved(false);
    try {
      await onUpdateProfile({
        name,
        productivityStyle: style,
        focusGoal: goal,
        geminiApiKey,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const styleDescriptions = {
    "Early Bird": "Thrives on ticking off tasks in the quiet mornings, building strong inertia before noon.",
    "Night Owl": "Peak focus occurs under nocturnal quiet, utilizing long contiguous focus blocks.",
    "Sprint Finisher": "Hyper-motivated by imminent deadlines, excels in intensive time-boxed focus runs.",
    "Deep Focus Enthusiast": "Prefers long, mono-focused blocks with absolute sensory shutdown."
  } as Record<string, string>;

  return (
    <div id="settings-container" className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      <div className="border-b border-slate-800 p-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <User className="w-5 h-5 text-amber-500" />
          <h3 className="font-sans font-bold text-white text-lg">Productivity Style Profile</h3>
        </div>
        <span className="text-xs font-mono text-slate-500 uppercase">Profile Settings</span>
      </div>

      <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
        {/* Name input */}
        <div className="flex flex-col gap-1.5">
          <label className="font-sans font-semibold text-xs text-slate-400">Your Identity/Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        {/* Productivity focus Goal */}
        <div className="flex flex-col gap-1.5">
          <label className="font-sans font-semibold text-xs text-slate-400">Core Productivity Focus Goal</label>
          <input
            type="text"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. Complete my high-priority studies on time..."
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
          />
          <span className="text-[11px] text-slate-500 italic mt-0.5">
            Gemini reads this goal to ground your coach responses and daily plan agenda blocks.
          </span>
        </div>

        {/* Custom Gemini API Key */}
        <div className="flex flex-col gap-1.5 bg-slate-950 border border-slate-850 p-4 rounded-xl">
          <div className="flex justify-between items-center">
            <label className="font-sans font-semibold text-xs text-amber-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              Custom Gemini API Key Override
            </label>
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noreferrer"
              className="text-[10px] text-slate-500 hover:text-white flex items-center gap-0.5"
            >
              Get API Key ↗
            </a>
          </div>
          <input
            type="password"
            value={geminiApiKey}
            onChange={(e) => setGeminiApiKey(e.target.value)}
            placeholder="Pasted key override (AI Coach chat & prioritization)"
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 mt-1.5 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors"
          />
          <p className="text-[10px] text-slate-500 leading-relaxed mt-1.5">
            By saving your personal Gemini key here, you override global defaults and unlock limitless high-performance priority analysis and coaching conversations in your workspace sandbox.
          </p>
        </div>

        {/* Focus Style dropdown / selector */}
        <div className="flex flex-col gap-1.5">
          <label className="font-sans font-semibold text-xs text-slate-400">Productivity Focus Style</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1.5">
            {Object.keys(styleDescriptions).map((sty) => (
              <button
                key={sty}
                type="button"
                onClick={() => setStyle(sty)}
                className={`p-4 rounded-xl border text-left flex flex-col gap-1 cursor-pointer transition-all ${
                  style === sty
                    ? "bg-amber-500/10 border-amber-500 text-amber-400"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <span className="font-sans font-bold text-sm text-white flex items-center gap-1.5">
                  {style === sty && <Flame className="w-3.5 h-3.5 text-amber-500" />}
                  {sty}
                </span>
                <span className="text-[11px] text-slate-500 leading-relaxed mt-1">
                  {styleDescriptions[sty]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Alert banners and actions */}
        <div className="border-t border-slate-800/80 pt-6 flex items-center justify-between gap-4">
          <div className="flex-1">
            {saved && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Profile synchronized successfully. Gemini is updated!</span>
              </motion.div>
            )}
          </div>
          <button
            id="btn-save-profile"
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 font-sans font-semibold text-sm text-white hover:opacity-95 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? "Saving..." : "Synchronize Profile"}
          </button>
        </div>
      </form>
    </div>
  );
}
