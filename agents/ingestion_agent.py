from typing import Optional
from pydantic import BaseModel

class IncidentInput(BaseModel):
    vendor_name: str
    amount: float
    document_type: str  # "PDF" | "JSON"
    raw_data: dict

class IngestionAgent:
    def run(self, input: IncidentInput) -> dict:
        errors = []

        if not input.vendor_name:
            errors.append("vendor_name is empty")
        if input.amount <= 0:
            errors.append("amount must be greater than 0")
        if not input.raw_data:
            errors.append("raw_data is empty")

        if errors:
            return {
                "status": "invalid",
                "errors": errors,
                "reasoning": f"Data rejected due to: {', '.join(errors)}"
            }

        return {
            "status": "valid",
            "errors": [],
            "reasoning": "All fields validated. Data ready for processing.",
            "validated_data": input.model_dump()
        }