"use client"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { getIncidents, bulkApproveLowRisk } from "@/lib/api"
import IncidentCard from "@/components/IncidentCard"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://quiiplle-signalflow-ai-backend.hf.space"

type LogEntry = {
  time: string
  message: string
  type: "ai" | "action" | "system"
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 9,
  letterSpacing: "0.15em",
  color: "#475569",
  marginBottom: 6,
  fontFamily: "monospace",
  fontWeight: 600,
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 6,
  padding: "9px 12px",
  fontSize: 12,
  color: "#E2E8F0",
  fontFamily: "monospace",
  outline: "none",
  boxSizing: "border-box",
}

export default function Home() {
  const [incidents, setIncidents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState("")
  const [auditLog, setAuditLog] = useState<LogEntry[]>([
    { time: "09:00:01", message: "SignalFlow AI Mission Control initialized", type: "system" },
    { time: "09:00:02", message: "Connected to Supabase — incidents database ready", type: "system" },
    { time: "09:00:03", message: "UiPath Maestro BPMN orchestration active", type: "system" },
  ])
  const [bulkWarning, setBulkWarning] = useState(false)
  const [activeTab, setActiveTab] = useState<"incidents" | "audit">("incidents")

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [form, setForm] = useState({
    vendor_name: "",
    amount: "",
    document_type: "JSON",
    invoice_id: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  })

  const addLog = (message: string, type: LogEntry["type"] = "action") => {
    const now = new Date()
    const time = now.toLocaleTimeString("en-US", { hour12: false })
    setAuditLog(prev => [...prev, { time, message, type }])
  }

  const fetchIncidents = async () => {
    const data = await getIncidents()
    setIncidents(data)
    setLoading(false)
    setLastUpdated(new Date().toLocaleTimeString("en-US"))
  }

  useEffect(() => {
    fetchIncidents()
    addLog("Auto-refresh active — polling every 5s", "system")
    const interval = setInterval(fetchIncidents, 5000)
    return () => clearInterval(interval)
  }, [])

  const critical = incidents.filter(i => i.status === "pending_review")
  const lowRisk = incidents.filter(i => i.status === "auto_approved" && i.risk_score < 25)
  const others = incidents.filter(i => i.status !== "pending_review")
  const totalRisk = incidents.length > 0
    ? Math.round(incidents.reduce((a, i) => a + i.risk_score, 0) / incidents.length)
    : 0

  const handleBulkApprove = async () => {
    if (lowRisk.length === 0) return
    setBulkWarning(false)
    addLog(`Bulk approve initiated for ${lowRisk.length} low-risk incidents`, "action")
    await bulkApproveLowRisk(lowRisk.map(i => i.id))
    addLog(`Bulk approve completed — ${lowRisk.length} incidents approved`, "action")
    fetchIncidents()
  }

  const handleDecisionLog = (vendorName: string, action: string, note: string) => {
    addLog(`Operator ${action.toUpperCase()} incident — ${vendorName}${note ? ` | Note: "${note}"` : ""}`, "action")
  }

  const handleFormChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    setSubmitError("")
    if (!form.vendor_name || !form.amount) {
      setSubmitError("Vendor name and amount are required.")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`${API_URL}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_name: form.vendor_name,
          amount: parseFloat(form.amount),
          document_type: form.document_type,
          raw_data: {
            invoice_id: form.invoice_id || "",
            description: form.description || "",
            date: form.date,
          },
        }),
      })
      if (!res.ok) throw new Error("Backend error")
      addLog(`New incident submitted — ${form.vendor_name} | IDR ${parseFloat(form.amount).toLocaleString()}`, "action")
      setShowModal(false)
      setForm({
        vendor_name: "",
        amount: "",
        document_type: "JSON",
        invoice_id: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
      })
      fetchIncidents()
    } catch {
      setSubmitError("Failed to submit. Check backend connection.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen" style={{ background: "#080C10" }}>
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 50,
        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)"
      }} />

      {/* Topbar */}
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(8,12,16,0.95)",
          backdropFilter: "blur(12px)",
          position: "sticky", top: 0, zIndex: 40,
          padding: "0 24px", height: 52,
          display: "flex", alignItems: "center", gap: 16
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%", background: "#10B981",
            boxShadow: "0 0 8px #10B981", animation: "pulse 2s infinite"
          }} />
          <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.1em", color: "#E2E8F0" }}>
            SIGNALFLOW AI
          </span>
          <span style={{ fontSize: 11, color: "#475569", letterSpacing: "0.15em" }}>
            // MISSION CONTROL
          </span>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          {/* New Incident Button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { setSubmitError(""); setShowModal(true) }}
            style={{
              background: "rgba(16,185,129,0.08)",
              border: "1px solid rgba(16,185,129,0.35)",
              borderRadius: 5,
              padding: "4px 12px",
              fontSize: 11,
              color: "#10B981",
              cursor: "pointer",
              fontFamily: "monospace",
              fontWeight: 600,
              letterSpacing: "0.1em",
            }}
          >
            + NEW INCIDENT
          </motion.button>

          {critical.length > 0 && (
            <motion.div
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              style={{
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: 4, padding: "3px 10px",
                fontSize: 11, color: "#EF4444", letterSpacing: "0.1em", fontWeight: 600
              }}
            >
              ⚠ {critical.length} CRITICAL
            </motion.div>
          )}
          <span style={{ fontSize: 11, color: "#334155" }}>SYNC {lastUpdated}</span>
        </div>
      </motion.div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px" }}>

        {/* Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}
        >
          {[
            { label: "TOTAL INCIDENTS", value: incidents.length, color: "#94A3B8" },
            { label: "CRITICAL", value: critical.length, color: "#EF4444" },
            { label: "RESOLVED", value: others.length, color: "#10B981" },
            { label: "AVG RISK SCORE", value: totalRisk, color: "#F59E0B" },
          ].map((m, i) => (
            <motion.div key={m.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 8, padding: "14px 16px"
              }}>
              <div style={{ fontSize: 10, color: "#475569", letterSpacing: "0.12em", marginBottom: 6 }}>{m.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: m.color, lineHeight: 1 }}>{m.value}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bulk Approve */}
        {lowRisk.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              marginBottom: 16, display: "flex", alignItems: "center",
              justifyContent: "space-between",
              background: "rgba(16,185,129,0.04)",
              border: "1px solid rgba(16,185,129,0.15)",
              borderRadius: 8, padding: "10px 16px"
            }}
          >
            <span style={{ fontSize: 12, color: "#10B981" }}>
              {lowRisk.length} low-risk incidents pending — safe to bulk approve
            </span>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleBulkApprove}
              style={{
                background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)",
                borderRadius: 6, padding: "6px 14px", fontSize: 11,
                color: "#10B981", cursor: "pointer", fontFamily: "monospace",
                fontWeight: 600, letterSpacing: "0.08em"
              }}
            >
              ✓ APPROVE ALL LOW-RISK
            </motion.button>
          </motion.div>
        )}

        {/* Bulk warning */}
        <AnimatePresence>
          {bulkWarning && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                marginBottom: 16, padding: "10px 16px",
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.4)",
                borderRadius: 8, fontSize: 12, color: "#EF4444",
                fontWeight: 600, letterSpacing: "0.05em"
              }}
            >
              ⛔ WARNING: High-Risk incidents require manual review. Bulk action disabled for selected items.
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, marginBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          {["incidents", "audit"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab as any)}
              style={{
                padding: "8px 20px", fontSize: 11, fontFamily: "monospace",
                letterSpacing: "0.12em", cursor: "pointer", border: "none",
                background: "transparent",
                color: activeTab === tab ? "#E2E8F0" : "#475569",
                borderBottom: activeTab === tab ? "2px solid #10B981" : "2px solid transparent",
                textTransform: "uppercase"
              }}>
              {tab === "incidents" ? "// Incidents" : "// Audit Log"}
            </button>
          ))}
        </div>

        {/* Tab: Incidents */}
        {activeTab === "incidents" && (
          <div>
            <AnimatePresence>
              {critical.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 10, letterSpacing: "0.15em", color: "#EF4444", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ animation: "blink 1s infinite" }}>▶</span> HUMAN OVERRIDE REQUIRED ({critical.length})
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {critical.map((incident, i) => (
                      <motion.div key={incident.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
                        <IncidentCard incident={incident} onUpdate={fetchIncidents} onDecision={handleDecisionLog} />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <div style={{ fontSize: 10, letterSpacing: "0.15em", color: "#475569", marginBottom: 12 }}>
                // RECENT INCIDENTS
              </div>
              {loading ? (
                <div style={{ fontSize: 12, color: "#334155" }}>LOADING...</div>
              ) : incidents.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    textAlign: "center",
                    padding: "60px 24px",
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    borderRadius: 8
                  }}
                >
                  <div style={{ fontSize: 14, color: "#475569", marginBottom: 8 }}>✓ All clear</div>
                  <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.6 }}>
                    No incidents detected. The system is monitoring for suspicious activities.
                  </div>
                </motion.div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <AnimatePresence>
                    {others.map((incident, i) => (
                      <motion.div key={incident.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 20 }} transition={{ delay: i * 0.05 }}>
                        <IncidentCard incident={incident} onUpdate={fetchIncidents} onDecision={handleDecisionLog} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: Audit Log */}
        {activeTab === "audit" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{
              background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 8, padding: "16px", fontFamily: "monospace",
              maxHeight: 500, overflowY: "auto"
            }}>
            {auditLog.slice().reverse().map((log, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                style={{ display: "flex", gap: 12, marginBottom: 8, fontSize: 12 }}>
                <span style={{ color: "#334155", whiteSpace: "nowrap" }}>[{log.time}]</span>
                <span style={{
                  color: log.type === "ai" ? "#F59E0B" : log.type === "action" ? "#10B981" : "#475569"
                }}>
                  {log.type === "ai" ? "AI" : log.type === "action" ? "ACT" : "SYS"}
                </span>
                <span style={{ color: "#94A3B8" }}>{log.message}</span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* ─── New Incident Modal ─── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 100,
              background: "rgba(0,0,0,0.75)",
              backdropFilter: "blur(6px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: 24,
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              style={{
                width: "100%", maxWidth: 520,
                background: "#0D1117",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10,
                overflow: "hidden",
              }}
            >
              {/* Modal Header */}
              <div style={{
                padding: "14px 20px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981", boxShadow: "0 0 6px #10B981" }} />
                  <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", color: "#E2E8F0", fontFamily: "monospace" }}>
                    // NEW INCIDENT
                  </span>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 16, lineHeight: 1 }}
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 14 }}>

                {/* Vendor Name */}
                <div>
                  <label style={labelStyle}>VENDOR NAME *</label>
                  <input
                    value={form.vendor_name}
                    onChange={e => handleFormChange("vendor_name", e.target.value)}
                    placeholder="e.g. Anonymous Trading Co."
                    style={inputStyle}
                  />
                </div>

                {/* Amount + Document Type */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={labelStyle}>AMOUNT (IDR) *</label>
                    <input
                      type="number"
                      value={form.amount}
                      onChange={e => handleFormChange("amount", e.target.value)}
                      placeholder="e.g. 1950000000"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>DOCUMENT TYPE</label>
                    <select
                      value={form.document_type}
                      onChange={e => handleFormChange("document_type", e.target.value)}
                      style={{ ...inputStyle, cursor: "pointer" }}
                    >
                      <option value="JSON">JSON</option>
                      <option value="PDF">PDF</option>
                    </select>
                  </div>
                </div>

                {/* Invoice ID */}
                <div>
                  <label style={labelStyle}>INVOICE ID</label>
                  <input
                    value={form.invoice_id}
                    onChange={e => handleFormChange("invoice_id", e.target.value)}
                    placeholder="e.g. INV-2026-00421"
                    style={inputStyle}
                  />
                </div>

                {/* Date */}
                <div>
                  <label style={labelStyle}>TRANSACTION DATE</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => handleFormChange("date", e.target.value)}
                    style={inputStyle}
                  />
                </div>

                {/* Description */}
                <div>
                  <label style={labelStyle}>DESCRIPTION</label>
                  <textarea
                    value={form.description}
                    onChange={e => handleFormChange("description", e.target.value)}
                    placeholder="Additional notes about this transaction..."
                    rows={3}
                    style={{ ...inputStyle, resize: "none", lineHeight: 1.5 }}
                  />
                </div>

                {/* Risk warning hint */}
                {form.amount && parseFloat(form.amount) >= 1000000000 && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      padding: "8px 12px",
                      background: "rgba(239,68,68,0.08)",
                      border: "1px solid rgba(239,68,68,0.25)",
                      borderRadius: 6, fontSize: 11,
                      color: "#EF4444", fontFamily: "monospace",
                    }}
                  >
                    ⚠ Amount exceeds Rp 1B threshold — likely CRITICAL risk score
                  </motion.div>
                )}

                {/* Error message */}
                {submitError && (
                  <div style={{ fontSize: 11, color: "#EF4444", fontFamily: "monospace" }}>
                    ✕ {submitError}
                  </div>
                )}

                {/* Submit */}
                <motion.button
                  whileHover={{ scale: submitting ? 1 : 1.02 }}
                  whileTap={{ scale: submitting ? 1 : 0.97 }}
                  onClick={handleSubmit}
                  disabled={submitting}
                  style={{
                    marginTop: 4,
                    padding: "11px",
                    background: submitting ? "rgba(16,185,129,0.03)" : "rgba(16,185,129,0.1)",
                    border: "1px solid rgba(16,185,129,0.35)",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    color: submitting ? "#334155" : "#10B981",
                    cursor: submitting ? "not-allowed" : "pointer",
                    fontFamily: "monospace",
                    transition: "all 0.2s",
                  }}
                >
                  {submitting ? "ANALYZING..." : "▶ RUN ANALYSIS"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}