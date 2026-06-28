import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();

const isServerless = process.env.VERCEL === "1" || 
                     process.env.VERCEL === "true" || 
                     !!process.env.NOW_REGION || 
                     !!process.env.AWS_LAMBDA_FUNCTION_VERSION ||
                     !!process.env.LAMBDA_TASK_ROOT;

const DB_PATH = (() => {
  if (isServerless) {
    const tmpDbPath = "/tmp/database.json";
    try {
      const localDbPath = path.join(process.cwd(), "database.json");
      if (!fs.existsSync(tmpDbPath) && fs.existsSync(localDbPath)) {
        fs.copyFileSync(localDbPath, tmpDbPath);
      }
    } catch (err) {
      console.error("Vercel DB copy failed:", err);
    }
    return tmpDbPath;
  }

  try {
    const testPath = path.join(process.cwd(), ".write_test");
    fs.writeFileSync(testPath, "test");
    fs.unlinkSync(testPath);
    return path.join(process.cwd(), "database.json");
  } catch (e) {
    const tmpDir = "/tmp";
    try {
      if (fs.existsSync(tmpDir)) {
        const tmpDbPath = path.join(tmpDir, "database.json");
        if (!fs.existsSync(tmpDbPath)) {
          const localDbPath = path.join(process.cwd(), "database.json");
          if (fs.existsSync(localDbPath)) {
            fs.copyFileSync(localDbPath, tmpDbPath);
          }
        }
        return tmpDbPath;
      }
    } catch (err) {
      console.error("Failed to set up /tmp database fallback:", err);
    }
    return path.join(process.cwd(), "database.json");
  }
})();

const DEBUG_LOG_PATH = isServerless ? "/tmp/server_debug.log" : path.join(process.cwd(), "server_debug.log");

// Express middleware
app.use(express.json());

// Auth header is now set by the frontend after login/signup

// Global logging middleware to file
app.use((req, res, next) => {
  const logMsg = `[${new Date().toISOString()}] ${req.method} ${req.url}\n`;
  try {
    fs.appendFileSync(DEBUG_LOG_PATH, logMsg);
  } catch (e) {}
  next();
});

// Dynamic Gemini AI client helper
function getGeminiClient(userApiKey?: string): GoogleGenAI {
  const apiKey = userApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "" || apiKey === "MY_GEMINI_API_KEY") {
    throw new Error(
      "GEMINI_API_KEY is not configured. Please provide your key in Profile Settings."
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Database initial structure
interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

interface Task {
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

interface DB {
  tasks: Task[];
  profile: {
    name: string;
    productivityStyle: string;
    focusGoal: string;
    geminiApiKey?: string;
  };
  coachChat: {
    role: "user" | "model";
    text: string;
    timestamp: string;
  }[];
  dailyPlan: {
    date: string;
    schedule: {
      id: string;
      time: string;
      taskTitle: string;
      duration: string;
      type: "focus" | "break" | "review";
    }[];
    coachingTip: string;
  } | null;
}

interface UserData {
  username: string;
  passwordHash: string;
  tasks: Task[];
  profile: {
    name: string;
    productivityStyle: string;
    focusGoal: string;
    geminiApiKey?: string;
  };
  coachChat: {
    role: "user" | "model";
    text: string;
    timestamp: string;
  }[];
  dailyPlan: any | null;
}

interface MultiUserDB {
  users: { [username: string]: UserData };
}

// Database helper functions
function readDB(): MultiUserDB {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const db: MultiUserDB = {
        users: {
          "default": {
            username: "default",
            passwordHash: "default",
            tasks: [],
            profile: {
              name: "Developer",
              productivityStyle: "Sprint Finisher",
              focusGoal: "Conquer my goals with deep focus, high quality execution, and optimized task prioritization.",
              geminiApiKey: ""
            },
            coachChat: [
              {
                role: "model",
                text: "Hello! I am your AIPilot Productivity Coach. I'm here to help you navigate your priority targets, break down massive deadlines, and maintain focus. What are we shipping today?",
                timestamp: new Date().toISOString()
              }
            ],
            dailyPlan: null
          }
        }
      };
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
      return db;
    }
    const data = fs.readFileSync(DB_PATH, "utf-8");
    const parsed = JSON.parse(data);

    // Legacy migration: If single user database is present, migrate to multi-user "guest" account
    if (parsed && !parsed.users && parsed.tasks) {
      console.log("Migrating legacy single-user database to multi-user format...");
      const db: MultiUserDB = {
        users: {
          "guest": {
            username: "guest",
            passwordHash: "123",
            tasks: parsed.tasks || [],
            profile: parsed.profile || {
              name: "Developer",
              productivityStyle: "Sprint Finisher",
              focusGoal: "Conquer my goals with deep focus, high quality execution, and optimized task prioritization.",
              geminiApiKey: ""
            },
            coachChat: parsed.coachChat || [
              {
                role: "model",
                text: "Hello! I am your AIPilot Productivity Coach. I'm here to help you navigate your priority targets, break down massive deadlines, and maintain focus. What are we shipping today?",
                timestamp: new Date().toISOString()
              }
            ],
            dailyPlan: parsed.dailyPlan || null
          }
        }
      };
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
      return db;
    }

    if (!parsed || typeof parsed !== "object") {
      return { users: {} };
    }
    if (!parsed.users) {
      parsed.users = {};
    }
    return parsed as MultiUserDB;
  } catch (err) {
    console.error("Error reading database:", err);
    return { users: {} };
  }
}

function writeDB(db: MultiUserDB) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error("Error writing database:", err);
  }
}

function readUserDB(username?: string): DB {
  const targetUsername = (username || "default").toLowerCase().trim();
  const db = readDB();
  let user = db.users[targetUsername];
  if (!user) {
    db.users[targetUsername] = {
      username: targetUsername,
      passwordHash: "default",
      tasks: [],
      profile: {
        name: "Developer",
        productivityStyle: "Sprint Finisher",
        focusGoal: "Conquer my goals with deep focus, high quality execution, and optimized task prioritization.",
        geminiApiKey: ""
      },
      coachChat: [
        {
          role: "model",
          text: "Hello! I am your AIPilot Productivity Coach. I'm here to help you navigate your priority targets, break down massive deadlines, and maintain focus. What are we shipping today?",
          timestamp: new Date().toISOString()
        }
      ],
      dailyPlan: null
    };
    writeDB(db);
    user = db.users[targetUsername];
  }
  return {
    tasks: user.tasks || [],
    profile: user.profile || {
      name: "Developer",
      productivityStyle: "Sprint Finisher",
      focusGoal: "Conquer my goals with deep focus, high quality execution, and optimized task prioritization.",
      geminiApiKey: ""
    },
    coachChat: user.coachChat || [],
    dailyPlan: user.dailyPlan || null
  };
}

function writeUserDB(username: string | undefined, userDB: DB) {
  const targetUsername = (username || "default").toLowerCase().trim();
  const db = readDB();
  if (!db.users[targetUsername]) {
    db.users[targetUsername] = {
      username: targetUsername,
      passwordHash: "default",
      tasks: userDB.tasks || [],
      profile: userDB.profile || {
        name: "Developer",
        productivityStyle: "Sprint Finisher",
        focusGoal: "Conquer my goals with deep focus, high quality execution, and optimized task prioritization.",
        geminiApiKey: ""
      },
      coachChat: userDB.coachChat || [],
      dailyPlan: userDB.dailyPlan || null
    };
  } else {
    db.users[targetUsername].tasks = userDB.tasks;
    db.users[targetUsername].profile = userDB.profile;
    db.users[targetUsername].coachChat = userDB.coachChat;
    db.users[targetUsername].dailyPlan = userDB.dailyPlan;
  }
  writeDB(db);
}

// --- REST API Endpoints ---

app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    env: process.env.NODE_ENV, 
    isServerless,
    dbPath: DB_PATH,
    dbExists: fs.existsSync(DB_PATH)
  });
});

// Auth Endpoints
app.post("/api/auth/signup", (req, res) => {
  try {
    const { username, password, name, productivityStyle, geminiApiKey } = req.body;
    if (!username || !password || !name) {
      return res.status(400).json({ error: "Username, password, and name are required." });
    }

    const db = readDB();
    const lowerUsername = username.toLowerCase().trim();

    if (db.users[lowerUsername]) {
      return res.status(400).json({ error: "Username already exists." });
    }

    // Limit to 123 users for the hackathon
    const userCount = Object.keys(db.users).length;
    if (userCount >= 123) {
      return res.status(400).json({ error: "Hackathon user limit reached. Maximum 123 users allowed." });
    }

    const initialUserDB: DB = {
      tasks: [],
      profile: {
        name,
        productivityStyle: productivityStyle || "Sprint Finisher",
        focusGoal: "Conquer my goals with deep focus, high quality execution, and optimized task prioritization.",
        geminiApiKey: geminiApiKey || ""
      },
      coachChat: [
        {
          role: "model",
          text: `Hello ${name}! I am your AIPilot Productivity Coach. I'm here to help you navigate your priority targets, break down massive deadlines, and maintain focus. What are we shipping today?`,
          timestamp: new Date().toISOString()
        }
      ],
      dailyPlan: null
    };

    db.users[lowerUsername] = {
      username: lowerUsername,
      passwordHash: password,
      tasks: initialUserDB.tasks,
      profile: initialUserDB.profile,
      coachChat: initialUserDB.coachChat,
      dailyPlan: initialUserDB.dailyPlan
    };

    writeDB(db);

    res.status(201).json({ 
      message: "Registration successful!",
      username: lowerUsername,
      profile: initialUserDB.profile
    });
  } catch (err: any) {
    console.error("Signup error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/auth/login", (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required." });
    }

    const db = readDB();
    const lowerUsername = username.toLowerCase().trim();
    const user = db.users[lowerUsername];

    if (!user || user.passwordHash !== password) {
      return res.status(400).json({ error: "Invalid username or password." });
    }

    res.json({
      message: "Login successful!",
      username: lowerUsername,
      profile: user.profile
    });
  } catch (err: any) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Task Management
app.get("/api/tasks", (req, res) => {
  try {
    const username = req.headers["x-user-username"] as string;
    if (!username) return res.status(401).json({ error: "Unauthorized. Please log in." });
    const db = readUserDB(username);
    if (!db) return res.status(401).json({ error: "User session not found." });
    res.json(db.tasks || []);
  } catch (err: any) {
    console.error("Error fetching tasks:", err);
    res.status(500).json({ error: "Failed to fetch tasks", details: err.message, stack: err.stack });
  }
});

app.post("/api/tasks", (req, res) => {
  try {
    const username = req.headers["x-user-username"] as string;
    if (!username) return res.status(401).json({ error: "Unauthorized. Please log in." });
    const db = readUserDB(username);
    if (!db) return res.status(401).json({ error: "User session not found." });

    const { title, description, deadline, priority, estimatedHours, category, alarmType } = req.body || {};
    
    if (!title) {
      return res.status(400).json({ error: "Task title is required." });
    }

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title,
      description: description || "",
      deadline: deadline || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      priority: priority || "medium",
      estimatedHours: Number(estimatedHours) || 1,
      timeSpent: 0,
      status: "pending",
      subtasks: [],
      category: category || "General",
      createdAt: new Date().toISOString(),
      alarmType: alarmType || "none",
      alarmTriggered: false,
    };

    db.tasks.push(newTask);
    writeUserDB(username, db);
    res.status(201).json(newTask);
  } catch (err: any) {
    console.error("Error creating task:", err);
    res.status(500).json({ error: "Failed to create task", details: err.message, stack: err.stack });
  }
});

app.put("/api/tasks/:id", (req, res) => {
  try {
    const username = req.headers["x-user-username"] as string;
    if (!username) return res.status(401).json({ error: "Unauthorized. Please log in." });
    const db = readUserDB(username);
    if (!db) return res.status(401).json({ error: "User session not found." });

    const { id } = req.params;
    const taskIndex = db.tasks.findIndex((t) => t.id === id);

    if (taskIndex === -1) {
      return res.status(404).json({ error: "Task not found." });
    }

    db.tasks[taskIndex] = {
      ...db.tasks[taskIndex],
      ...(req.body || {}),
    };

    writeUserDB(username, db);
    res.json(db.tasks[taskIndex]);
  } catch (err: any) {
    console.error("Error updating task:", err);
    res.status(500).json({ error: "Failed to update task", details: err.message, stack: err.stack });
  }
});

app.delete("/api/tasks/:id", (req, res) => {
  try {
    const username = req.headers["x-user-username"] as string;
    if (!username) return res.status(401).json({ error: "Unauthorized. Please log in." });
    const db = readUserDB(username);
    if (!db) return res.status(401).json({ error: "User session not found." });

    const { id } = req.params;
    const taskIndex = db.tasks.findIndex((t) => t.id === id);

    if (taskIndex === -1) {
      return res.status(404).json({ error: "Task not found." });
    }

    const deleted = db.tasks.splice(taskIndex, 1);
    writeUserDB(username, db);
    res.json(deleted[0]);
  } catch (err: any) {
    console.error("Error deleting task:", err);
    res.status(500).json({ error: "Failed to delete task", details: err.message, stack: err.stack });
  }
});

// Profile Management
app.get("/api/profile", (req, res) => {
  try {
    const username = req.headers["x-user-username"] as string;
    if (!username) return res.status(401).json({ error: "Unauthorized. Please log in." });
    const db = readUserDB(username);
    if (!db) return res.status(401).json({ error: "User session not found." });
    res.json(db.profile);
  } catch (err: any) {
    console.error("Error reading profile:", err);
    res.status(500).json({ error: "Failed to read profile", details: err.message, stack: err.stack });
  }
});

app.put("/api/profile", (req, res) => {
  try {
    const username = req.headers["x-user-username"] as string;
    if (!username) return res.status(401).json({ error: "Unauthorized. Please log in." });
    const db = readUserDB(username);
    if (!db) return res.status(401).json({ error: "User session not found." });

    db.profile = {
      ...db.profile,
      ...(req.body || {}),
    };
    writeUserDB(username, db);
    res.json(db.profile);
  } catch (err: any) {
    console.error("Error updating profile:", err);
    res.status(500).json({ error: "Failed to update profile", details: err.message, stack: err.stack });
  }
});

// --- AI Service Endpoints via Google Gemini ---

// 1. Task Prioritization Analyzer
app.post("/api/ai/prioritize", async (req, res) => {
  try {
    const username = req.headers["x-user-username"] as string;
    if (!username) return res.status(401).json({ error: "Unauthorized. Please log in." });
    const db = readUserDB(username);
    if (!db) return res.status(401).json({ error: "User session not found." });

    const tasks = db.tasks.filter((t) => t.status === "pending");

    if (tasks.length === 0) {
      return res.json({ message: "No pending tasks found to prioritize.", tasks: [] });
    }

    const ai = getGeminiClient(db.profile.geminiApiKey);
    const currentTime = new Date().toISOString();

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `
You are an expert Productivity & Deadline Analyst. Given the user's current tasks, their deadlines, and estimated completion times, calculate a prioritized hierarchy.
Current time: ${currentTime}

Tasks to prioritize:
${JSON.stringify(tasks, null, 2)}

Calculate a calculated "urgencyScore" (0 to 100) for each task based on:
1. Proximity of the deadline.
2. Estimated hours vs remaining hours.
3. Priority tag.

Return a JSON array of tasks, each containing only its ID, a new calculated 'priority' level ("high" | "medium" | "low"), the calculated 'urgencyScore' (number), and a short, highly-actionable 'aiNotes' string explaining why this priority was assigned and a tactical suggestion.

Your response must be STRICTLY valid JSON fitting the response schema.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              priority: { type: Type.STRING, description: "Must be 'high', 'medium', or 'low'" },
              urgencyScore: { type: Type.NUMBER },
              aiNotes: { type: Type.STRING },
            },
            required: ["id", "priority", "urgencyScore", "aiNotes"],
          },
        },
      },
    });

    const results = JSON.parse(response.text?.trim() || "[]");

    // Apply the updates to database tasks
    results.forEach((item: any) => {
      const task = db.tasks.find((t) => t.id === item.id);
      if (task) {
        task.priority = item.priority;
        task.urgencyScore = item.urgencyScore;
        task.aiNotes = item.aiNotes;
      }
    });

    writeUserDB(username, db);
    res.json({ message: "Tasks prioritized successfully.", updatedTasks: db.tasks });
  } catch (error: any) {
    console.error("Prioritize API error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Task Breakdown (Subtask Generator)
app.post("/api/ai/breakdown", async (req, res) => {
  try {
    const username = req.headers["x-user-username"] as string;
    if (!username) return res.status(401).json({ error: "Unauthorized. Please log in." });
    const db = readUserDB(username);
    if (!db) return res.status(401).json({ error: "User session not found." });

    const { taskId } = req.body;
    if (!taskId) {
      return res.status(400).json({ error: "taskId is required in request body" });
    }

    const task = db.tasks.find((t) => t.id === taskId);

    if (!task) {
      return res.status(404).json({ error: "Task not found." });
    }

    const ai = getGeminiClient(db.profile.geminiApiKey);

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `
You are a Project Management AI. Break down the following high-level task into a maximum of 5 distinct, highly actionable milestones/subtasks. 
Ensure each subtask is clearly stated and directly leads to the completion of the main task.

Task Details:
- Title: ${task.title}
- Description: ${task.description}
- Estimated Hours: ${task.estimatedHours}
- Category: ${task.category}

Return a JSON object containing a list of subtasks. Each subtask must have a unique short ID (e.g. "sb-1", "sb-2") and a 'title' (string). Also include a concise AI-generated tip ('proTip') on how to optimize focus for this specific task breakdown.

Return strictly in JSON.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subtasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                },
                required: ["id", "title"],
              },
            },
            proTip: { type: Type.STRING },
          },
          required: ["subtasks", "proTip"],
        },
      },
    });

    const result = JSON.parse(response.text?.trim() || "{}");

    if (result.subtasks && result.subtasks.length > 0) {
      task.subtasks = result.subtasks.map((s: any) => ({
        id: s.id,
        title: s.title,
        completed: false,
      }));
    }
    if (result.proTip) {
      task.aiNotes = (task.aiNotes ? task.aiNotes + "\n\n" : "") + "AI Pro Tip: " + result.proTip;
    }

    writeUserDB(username, db);
    res.json({ message: "Subtasks generated successfully.", task });
  } catch (error: any) {
    console.error("Breakdown API error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 3. AI Daily Planner Generator
app.post("/api/ai/daily-plan", async (req, res) => {
  try {
    const username = req.headers["x-user-username"] as string;
    if (!username) return res.status(401).json({ error: "Unauthorized. Please log in." });
    const db = readUserDB(username);
    if (!db) return res.status(401).json({ error: "User session not found." });

    const tasks = db.tasks.filter((t) => t.status === "pending");
    const profile = db.profile;

    const ai = getGeminiClient(db.profile.geminiApiKey);

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `
You are a highly efficient personal Daily Planner AI Coach. Design a realistic, hourly focus schedule for today based on the user's focus style, goals, and pending tasks.

User Profile:
- Name: ${profile.name}
- Focus Style: ${profile.productivityStyle}
- Daily Focus Goal: ${profile.focusGoal}

Pending Tasks:
${JSON.stringify(tasks, null, 2)}

Create a balanced schedule of up to 6 distinct agenda blocks. Mix core focus blocks (tied directly to user tasks), light breaks (Pomodoro style), and review/planning sessions.
For each schedule item, output:
- 'time': a short string (e.g., "09:00 AM")
- 'taskTitle': what the block is (e.g., "Focus Block: Design Landing Page Mockup" or "Hydration & Breathing Break")
- 'duration': (e.g. "45 mins", "15 mins")
- 'type': must be either "focus", "break", or "review"

Also, provide an personalized AI 'coachingTip' for today to boost motivation and combat procrastination.

Return strictly in JSON matching the specified schema.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            schedule: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  time: { type: Type.STRING },
                  taskTitle: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  type: { type: Type.STRING, description: "Must be 'focus', 'break', or 'review'" },
                },
                required: ["time", "taskTitle", "duration", "type"],
              },
            },
            coachingTip: { type: Type.STRING },
          },
          required: ["schedule", "coachingTip"],
        },
      },
    });

    const result = JSON.parse(response.text?.trim() || "{}");

    const dailyPlan = {
      date: new Date().toLocaleDateString(),
      schedule: (result.schedule || []).map((s: any, idx: number) => ({
        id: `sch-${idx}-${Date.now()}`,
        ...s,
      })),
      coachingTip: result.coachingTip || "Focus on taking small, single steps.",
    };

    db.dailyPlan = dailyPlan;
    writeUserDB(username, db);

    res.json(dailyPlan);
  } catch (error: any) {
    console.error("Daily Plan API error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/ai/daily-plan", (req, res) => {
  const username = req.headers["x-user-username"] as string;
  if (!username) return res.status(401).json({ error: "Unauthorized. Please log in." });
  const db = readUserDB(username);
  if (!db) return res.status(401).json({ error: "User session not found." });
  res.json(db.dailyPlan);
});

// 4. Rescue Plan Generator for a specific near-deadline task
app.post("/api/ai/rescue", async (req, res) => {
  try {
    const username = req.headers["x-user-username"] as string;
    if (!username) return res.status(401).json({ error: "Unauthorized. Please log in." });
    const db = readUserDB(username);
    if (!db) return res.status(401).json({ error: "User session not found." });

    const { taskId } = req.body;
    if (!taskId) {
      return res.status(400).json({ error: "taskId is required" });
    }

    const task = db.tasks.find((t) => t.id === taskId);

    if (!task) {
      return res.status(404).json({ error: "Task not found." });
    }

    const ai = getGeminiClient(db.profile.geminiApiKey);

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `
You are the "Rescue Hero Coach." This user is running out of time and in serious danger of missing their deadline. Create an emergency, high-intensity rescue protocol to ship this task on time.

Task Details:
- Title: ${task.title}
- Description: ${task.description}
- Estimated Hours: ${task.estimatedHours}
- Remaining Hours until deadline: ${Math.max(
        0,
        Math.round((new Date(task.deadline).getTime() - Date.now()) / (1000 * 60 * 60))
      )} hours

Provide a tailored action strategy containing:
1. 'immediateFirstStep': the single micro-action they must take in the next 5 minutes to break the ice.
2. 'timeBoxingStrategy': how to box their hours (e.g. 50/10 Focus Blocks).
3. 'distractionShutdown': what triggers they must shut down right now.
4. 'reassuringEncouragement': a powerful, motivating voice of support.

Return strictly in JSON.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            immediateFirstStep: { type: Type.STRING },
            timeBoxingStrategy: { type: Type.STRING },
            distractionShutdown: { type: Type.STRING },
            reassuringEncouragement: { type: Type.STRING },
          },
          required: [
            "immediateFirstStep",
            "timeBoxingStrategy",
            "distractionShutdown",
            "reassuringEncouragement",
          ],
        },
      },
    });

    const result = JSON.parse(response.text?.trim() || "{}");
    res.json(result);
  } catch (error: any) {
    console.error("Rescue API error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 5. Coach Chat Endpoint
app.post("/api/ai/coach", async (req, res) => {
  try {
    const username = req.headers["x-user-username"] as string;
    if (!username) return res.status(401).json({ error: "Unauthorized. Please log in." });
    const db = readUserDB(username);
    if (!db) return res.status(401).json({ error: "User session not found." });

    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "message is required in request body" });
    }
    
    // Save user message to chat history
    const userMsg = {
      role: "user" as const,
      text: message,
      timestamp: new Date().toISOString(),
    };
    db.coachChat.push(userMsg);

    const ai = getGeminiClient(db.profile.geminiApiKey);

    // Prepare conversation context
    const recentHistory = db.coachChat.slice(-10); // keep last 10 messages for context
    const pendingTasksSummary = db.tasks
      .filter((t) => t.status === "pending")
      .map((t) => `- [${t.priority.toUpperCase()}] ${t.title} (Deadline: ${new Date(t.deadline).toLocaleDateString()})`)
      .join("\n");

    const systemInstruction = `
You are the AIPilot Productivity Coach. You are energetic, empathetic, wise, and hyper-focused on helping the user ship their deliverables.
You combine Pomodoro techniques, high-performance coaching, and anti-procrastination insights.
Always keep responses relatively concise, structured with bullet points where useful, encouraging, and focused on immediate action.
Reference their tasks if relevant.

Current Pending Tasks:
${pendingTasksSummary || "No pending tasks! Good job!"}
`;

    const chatMessages = recentHistory.map((m) => ({
      role: m.role,
      parts: [{ text: m.text }],
    }));

    // Generate response using gemini-3.5-flash
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: chatMessages,
      config: {
        systemInstruction,
      }
    });

    const modelReplyText = response.text || "I'm with you! Let's focus on the next direct action step. What can you write or build in the next 10 minutes?";

    const modelMsg = {
      role: "model" as const,
      text: modelReplyText,
      timestamp: new Date().toISOString(),
    };
    db.coachChat.push(modelMsg);
    
    writeUserDB(username, db);

    res.json({ reply: modelReplyText, chatHistory: db.coachChat });
  } catch (error: any) {
    console.error("Coach chat API error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/ai/coach", (req, res) => {
  const username = req.headers["x-user-username"] as string;
  if (!username) return res.status(401).json({ error: "Unauthorized. Please log in." });
  const db = readUserDB(username);
  if (!db) return res.status(401).json({ error: "User session not found." });
  res.json(db.coachChat);
});

app.delete("/api/ai/coach", (req, res) => {
  const username = req.headers["x-user-username"] as string;
  if (!username) return res.status(401).json({ error: "Unauthorized. Please log in." });
  const db = readUserDB(username);
  if (!db) return res.status(401).json({ error: "User session not found." });

  db.coachChat = [
    {
      role: "model",
      text: "Hello! Chat history cleared. What are we shipping next? I am ready to coach you to completion.",
      timestamp: new Date().toISOString(),
    },
  ];
  writeUserDB(username, db);
  res.json(db.coachChat);
});

// Express error handling middleware to catch unhandled errors
app.use((err: any, req: any, res: any, next: any) => {
  const errMsg = `[${new Date().toISOString()}] ERROR: ${err.message || err}\nSTACK: ${err.stack || ""}\n`;
  try {
    fs.appendFileSync(DEBUG_LOG_PATH, errMsg);
  } catch (e) {}
  if (!res.headersSent) {
    res.status(500).json({ error: "Internal Server Error in Middleware", details: err.message });
  } else {
    next(err);
  }
});

export default app;
