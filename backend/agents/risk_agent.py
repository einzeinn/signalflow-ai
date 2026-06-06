import os
from google import genai
from groq import Groq

class RiskAgent:
    def __init__(self):
        self.gemini = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        self.groq = Groq(api_key=os.getenv("GROQ_API_KEY"))

    def run(self, validated_data: dict) -> dict:
        score = 0
        flags = []

        amount = validated_data.get("amount", 0)
        vendor_name = validated_data.get("vendor_name", "")
        raw_data = validated_data.get("raw_data", {})

        # Rule 1: Amount
        if amount > 1_000_000_000:
            score += 50
            flags.append("Amount exceeds 1 billion IDR")
        elif amount > 500_000_000:
            score += 30
            flags.append("Amount exceeds 500 million IDR")

        # Rule 2: Suspicious vendor
        suspicious_keywords = ["anonim", "unknown", "test", "dummy", "ghost", "fake", "fictitious", "shadow"]
        if any(kw in vendor_name.lower() for kw in suspicious_keywords):
            score += 30
            flags.append(f"Suspicious vendor name: {vendor_name}")

        # Rule 3: Missing invoice ID
        if not raw_data.get("invoice_id"):
            score += 20
            flags.append("Missing invoice ID")

        # AI reasoning with fallback
        ai_reasoning = self._get_ai_reasoning(vendor_name, amount, raw_data, flags, score)

        # Determine level
        if score >= 80:
            level = "CRITICAL"
            action = "HUMAN_OVERRIDE_REQUIRED"
            db_status = "pending_review"
        elif score >= 50:
            level = "HIGH"
            action = "REVIEW_RECOMMENDED"
            db_status = "auto_approved"
        elif score >= 25:
            level = "MEDIUM"
            action = "AUTO_APPROVE_WITH_LOG"
            db_status = "auto_approved"
        else:
            level = "LOW"
            action = "AUTO_APPROVE"
            db_status = "auto_approved"

        return {
            "risk_score": score,
            "risk_level": level,
            "action": action,
            "db_status": db_status,
            "flags": flags,
            "reasoning": f"Risk score {score}/100. Flags: {', '.join(flags) if flags else 'None.'}",
            "ai_reasoning": ai_reasoning
        }

    def _get_prompt(self, vendor_name, amount, raw_data, flags, score):
        return f"""You are a senior procurement fraud analyst.

Transaction data:
- Vendor: {vendor_name}
- Amount: IDR {amount:,.0f}
- Additional data: {raw_data}
- Detected flags: {', '.join(flags) if flags else 'None'}
- Initial risk score: {score}/100

Provide a brief analysis (2-3 sentences) explaining why this transaction is risky or safe.
Focus on common procurement fraud patterns.
Do not use markdown formatting."""

    def _get_ai_reasoning(self, vendor_name, amount, raw_data, flags, score):
        prompt = self._get_prompt(vendor_name, amount, raw_data, flags, score)

        # Try Gemini first
        try:
            response = self.gemini.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt
            )
            return f"[Gemini] {response.text.strip()}"
        except Exception as e:
            gemini_error = str(e)

        # Fallback to Groq
        try:
            response = self.groq.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=200
            )
            return f"[Groq] {response.choices[0].message.content.strip()}"
        except Exception as e:
            groq_error = str(e)

        # Both failed
        return "AI reasoning unavailable at this time."