const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://quiiplle-signalflow-ai-backend.hf.space";

export async function getIncidents() {
  const res = await fetch(`${BASE_URL}/incidents`, { cache: "no-store" })
  return res.json()
}

export async function submitDecision(
  incident_id: string,
  action: "approved" | "rejected",
  operator_note: string = ""
) {
  const res = await fetch(`${BASE_URL}/decision`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ incident_id, action, operator_note })
  })
  return res.json()
}

export async function bulkApproveLowRisk(incident_ids: string[]) {
  const results = await Promise.all(
    incident_ids.map(id => submitDecision(id, "approved", "Bulk approved — low risk verified"))
  )
  return results
}

export async function analyzeIncident(data: {
  vendor_name: string
  amount: number
  document_type: string
  raw_data: Record<string, string>
}) {
  const res = await fetch(`${BASE_URL}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  return res.json()
}