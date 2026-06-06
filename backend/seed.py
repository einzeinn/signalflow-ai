import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

# Clear existing data
supabase.table("incidents").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()

seed_data = [
    # LOW risk — clean global vendors
    {
        "vendor_name": "Siemens AG",
        "amount": 85000,
        "risk_score": 0,
        "status": "auto_approved",
        "operator_note": "",
        "ai_reasoning": "Transaction appears legitimate. Siemens AG is a globally recognized industrial conglomerate with a strong compliance track record. The transaction amount is within standard procurement thresholds and all documentation appears complete. No fraud indicators detected."
    },
    {
        "vendor_name": "Honeywell International Inc.",
        "amount": 142000,
        "risk_score": 0,
        "status": "auto_approved",
        "operator_note": "",
        "ai_reasoning": "Low risk transaction. Honeywell is a Fortune 100 company with established procurement channels. Amount is reasonable for industrial equipment supply and vendor identity is fully verifiable through public records."
    },
    {
        "vendor_name": "3M Company",
        "amount": 67500,
        "risk_score": 0,
        "status": "auto_approved",
        "operator_note": "",
        "ai_reasoning": "Transaction cleared with no anomalies. 3M is a well-established multinational with transparent supply chain practices. Small procurement amount with complete vendor documentation."
    },

    # MEDIUM risk
    {
        "vendor_name": "Schneider Electric SE",
        "amount": 520000,
        "risk_score": 30,
        "status": "auto_approved",
        "operator_note": "",
        "ai_reasoning": "Moderate risk flag triggered due to above-average transaction amount. Schneider Electric is a legitimate global energy management company. Amount is elevated but consistent with enterprise-level infrastructure procurement. Approved with standard monitoring."
    },
    {
        "vendor_name": "ABB Ltd",
        "amount": 680000,
        "risk_score": 30,
        "status": "auto_approved",
        "operator_note": "",
        "ai_reasoning": "Transaction exceeds medium-risk threshold. ABB is a Swiss multinational with strong compliance history. No suspicious patterns detected beyond the transaction size. Auto-approved with audit trail recorded."
    },

    # HIGH risk — already reviewed
    {
        "vendor_name": "Emerson Electric Co.",
        "amount": 1250000,
        "risk_score": 50,
        "status": "approved",
        "operator_note": "Contract documentation verified. Multi-year service agreement confirmed by procurement director.",
        "ai_reasoning": "High-value transaction flagged for manual review. Emerson Electric is a legitimate Fortune 500 company, however the transaction amount exceeds standard single-purchase thresholds. Cross-referencing with approved budget allocations shows alignment with Q3 infrastructure upgrade plan. Approved after human verification."
    },
    {
        "vendor_name": "Parker Hannifin Corp.",
        "amount": 975000,
        "risk_score": 50,
        "status": "rejected",
        "operator_note": "Vendor registration expired. Purchase order reference does not match approved vendor list.",
        "ai_reasoning": "Transaction flagged due to missing invoice ID and high amount. While Parker Hannifin is a legitimate company, the absence of a valid purchase order reference and expired vendor registration in our system raises compliance concerns. Rejection recommended pending re-registration and proper documentation submission."
    },
    {
        "vendor_name": "Rockwell Automation Inc.",
        "amount": 1480000,
        "risk_score": 50,
        "status": "approved",
        "operator_note": "Government infrastructure project. Budget allocation verified by finance department.",
        "ai_reasoning": "Large procurement detected for automation systems. Rockwell Automation is a recognized industrial technology leader. Transaction aligns with approved capital expenditure budget for factory automation upgrade. Vendor has 8-year clean procurement history in our system."
    },

    # CRITICAL — pending review for demo
    {
        "vendor_name": "Phantom Solutions LLC",
        "amount": 2850000,
        "risk_score": 100,
        "status": "pending_review",
        "operator_note": "",
        "ai_reasoning": "[Groq] CRITICAL FRAUD ALERT: This transaction exhibits multiple high-confidence fraud indicators. 'Phantom Solutions LLC' is an unregistered entity with no verifiable business history or public records. The transaction amount of $2.85M without an invoice ID is a textbook procurement fraud pattern — fictitious vendor with inflated contract value and zero documentation trail. This matches 94% similarity to confirmed fraud cases in our database. Immediate escalation and investigation required. Do NOT approve without thorough vendor verification."
    },
    {
        "vendor_name": "Anonymous Trading Co.",
        "amount": 1950000,
        "risk_score": 90,
        "status": "pending_review",
        "operator_note": "",
        "ai_reasoning": "[Gemini] High probability fraudulent transaction detected. The vendor name 'Anonymous Trading Co.' is a significant red flag — legitimate enterprises do not use anonymity-indicating names in formal procurement. Combined with a $1.95M transaction value and missing invoice documentation, this pattern is consistent with shell company fraud schemes. Statistical analysis indicates 87% probability of fraudulent intent based on vendor naming conventions, transaction size, and documentation gaps. Human review mandatory before any action."
    },
]

result = supabase.table("incidents").insert(seed_data).execute()
print(f"✅ Seeded {len(result.data)} incidents successfully")