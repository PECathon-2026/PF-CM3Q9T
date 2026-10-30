# PS-001: Autonomous AI Software Development Platform

Welcome to **PS-001**, a professional, fully functional AI-powered autonomous software engineering platform featuring a **cinematic 3D WebGL intro**, modern Linear/Vercel-inspired developer dashboard, real Python agent execution with **Gemini 3.8 Flash**, sandboxed file operations, and real-time pytest test verification.

---

## 🏗️ Architecture

```
                                [ Web Browser (React + Three.js) ]
                                                │
                                                ▼  REST API (localhost:8000)
                                    [ server.py (Starlette ASGI) ]
                                                │
            ┌───────────────────────────────────┼───────────────────────────────────┐
            ▼                                   ▼                                   ▼
    [ 1. Planner Agent ]               [ 2. Developer Agent ]              [ 3. Reviewer Agent ]
Converts prompt to checklist         Proposes code changes              Audits security & PEP 8
            │                                   │                                   │
            └───────────────────────────────────┼───────────────────────────────────┘
                                                ▼
                                    [ Human Approval Gate ]
                                                │ (If Approved)
                                                ▼
                                    [ 4. Tester Agent ]
                               Executes real pytest in workspace/
                                                │
                                                ▼
                                    [ 5. Auto-Repair Loop ]
                               Feeds test failures back up to 3 times
```

---

## 📁 Project Structure

```
PS-001/
├── server.py            # High-performance ASGI server (Starlette + Uvicorn)
├── agents.py            # Planner, Developer, Reviewer, and Tester agent definitions
├── tools.py             # Jailed workspace operations & subprocess test runner
├── main.py              # Preserved command-line CLI interface
├── app.py               # Alternative Streamlit dashboard
├── requirements.txt     # Python backend dependencies
├── .env.example         # Template for your Google Gemini API key
├── .gitignore           # Excludes .env, node_modules, cache files
├── workspace/           # The ONLY folder AI agents are permitted to modify
│   └── hello.py         # Target codebase
├── tests/               # Test suites
│   ├── test_hello.py    # Pytest tests for workspace/hello.py
│   └── test_server.py   # Pytest tests for backend API & security jails
├── static/              # Production compiled web assets (HTML, CSS, JS)
└── frontend/            # Vite + React + Three.js source code
    ├── src/
    │   ├── Intro3D.jsx  # Cinematic 3D particle assembly & AI core
    │   ├── App.jsx      # Modern AI developer dashboard
    │   └── index.css    # Professional dark theme styling
    └── package.json
```

---

## 🚀 Quickstart Guide

### 1. Configure Your Gemini API Key
Make sure your `.env` file exists and contains your Gemini API key:
```env
GEMINI_API_KEY=your_actual_api_key_here
```

### 2. Launch the 3D Web Platform (Recommended)
Run the backend server using the project virtual environment:
```powershell
.\.venv\Scripts\python.exe server.py
```
Open **`http://127.0.0.1:8000`** in your browser.

**What you will experience:**
1. **Cinematic 3D Intro**:
   - Realistic 3D metallic **PS-001** logo assembling from 2,500+ glowing particles.
   - Holographic AI Core pulsing data streams to 4 agent nodes.
   - Cinematic camera dolly-in, reflections, and typography reveal.
   - Visible **"Skip intro"** button (or press `Esc`).
   - Plays once per session (`sessionStorage`), with a "Replay 3D Intro" button in the sidebar anytime.
2. **Main Dashboard**:
   - Enter your software requirement or click quick preset prompts.
   - Watch the **Planner Agent** generate an actionable checklist.
   - Review proposed code with a **colorized visual diff** and **Reviewer security audit**.
   - **Human Approval Gate**: Click **Approve & Write to workspace/** to commit changes.
   - The **Tester Agent** executes verified `pytest` tests in real-time.
   - If tests fail, click **Auto-Repair Attempt (2/3)** to trigger the automated repair loop.

### 3. Launch the Command-Line CLI
The terminal interface remains 100% functional:
```powershell
.\.venv\Scripts\python.exe main.py
```

### 4. Run Pytest Test Suites
Run all tests across the project:
```powershell
.\.venv\Scripts\python.exe -m pytest tests -v
```

---

## 🔒 Security & Reliability Guarantees
- **Sandboxed Workspace**: All file modifications are restricted strictly to `workspace/`. Path traversal attacks (such as `../`) are rejected with `403 Forbidden`.
- **Zero Shell Injection**: User prompts never execute arbitrary shell commands. Pytest is executed using fixed arguments with a 15-second timeout.
- **Server-Side Credentials**: `GEMINI_API_KEY` is loaded in Python only and is never exposed in client bundles or API responses.
- **Resilient 503 Handling**: Exponential backoff automatically handles high-demand Gemini API spikes.
