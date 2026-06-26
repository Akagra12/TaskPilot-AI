# AIPILOT - PROJECT BLUEPRINT
### AI-Powered Proactive Productivity Partner

---

## 1. Problem Understanding
### The Problem
Students, developers, and professionals are constantly under siege by high-stakes deadlines. This leads to **cognitive freeze state**—where the sheer volume or weight of impending deliverables induces severe anxiety, resulting in avoidance and procrastination until it is too late.

### Why Passive Reminder Apps Fail
1. **Lack of Context**: Standard alarms or calendar notifications just tell you *when* a task is due, not *how* to approach it or how much active work is remaining.
2. **Ignorable Prompts**: Passive notifications are easily dismissed or snoozed.
3. **Task Initiation Paralysis**: When a task is massive, users don't know where to start, so the reminder just increases stress without facilitating action.

### How Our AI Solution is Different
AIPilot is a **proactive productivity partner**. Instead of passive alerts, it uses Google Gemini 3.5 to:
- Actively analyze task complexity and calculate relative **urgency scores**.
- Programmatically **dismantle massive tasks** into subtask checklists.
- Design tailored **daily schedules** that balance focus blocks with restorative breaks.
- Deploy an emergency **"Rescue Protocol"** for near-deadline items, offering instant cognitive coaching and distraction-shielding advice.

---

## 2. Unique Solution
### The Vision
AIPilot acts as a dedicated co-pilot. It transforms a list of looming stresses into a structured, step-by-step game plan.
### The Core AI Engine
1. **Urgency Matrix**: Computes priority dynamically based on remaining hours versus estimated effort.
2. **Cognitive Breakdown**: Breaks complex milestones into tiny, low-friction action items to bypass initiation fear.
3. **Adaptive Daily Planner**: Builds custom schedules taking the user's focus style into account.
4. **Rescue Protocol**: A cognitive intervention system that stops procrastination cascades in their tracks.

### Why Judges Will Love It
- **Literal Value**: Tackles a real-world, high-empathy pain point (deadline anxiety) with immediate utility.
- **Deep Google Tech Integration**: Highlights the raw capability of the `GoogleGenAI` SDK (`gemini-3.5-flash`) for structural text extraction and conversational coaching.
- **Flawless Visual Identity**: Built with a custom ambient dark theme, typography pairing (Inter + JetBrains Mono), and fluid animations.

---

## 3. Features
### Must-Have
*   **Urgency Analyzer**: Calculate dynamic urgency scores.
*   **Milestone Breakdown**: Auto-dismantle projects.
*   **AI Daily Planner**: Build hourly focus plans.
*   **Interactive Focus Table**: Track, edit, and log focus hours.
*   **AI Chat Coach**: Context-aware productivity assistant.

### Good-to-Have
*   **Rescue Protocol**: Cognitive intervention for imminent deadlines.
*   **Interactive Subtask Checklist**: Interactive tracking of micro-steps.
*   **Productivity Style Profile**: Profile personalization.

### Future Features
*   **Smart Chrome Extension**: Extract assignments directly from LMS platforms (e.g. Canvas, Blackboard).
*   **Google Calendar Sync**: Auto-block calendars.

---

## 4. User Flow
1.  **Onboarding/Landing**: Discover capabilities and launch the workspace.
2.  **Define Profile**: Input your focus goal and select a productivity style (e.g., Sprint Finisher).
3.  **Create Deliverables**: Input titles, descriptions, categories, and estimates.
4.  **AI Prioritize**: Run dynamic matrix to score urgency.
5.  **Dismantle**: Click "Breakdown" to generate micro-subtasks.
6.  **Schedule**: Generate Today's Focus Agenda.
7.  **Coaching / Rescue**: Consult the coach or activate emergency rescue protocols to stay on track.

---

## 5. Complete System Architecture
- **Frontend**: Single-Page React (Vite, Tailwind, Recharts, Motion).
- **Backend**: Express (NodeJS, TSX).
- **Database**: Durable JSON File Storage (`database.json`) on the server.
- **AI Service**: Google Gemini API via `@google/genai` (Server-side).

---

## 6. Folder Structure
```text
/
├── server.ts                 # Express full-stack entry point
├── database.json             # Durable local state
├── package.json              # App scripts and deps
├── vite.config.ts            # Vite middleware config
├── src/
│   ├── main.tsx              # React mounting root
│   ├── App.tsx               # Primary navigation and state router
│   ├── types.ts              # TypeScript definitions
│   ├── index.css             # Global CSS and Google Fonts
│   └── components/
│       ├── LandingView.tsx   # Visual landing presentation
│       ├── DashboardView.tsx # Stats, task grid, charts, & actions
│       ├── PlannerView.tsx   # AI calendar & coaching tips
│       ├── CoachView.tsx     # Chatbot coach with history
│       └── ProfileSettingsView.tsx # Identity sync config
```

---

## 7. Database Design
Stored in a structured JSON database on the server:
- `tasks`: Task entity collection (id, title, priority, urgencyScore, subtasks, category).
- `profile`: Custom name, focus goal, and productivity style.
- `coachChat`: Chat history for contextual coaching persistence.
- `dailyPlan`: The current daily agenda and coaching tip.

---

## 8. API Design
*   `GET /api/tasks` - Fetch tasks.
*   `POST /api/tasks` - Create task.
*   `PUT /api/tasks/:id` - Update task.
*   `DELETE /api/tasks/:id` - Delete task.
*   `GET /api/profile` / `PUT /api/profile` - Update profile.
*   `POST /api/ai/prioritize` - Trigger AI prioritization.
*   `POST /api/ai/breakdown` - Dismantle task milestones.
*   `POST /api/ai/daily-plan` - Synthesize focus calendar.
*   `POST /api/ai/rescue` - Run emergency rescue plan.
*   `POST /api/ai/coach` - Conversational chatbot.

---

## 9. AI Features
All powered server-side using `gemini-3.5-flash`:
- **Task Prioritization**: Uses Eisenhower urgency matrix with JSON response validation.
- **Task Breakdown**: Dismantles tasks into 5 actionable checkpoints.
- **Daily Planner**: Tailors hourly blocks to the user's style.
- **Rescue Plan**: Emergency micro-steps, distraction shields, and reinforcement.
- **Productivity Coach**: Conversational model backed by current task summaries.

---

## 10. Dashboard Design
- **Top Welcome Panel**: Greets user and summarizes focus profile.
- **Stats Row**: Tasks, urgent alerts, estimated hours remaining, and completion rates.
- **Active Task Table**: Tracks categories, milestones, priority scores, and log focus buttons.
- **Analytics Cards**: Recharts distribution charts.
- **AI Assistant Bar**: Alerts users on urgent deliverables.

---

## 11. UI Pages
- **Landing Page**: Modern hero section with system architecture insights.
- **Dashboard**: Central command view.
- **AI Planner**: Custom hourly calendar blocks.
- **AI Coach**: Immersive chat assistant.
- **Profile Settings**: Synchronize your style.

---

## 12. Color Theme
- **Background**: Slate-950 (deep space/eye-safe dark canvas).
- **Accents**: Amber (focus, priority, warmth) and Rose (urgency, alert).
- **Typography**: "Inter" for general UI and "JetBrains Mono" for code, statistics, and logs.
- **Icons**: Imported cleanly from `lucide-react`.

---

## 13. Complete Tech Stack
- **Frontend**: React 19, Tailwind CSS, Recharts, Motion.
- **Backend**: Express, TSX, Dotenv.
- **AI**: `@google/genai` (SDK).
- **State Storage**: File-based database (`database.json`).

---

## 14. Hackathon Winning Features
1.  **Dynamic Urgency Score**: Urgency calculated with real mathematical ratios.
2.  **Cognitive Crash Prevention**: Rescue protocols addressing immediate panic.
3.  **Profile-Adaptive AI**: Planning changes based on Night Owl or Early Bird settings.
4.  **Live Time-Logging**: Actionable timer logging.
5.  **Micro-Checklist Generating**: Breaking projects into chewable steps.
6.  **Interactive Suggestion Chips**: Rapid chat prompts for high-speed demos.
7.  **No Mock Integrity**: Completely functional backend and DB.
8.  **Pristine typography**: "Inter" and "JetBrains Mono" pairing.
9.  **No-flicker animations**: Clean framer-motion micro-interactions.
10. **Zero-Setup Compatibility**: Highly robust fallbacks if the user's API key is missing.

---

## 15. Google Technologies
- **Gemini API**: Core intelligence model (`gemini-3.5-flash`).
- **Google AI Studio**: Platform where keys are managed and secrets are secure.

---

## 16. Deployment Guide
- App is optimized for continuous deployment in Cloud Run.
- Frontend assets compiled cleanly via `vite build`.
- Server compiled into a CJS bundle (`dist/server.cjs`) to guarantee compatibility.

---

## 17. GitHub Repository Structure
Includes modular documentation, standard installation instructions, and clean structural layers.

---

## 18. Presentation & 3-Minute Demo Flow
- **Minute 1**: Open landing page, explain the cognitive freeze problem, and launch the Workspace.
- **Minute 2**: Create a task, click "Run AI Prioritization" to analyze workload, and "AI Breakdown" to generate milestones.
- **Minute 3**: Generate the "AI Daily Focus Agenda" and show conversational coaching chat.

---

## 19. Judging Strategy Scoring
Scores exceptionally high in **Problem Solving**, **Innovation**, **AI Usage**, **Technical Implementation**, and **Design & Usability**.

---

## 20. Future Scope
Covers mobile overlays, calendar widgets, deep integrations, voice commands, and automated timeline mapping.
