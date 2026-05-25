from datetime import datetime

class ReportingAgent:
    def __init__(self, supabase_client):
        self.supabase = supabase_client

    def run(self, vendor_name: str, amount: float, risk_result: dict, context_result: dict) -> dict:
        
        # Save to Supabase
        record = {
    "vendor_name": vendor_name,
    "amount": amount,
    "risk_score": risk_result.get("risk_score", 0),
    "status": risk_result.get("db_status", "auto_approved"),
    "operator_note": "",
    "ai_reasoning": risk_result.get("ai_reasoning", "")
    }

        print("ai_reasoning value:", risk_result.get("ai_reasoning", "EMPTY"))
        print("record to insert:", record)


        result = self.supabase.table("incidents").insert(record).execute()
        incident_id = result.data[0]["id"] if result.data else "unknown"

        # Generate audit trail
        audit = {
            "incident_id": incident_id,
            "timestamp": datetime.utcnow().isoformat(),
            "vendor_name": vendor_name,
            "amount": amount,
            "risk_score": risk_result.get("risk_score"),
            "risk_level": risk_result.get("risk_level"),
            "action": risk_result.get("action"),
            "flags": risk_result.get("flags", []),
            "vendor_history": context_result.get("reasoning"),
            "reasoning_chain": [
                f"[INGESTION] Data validated for vendor {vendor_name}",
                f"[CONTEXT] {context_result.get('reasoning')}",
                f"[RISK] {risk_result.get('reasoning')}",
                f"[AI] {risk_result.get('ai_reasoning', '-')}",
                f"[REPORT] Incident #{incident_id[:8]} logged. Action: {risk_result.get('action')}"
                ]
        }

        return audit