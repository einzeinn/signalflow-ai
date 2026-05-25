class ContextAgent:
    def __init__(self, supabase_client):
        self.supabase = supabase_client

    def run(self, vendor_name: str) -> dict:
        # Check vendor history in database
        result = self.supabase.table("incidents") \
            .select("*") \
            .eq("vendor_name", vendor_name) \
            .execute()

        history = result.data
        total = len(history)

        if total == 0:
            return {
                "vendor_found": False,
                "total_incidents": 0,
                "previous_flags": [],
                "reasoning": f"Vendor '{vendor_name}' not found in history. New vendor."
            }

        # Count how many times high risk
        high_risk_count = sum(
            1 for i in history if i.get("risk_score", 0) >= 50
        )

        previous_flags = [
            f"Incident #{i['id'][:8]} - Score: {i.get('risk_score', 0)} - Status: {i.get('status')}"
            for i in history
        ]

        return {
            "vendor_found": True,
            "total_incidents": total,
            "high_risk_count": high_risk_count,
            "previous_flags": previous_flags,
            "reasoning": f"Vendor '{vendor_name}' found {total}x. {high_risk_count} previously high-risk incidents."
        }