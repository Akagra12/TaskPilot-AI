import { useState, useRef, useEffect } from "react";
import { ChatMessage, Profile } from "../types";
import { Sparkles, Send, Trash2, Loader2, PlayCircle, Bot, User, BrainCircuit } from "lucide-react";
import { motion } from "motion/react";

interface CoachViewProps {
  profile: Profile;
}

export default function CoachView({ profile }: CoachViewProps) {
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Preset suggestion chips to speed up interactions during a demo or review
  const suggestions = [
    "Give me a 5-minute procrastination buster.",
    "Help me schedule work blocks.",
    "I'm feeling overwhelmed by my high priority tasks.",
    "How do I apply the Pomodoro technique here?"
  ];

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

  // Fetch history on mount
  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetchWithAuth("/api/ai/coach");
        if (res.ok) {
          const data = await res.json();
          setHistory(data);
        }
      } catch (err) {
        console.error("Error loading chat history:", err);
      }
    }
    loadHistory();
  }, []);

  // Auto scroll to bottom on message updates
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;
    
    // Add user message locally for responsive feedback
    const userMsg: ChatMessage = {
      role: "user",
      text: textToSend,
      timestamp: new Date().toISOString()
    };
    
    setHistory((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetchWithAuth("/api/ai/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend })
      });
      
      if (res.ok) {
        const data = await res.json();
        setHistory(data.chatHistory);
      } else {
        const errorData = await res.json();
        // Friendly fallback error
        setHistory((prev) => [
          ...prev,
          {
            role: "model",
            text: `Coach Connection Offline: ${errorData.error || "Please verify your Gemini API Key in Settings > Secrets."}`,
            timestamp: new Date().toISOString()
          }
        ]);
      }
    } catch (err: any) {
      console.error(err);
      setHistory((prev) => [
        ...prev,
        {
          role: "model",
          text: "Unable to establish coach communication. Please verify server connection and API Key.",
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm("Are you sure you want to reset your coaching chat history?")) {
      setIsLoading(true);
      try {
        const res = await fetchWithAuth("/api/ai/coach", { method: "DELETE" });
        if (res.ok) {
          const data = await res.json();
          setHistory(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div id="coach-root" className="max-w-4xl mx-auto flex flex-col h-[75vh] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Coach top header banner */}
      <div id="coach-banner" className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="font-sans font-bold text-white text-sm">AI Productivity Coach</h2>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Gemini Powered
            </span>
          </div>
        </div>
        <button
          id="btn-clear-coach"
          onClick={handleClearHistory}
          title="Clear Conversation History"
          className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Messages area */}
      <div id="coach-messages" ref={scrollRef} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-slate-950/20">
        {history.map((msg, idx) => {
          const isModel = msg.role === "model";
          return (
            <motion.div
              key={`msg-${idx}-${msg.timestamp}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 max-w-xl ${isModel ? "self-start" : "self-end flex-row-reverse"}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${
                isModel 
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-400" 
                  : "bg-slate-850 border-slate-700 text-slate-300"
              }`}>
                {isModel ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              <div className={`p-4 rounded-2xl text-sm leading-relaxed border ${
                isModel
                  ? "bg-slate-900 border-slate-800/80 text-slate-200"
                  : "bg-slate-800 border-slate-750 text-white"
              }`}>
                <p className="whitespace-pre-line">{msg.text}</p>
                <span className="text-[9px] text-slate-500 font-mono mt-2 block text-right">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </motion.div>
          );
        })}
        {isLoading && (
          <div className="flex gap-3 self-start items-center">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-2xl text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              <span>COACH IS ANALYZING DEADLINES & FOCUS FLOWS...</span>
            </div>
          </div>
        )}
      </div>

      {/* Preset chip suggestion shelf */}
      {history.length <= 1 && (
        <div id="coach-chips" className="px-6 py-3 bg-slate-950/40 border-t border-slate-800/50 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => handleSendMessage(s)}
              className="text-xs font-sans px-3 py-1.5 rounded-full bg-slate-850 border border-slate-800 text-slate-400 hover:border-amber-500/40 hover:text-amber-300 transition-all cursor-pointer"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input zone */}
      <div id="coach-input-shelf" className="p-4 bg-slate-950 border-t border-slate-800 flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSendMessage(input);
          }}
          disabled={isLoading}
          placeholder="Ask your coach anything..."
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors disabled:opacity-50"
        />
        <button
          id="btn-send-coach"
          onClick={() => handleSendMessage(input)}
          disabled={isLoading || !input.trim()}
          className="px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 text-white font-semibold shadow-lg hover:opacity-95 transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
