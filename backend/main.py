import os
import sys
from datetime import datetime

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client
from dotenv import load_dotenv
from uipath_client import test_connection, get_processes, trigger_process

from agents.ingestion_agent import IngestionAgent, IncidentInput
from agents.context_agent import ContextAgent
from agents.risk_agent import RiskAgent
from agents.reporting_agent import ReportingAgent
from uipath_client import test_connection, get_processes, trigger_process

load_dotenv()

app = FastAPI(title="SignalFlow AI", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)


# ─── Models ───────────────────────────────────────────────

class HumanDecision(BaseModel):
    incident_id: str
    action: str
    operator_note: str = ""


# ─── Health ───────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "signalflow-ai"}


@app.get("/test-db")
def test_db():
    result = supabase.table("incidents").select("*").execute()
    return {"connected": True, "rows": len(result.data)}


# ─── Agents ───────────────────────────────────────────────

@app.post("/ingest")
def ingest(input: IncidentInput):
    agent = IngestionAgent()
    return agent.run(input)


@app.get("/context/{vendor_name}")
def get_context(vendor_name: str):
    agent = ContextAgent(supabase)
    return agent.run(vendor_name)


@app.post("/assess-risk")
def assess_risk(input: IncidentInput):
    ingestion = IngestionAgent()
    ingestion_result = ingestion.run(input)
    if ingestion_result["status"] == "invalid":
        return ingestion_result
    risk = RiskAgent()
    return risk.run(ingestion_result["validated_data"])


@app.post("/analyze")
def analyze(input: IncidentInput):
    # Agent 1: Ingestion
    ingestion = IngestionAgent()
    ingestion_result = ingestion.run(input)
    if ingestion_result["status"] == "invalid":
        return ingestion_result

    # Agent 2: Context
    context = ContextAgent(supabase)
    context_result = context.run(input.vendor_name)

    # Agent 3: Risk
    risk = RiskAgent()
    risk_result = risk.run(ingestion_result["validated_data"])

    # Agent 4: Reporting
    reporting = ReportingAgent(supabase)
    audit = reporting.run(
        input.vendor_name,
        input.amount,
        risk_result,
        context_result
    )

    # Trigger UiPath Maestro
    maestro_result = {"skipped": True}
    try:
        release_key = os.getenv("UIPATH_RELEASE_KEY")
        maestro_result = trigger_process(
            release_key=release_key,
            input_arguments={
                "incident_id": audit["incident_id"],
                "vendor_name": input.vendor_name,
                "risk_score": risk_result["risk_score"],
                "action": risk_result["action"]
            }
        )
    except Exception as e:
        maestro_result = {"error": str(e)}

    return {
        "audit": audit,
        "requires_human": risk_result.get("action") == "HUMAN_OVERRIDE_REQUIRED",
        "maestro_job": {
            "triggered": maestro_result.get("status") == 201,
            "job_key": maestro_result.get("data", {}).get("value", [{}])[0].get("Key", "")
        }
    }

# ─── Incidents ────────────────────────────────────────────

@app.get("/incidents")
def get_incidents():
    result = supabase.table("incidents") \
        .select("*") \
        .order("created_at", desc=True) \
        .execute()
    return result.data


@app.get("/incidents/{incident_id}")
def get_incident(incident_id: str):
    result = supabase.table("incidents") \
        .select("*") \
        .eq("id", incident_id) \
        .execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Incident tidak ditemukan")
    return result.data[0]


# ─── Human Override ───────────────────────────────────────

@app.post("/decision")
def human_decision(decision: HumanDecision):
    if decision.action not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Action harus 'approved' atau 'rejected'")

    result = supabase.table("incidents").update({
        "status": decision.action,
        "operator_note": decision.operator_note,
        "updated_at": datetime.utcnow().isoformat()
    }).eq("id", decision.incident_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Incident tidak ditemukan")

    return {
        "success": True,
        "incident_id": decision.incident_id,
        "action": decision.action,
        "message": f"Incident {decision.action} oleh operator",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/test-uipath")
def test_uipath():
    return test_connection()

@app.get("/uipath-processes")
def uipath_processes():
    return get_processes()

@app.post("/trigger-maestro")
def trigger_maestro(incident_id: str, vendor_name: str, risk_score: int):
    release_key = os.getenv("UIPATH_RELEASE_KEY")
    result = trigger_process(
        release_key=release_key,
        input_arguments={
            "incident_id": incident_id,
            "vendor_name": vendor_name,
            "risk_score": risk_score
        }
    )
    return result