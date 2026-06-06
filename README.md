SignalFlow AI 🔍
Procurement Fraud Incident Orchestration Platform — UiPath AgentHack Track 2
🎯 Overview
SignalFlow AI is an enterprise-grade procurement fraud detection and incident orchestration platform. It coordinates 4 custom AI agents through a BPMN workflow, maintains full audit visibility, and keeps humans in the loop for high-risk decisions.
Core thesis: Stable orchestration + explainable AI + human-in-the-loop > complex but fragile AI systems.
🤖 UiPath Integration Details (AgentHack Requirement)
UiPath Components Used:
UiPath Orchestrator API: Integrated via our custom backend (uipath_client.py) to fetch available processes and securely trigger automated reporting/remediation tasks.
API Workflows: Used to seamlessly connect the external AI reasoning engine (FastAPI) with UiPath's automation ecosystem.
Agent Type:
Coded Agents: This solution strictly utilizes a custom-built, code-first multi-agent system (Python/FastAPI). The coded agents orchestrate complex AI reasoning chains (Ingestion, Context, Risk, Reporting using Gemini/Groq) and interface directly with UiPath APIs to execute downstream automations.
⚙️ Setup & Evaluation Instructions for Judges
To evaluate SignalFlow AI quickly, you do not need to run the application locally. The system is fully deployed and accessible in the cloud.
1. Access the Live Application:
Frontend UI (Vercel): https://signalflow-ai-gray.vercel.app/
API Engine (Hugging Face): https://quiiplle-signalflow-ai-backend.hf.space
2. How to Test (Live Demo):
Open the Frontend URL.
Input a sample vendor data or invoice into the dashboard to simulate a procurement incident.
Observe the Multi-Agent reasoning chain (Ingestion -> Context -> Risk -> Report) execute in real-time.
Once the risk is assessed, the system will use the UiPath API to securely trigger the assigned automation process.
🏗️ Architecture
┌─────────────────────────────────────────────────────┐
│                   MISSION CONTROL UI                │
│             Next.js + Tailwind + Framer Motion       │
└──────────────────────┬──────────────────────────────┘
                       │ REST API
┌──────────────────────▼──────────────────────────────┐
│                   FastAPI Backend                    │
│         4 AI Agents + UiPath API Trigger             │
└──────┬───────────────┬──────────────────┬───────────┘
       │               │                  │
┌──────▼──────┐ ┌──────▼──────┐ ┌────────▼────────┐
│   Supabase  │ │ Gemini 2.5  │ │  UiPath Orchestrator │
│  Database   │ │  + Groq LLM │ │                 │
└─────────────┘ └─────────────┘ └─────────────────┘


🤖 4 Core Coded Agents


Agent
Role
Output
Ingestion Agent
Validates incoming data structure
Pass/Fail with error details
Context Agent
Checks vendor history in database
Historical risk profile
Risk Agent
Calculates risk score + AI reasoning
Score 0-100, flags, Gemini/Groq analysis
Reporting Agent
Generates audit trail, saves to DB
Immutable audit record

Risk Scoring Logic
Amount > Rp 1 billion → +50 points
Amount > Rp 500 million → +30 points
Suspicious vendor name → +30 points
Missing invoice ID → +20 points
Score ≥ 80 → CRITICAL → Human Override Required
🔄 AI to UiPath Workflow
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
[UiPath Orchestrator API Trigger]


Every /analyze call triggers a UiPath Job — visible in Orchestrator dashboard with full state tracking.
✨ Key Features
🎯 Mission Control Dashboard
Real-time incident feed with auto-refresh (5s)
Color-coded risk levels (Critical/High/Medium/Low)
Cinematic dark tactical UI
🧠 Explainable AI (Threat Matrix)
Per-factor risk breakdown with progress bars
Vendor Name Anomaly, Amount Analysis, Invoice Verification
Dual LLM: Gemini 2.5 Flash → Groq fallback
⚡ Human-in-the-Loop Override
CRITICAL incidents automatically paused for operator review
Full reasoning chain visible before decision
Operator notes recorded in immutable audit trail
📋 Immutable Audit Log
Every action timestamped and logged
Terminal-style activity stream
Compliance-ready for enterprise use
🔒 Bulk Action Safety Lock
One-click "Approve All Low-Risk" for efficiency
High-risk incidents blocked from bulk actions
Warning system prevents accidental approvals
🛠️ Tech Stack
Layer
Technology
Orchestration
UiPath Orchestrator API
Frontend
Next.js 16, Tailwind CSS, Framer Motion
Backend
FastAPI (Python)
Database
Supabase (PostgreSQL)
AI Primary
Google Gemini 2.5 Flash Lite
AI Fallback
Groq (LLaMA 3.1 8B)
Deployment
Vercel (frontend), Hugging Face Spaces Docker (backend)

🚀 Local Setup (Optional for Code Review)
Prerequisites
Python 3.9+
Node.js 18+
UiPath Automation Cloud account
Supabase project
Gemini API key + Groq API key
Backend Setup
cd backend
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -r requirements.txt

# Copy and fill environment variables
cp .env.example .env

uvicorn main:app --reload


Database Setup
Execute in Supabase SQL Editor:
CREATE TABLE incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_name TEXT NOT NULL,
    amount NUMERIC,
    status TEXT DEFAULT 'Pending',
    risk_score INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    operator_note TEXT DEFAULT '',
    ai_reasoning TEXT DEFAULT ''
);
ALTER TABLE incidents DISABLE ROW LEVEL SECURITY;


Frontend Setup
cd frontend
npm install
npm run dev


Environment Variables (.env)
# Supabase
SUPABASE_URL=[https://xxxxx.supabase.co](https://xxxxx.supabase.co)
SUPABASE_KEY=your-anon-key

# UiPath 
UIPATH_TENANT_URL=[https://staging.uipath.com/hackathon26_123/DefaultTenant](https://staging.uipath.com/hackathon26_123/DefaultTenant)
UIPATH_CLIENT_ID=your-client-id
UIPATH_CLIENT_SECRET=your-client-secret
UIPATH_RELEASE_KEY=your-release-key
UIPATH_FOLDER_ID=your-folder-id

# AI/LLM
GEMINI_API_KEY=your-gemini-key
GROQ_API_KEY=your-groq-key


📡 API Endpoints
Method
Endpoint
Description
GET
/health
Service health check
POST
/analyze
Full 4-agent pipeline + UiPath trigger
GET
/incidents
List all incidents
GET
/incidents/{id}
Get single incident
POST
/decision
Human approve/reject
GET
/context/{vendor}
Vendor history lookup
POST
/ingest
Ingestion agent only
POST
/assess-risk
Risk agent only
GET
/test-uipath
UiPath connection test

🏆 Hackathon Track
UiPath AgentHack 2026 — Track 2: Agentic Automation
Judging Criteria Met
Criteria
Implementation
Business Impact
Procurement fraud is a $4.7T global problem. SignalFlow AI provides enterprise-grade detection with audit compliance
Platform Usage
UiPath Orchestrator API integration. High-risk incidents trigger UiPath automations securely
Technical Execution
Full observability, exception handling (Gemini → Groq fallback), audit trail, human-in-the-loop
Creativity
Cinematic Mission Control UX, Threat Matrix explainable AI, dual LLM resilience
Bonus
Custom Coded Agents (Python SDK), external LLM integration

👨‍💻 Built By
M. Rifki Haipal (@quiiplle)
AI Engineer & Mobile Application Developer — Tangerang, Indonesia
📄 License
MIT License — Built for UiPath AgentHack 2026
