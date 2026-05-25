# SignalFlow AI 🔍
> Procurement Fraud Incident Orchestration Platform — UiPath AgentHack Track 2

![SignalFlow AI Mission Control](https://img.shields.io/badge/UiPath-AgentHack_2026-orange) ![FastAPI](https://img.shields.io/badge/FastAPI-0.136-green) ![Next.js](https://img.shields.io/badge/Next.js-16-black) ![Gemini](https://img.shields.io/badge/Gemini-2.5_Flash-blue)

## 🎯 Overview

SignalFlow AI is an **enterprise-grade procurement fraud detection and incident orchestration platform** built on UiPath Maestro. It coordinates 4 AI agents through a BPMN workflow, maintains full audit visibility, and keeps humans in the loop for high-risk decisions.

**Core thesis:** Stable orchestration + explainable AI + human-in-the-loop > complex but fragile AI systems.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                   MISSION CONTROL UI                 │
│              Next.js + Tailwind + Framer Motion      │
└──────────────────────┬──────────────────────────────┘
                       │ REST API
┌──────────────────────▼──────────────────────────────┐
│                   FastAPI Backend                    │
│         4 AI Agents + UiPath Maestro Trigger         │
└──────┬───────────────┬──────────────────┬───────────┘
       │               │                  │
┌──────▼──────┐ ┌──────▼──────┐ ┌────────▼────────┐
│   Supabase  │ │ Gemini 2.5  │ │  UiPath Maestro │
│  Database   │ │  + Groq LLM │ │  BPMN Orchestra │
└─────────────┘ └─────────────┘ └─────────────────┘
```

---

## 🤖 4 Core Agents

| Agent | Role | Output |
|-------|------|--------|
| **Ingestion Agent** | Validates incoming data structure | Pass/Fail with error details |
| **Context Agent** | Checks vendor history in database | Historical risk profile |
| **Risk Agent** | Calculates risk score + AI reasoning | Score 0-100, flags, Gemini/Groq analysis |
| **Reporting Agent** | Generates audit trail, saves to DB | Immutable audit record |

### Risk Scoring Logic
- Amount > Rp 1 billion → +50 points
- Amount > Rp 500 million → +30 points  
- Suspicious vendor name → +30 points
- Missing invoice ID → +20 points
- **Score ≥ 80 → CRITICAL → Human Override Required**

---

## 🔄 BPMN Workflow (UiPath Maestro)

```
Incident Data In
      │
      ▼
[Ingestion Agent] ──Invalid──► End: Data Rejected
      │
    Valid
      │
      ▼
[Context Agent] ── checks vendor history
      │
      ▼
[Risk Agent] ── Gemini/Groq AI reasoning
      │
      ▼
  Risk Score ≥ 80?
   │           │
  YES          NO
   │           │
   ▼           ▼
[Human      [Reporting Agent]
 Override]   Auto Approved
   │
   ▼
Approve/Reject
   │
   ▼
[Reporting Agent]
 Audit Trail Saved
```

Every `/analyze` call triggers a **UiPath Maestro Job** — visible in Orchestrator dashboard with full state tracking.

---

## ✨ Key Features

### 🎯 Mission Control Dashboard
- Real-time incident feed with auto-refresh (5s)
- Color-coded risk levels (Critical/High/Medium/Low)
- Cinematic dark tactical UI

### 🧠 Explainable AI (Threat Matrix)
- Per-factor risk breakdown with progress bars
- Vendor Name Anomaly, Amount Analysis, Invoice Verification
- Dual LLM: Gemini 2.5 Flash → Groq fallback

### ⚡ Human-in-the-Loop Override
- CRITICAL incidents automatically paused for operator review
- Full reasoning chain visible before decision
- Operator notes recorded in immutable audit trail

### 📋 Immutable Audit Log
- Every action timestamped and logged
- Terminal-style activity stream
- Compliance-ready for enterprise use

### 🔒 Bulk Action Safety Lock
- One-click "Approve All Low-Risk" for efficiency
- High-risk incidents blocked from bulk actions
- Warning system prevents accidental approvals

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Orchestration | UiPath Maestro (BPMN) + Orchestrator API |
| Frontend | Next.js 16, Tailwind CSS, Framer Motion |
| Backend | FastAPI (Python) |
| Database | Supabase (PostgreSQL) |
| AI Primary | Google Gemini 2.5 Flash Lite |
| AI Fallback | Groq (LLaMA 3.1 8B) |
| Deployment | Vercel (frontend), Railway (backend) |

---

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- UiPath Automation Cloud account
- Supabase project
- Gemini API key + Groq API key

### Backend Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -r requirements.txt

# Copy and fill environment variables
cp .env.example .env

# Run database migration
# Execute in Supabase SQL Editor:
# CREATE TABLE incidents (...)
# ALTER TABLE incidents ADD COLUMN operator_note TEXT DEFAULT '';
# ALTER TABLE incidents ADD COLUMN ai_reasoning TEXT DEFAULT '';
# ALTER TABLE incidents DISABLE ROW LEVEL SECURITY;

uvicorn main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Environment Variables

```env
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=your-anon-key

# UiPath Maestro
UIPATH_TENANT_URL=https://staging.uipath.com/hackathon26_123/DefaultTenant
UIPATH_CLIENT_ID=your-client-id
UIPATH_CLIENT_SECRET=your-client-secret
UIPATH_RELEASE_KEY=your-release-key
UIPATH_FOLDER_ID=your-folder-id

# AI/LLM
GEMINI_API_KEY=your-gemini-key
GROQ_API_KEY=your-groq-key
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Service health check |
| POST | `/analyze` | Full 4-agent pipeline + Maestro trigger |
| GET | `/incidents` | List all incidents |
| GET | `/incidents/{id}` | Get single incident |
| POST | `/decision` | Human approve/reject |
| GET | `/context/{vendor}` | Vendor history lookup |
| POST | `/ingest` | Ingestion agent only |
| POST | `/assess-risk` | Risk agent only |
| GET | `/test-uipath` | UiPath connection test |
| GET | `/uipath-processes` | List Maestro processes |
| POST | `/trigger-maestro` | Manual Maestro trigger |

---

## 🏆 Hackathon Track

**UiPath AgentHack 2026 — Track 2: Agentic Automation with UiPath Maestro**

### Judging Criteria Met

| Criteria | Implementation |
|----------|---------------|
| **Business Impact** | Procurement fraud is a $4.7T global problem. SignalFlow AI provides enterprise-grade detection with audit compliance |
| **Platform Usage** | UiPath Maestro BPMN orchestration + Orchestrator API integration. Every incident triggers a Maestro job |
| **Technical Execution** | Full observability, exception handling (Gemini → Groq fallback), audit trail, human-in-the-loop |
| **Creativity** | Cinematic Mission Control UX, Threat Matrix explainable AI, dual LLM resilience |
| **Bonus** | Coded agents (Python SDK), external LLM integration |

---

## 👨‍💻 Built By

**M. Rifki Haipal** ([@quiiplle](https://github.com/einzeinn))  
AI Engineer & Indie Builder — Jakarta, Indonesia

---

## 📄 License

MIT License — Built for UiPath AgentHack 2026