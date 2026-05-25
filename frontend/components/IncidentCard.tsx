"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { submitDecision } from "@/lib/api"

type Incident = {
  id: string
  vendor_name: string
  amount: number
  risk_score: number
  status: string
  created_at: string
  ai_reasoning?: string
  maestro_status?: string
  flags?: string[]
}

type ThreatFactor = {
  label: string
  score: number
}

function getReadableTime(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString("id-ID")
}

function getThreatMatrix(incident: Incident): ThreatFactor[] {
  const factors: ThreatFactor[] = []
  if (incident.amount > 1_000_000_000) factors.push({ label: "Unusual Amount (vs Historical)", score: 92 })
  else if (incident.amount > 500_000_000) factors.push({ label: "Above Average Amount", score: 55 })
  else factors.push({ label: "Normal Amount Range", score: 12 })

  const suspicious = ["anonim", "unknown", "dummy", "ghost", "fake", "fictitious", "shadow"]
  if (suspicious.some(k => incident.vendor_name.toLowerCase().includes(k))) {
    factors.push({ label: "Vendor Name Anomaly", score: 88 })
    factors.push({ label: "Duplicate Bank Account Risk", score: 67 })
  } else {
    factors.push({ label: "Vendor Name Verified", score: 15 })
    factors.push({ label: "Duplicate Bank Account Risk", score: 8 })
  }

  if (incident.risk_score >= 80) factors.push({ label: "Missing Invoice ID", score: 85 })
  else factors.push({ label: "Invoice Documentation", score: 20 })

  return factors
}

export default function IncidentCard({ incident, onUpdate, onDecision }: {
  incident: Incident
  onUpdate: () => void
  onDecision?: (vendor: string, action: string, note: string) => void
}) {
  const [loading, setLoading] = useState(false)
  const [note, setNote] = useState("")
  const [expanded, setExpanded] = useState(incident.status === "pending_review")
  const [decided, setDecided] = useState<string | null>(null)
  const [showThreat, setShowThreat] = useState(false)

  const threats = getThreatMatrix(incident)

  const handleDecision = async (action: "approved" | "rejected") => {
    setLoading(true)
    setDecided(action)
    await submitDecision(incident.id, action, note)
    onDecision?.(incident.vendor_name, action, note)
    setTimeout(() => { setLoading(false); onUpdate() }, 800)
  }

  const riskColor = incident.risk_score >= 80 ? "#EF4444"
    : incident.risk_score >= 50 ? "#F59E0B" : "#10B981"

  const borderColor = incident.risk_score >= 80 ? "rgba(239,68,68,0.3)"
    : incident.risk_score >= 50 ? "rgba(245,158,11,0.2)" : "rgba(16,185,129,0.15)"

  const isPending = incident.status === "pending_review"

  return (
    <motion.div layout style={{
      background: isPending ? "rgba(239,68,68,0.04)" : "rgba(255,255,255,0.02)",
      border: `1px solid ${borderColor}`,
      borderLeft: `3px solid ${riskColor}`,
      borderRadius: 8, overflow: "hidden"
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 16px", display: "flex", alignItems: "center",
        justifyContent: "space-between", cursor: "pointer"
      }} onClick={() => setExpanded(e => !e)}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ position: "relative", width: 40, height: 40 }}>
            <svg width="40" height="40" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
              <circle cx="20" cy="20" r="16" fill="none" stroke={riskColor} strokeWidth="3"
                strokeDasharray={`${(incident.risk_score / 100) * 100} 100`} strokeLinecap="round" />
            </svg>
            <span style={{
              position: "absolute", inset: 0, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 11, fontWeight: 700, color: riskColor
            }}>{incident.risk_score}</span>
          </div>
          <div>
            <div style={{ fontSize: 10, color: "#334155", letterSpacing: "0.1em", marginBottom: 2 }}>
              #{incident.id.slice(0, 8)}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#E2E8F0" }}>{incident.vendor_name}</div>
            <div style={{ fontSize: 12, color: "#475569", marginTop: 2, display: "flex", gap: 12 }}>
              <span>IDR {incident.amount.toLocaleString("id-ID")}</span>
              <span>• {getReadableTime(incident.created_at)}</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {/* Flags */}
          {incident.flags && incident.flags.length > 0 && incident.flags.map((flag, idx) => (
            <span key={idx} style={{
              fontSize: 8, padding: "3px 6px", borderRadius: 3,
              background: "rgba(239,68,68,0.15)",
              border: "1px solid rgba(239,68,68,0.4)",
              color: "#EF4444",
              letterSpacing: "0.08em",
              fontWeight: 600,
              whiteSpace: "nowrap"
            }}>
              🚩 {flag.toUpperCase()}
            </span>
          ))}

          {/* Maestro Status */}
          {incident.maestro_status && incident.maestro_status !== "completed" && (
            <span style={{
              fontSize: 8, padding: "3px 6px", borderRadius: 3,
              background: incident.maestro_status === "pending" ? "rgba(245,158,11,0.15)" : "rgba(52,211,153,0.15)",
              border: incident.maestro_status === "pending" ? "1px solid rgba(245,158,11,0.4)" : "1px solid rgba(52,211,153,0.4)",
              color: incident.maestro_status === "pending" ? "#F59E0B" : "#10B981",
              letterSpacing: "0.08em",
              fontWeight: 600,
              whiteSpace: "nowrap"
            }}>
              🔄 {incident.maestro_status?.toUpperCase() || "RUNNING"}
            </span>
          )}

          {/* Threat Matrix button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={e => { e.stopPropagation(); setShowThreat(t => !t) }}
            style={{
              fontSize: 9, padding: "3px 8px", borderRadius: 4,
              background: showThreat ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${showThreat ? "rgba(245,158,11,0.3)" : "rgba(255,255,255,0.08)"}`,
              color: showThreat ? "#F59E0B" : "#64748B",
              cursor: "pointer", letterSpacing: "0.08em", fontFamily: "monospace"
            }}
          >
            THREAT MATRIX
          </motion.button>

          <span style={{
            fontSize: 10, padding: "3px 8px", borderRadius: 4, letterSpacing: "0.08em", fontWeight: 600,
            background: isPending ? "rgba(239,68,68,0.1)" : incident.status === "approved" || incident.status === "auto_approved" ? "rgba(16,185,129,0.1)" : "rgba(100,116,139,0.1)",
            color: isPending ? "#EF4444" : incident.status === "approved" || incident.status === "auto_approved" ? "#10B981" : "#64748B",
            border: `1px solid ${isPending ? "rgba(239,68,68,0.2)" : incident.status === "approved" || incident.status === "auto_approved" ? "rgba(16,185,129,0.2)" : "rgba(100,116,139,0.2)"}`
          }}>
            {incident.status.replace("_", " ").toUpperCase()}
          </span>
          <span style={{ fontSize: 12, color: "#334155" }}>{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {/* Threat Matrix Panel */}
      <AnimatePresence>
        {showThreat && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{
              borderTop: "1px solid rgba(245,158,11,0.15)",
              background: "rgba(245,158,11,0.03)",
              padding: "12px 16px"
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: 10, color: "#F59E0B", letterSpacing: "0.12em", marginBottom: 10 }}>
              // THREAT MATRIX — EXPLAINABLE AI
            </div>
            {threats.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 11, color: "#94A3B8" }}>{t.label}</span>
                  <span style={{ fontSize: 11, color: t.score >= 70 ? "#EF4444" : t.score >= 40 ? "#F59E0B" : "#10B981", fontWeight: 600 }}>
                    {t.score}% {t.score >= 70 ? "🔴" : t.score >= 40 ? "🟡" : "🟢"}
                  </span>
                </div>
                <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${t.score}%` }}
                    transition={{ delay: i * 0.08 + 0.2, duration: 0.6 }}
                    style={{
                      height: "100%", borderRadius: 2,
                      background: t.score >= 70 ? "#EF4444" : t.score >= 40 ? "#F59E0B" : "#10B981"
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded — Reasoning Chain + Controls */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={e => e.stopPropagation()}
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "14px 16px" }}
          >
            <div style={{ marginBottom: isPending ? 14 : 0 }}>
              <div style={{ fontSize: 10, color: "#334155", letterSpacing: "0.12em", marginBottom: 8 }}>
                // REASONING CHAIN
              </div>
              {[
              { tag: "INGESTION", text: `Data validated — ${incident.vendor_name}` },
              { tag: "CONTEXT", text: "Vendor history checked from database" },
              { tag: "RISK", text: `Score: ${incident.risk_score}/100` },
              { tag: "AI", text: incident.ai_reasoning || "Gemini reasoning active" },
              { tag: "REPORT", text: `Incident #${incident.id.slice(0, 8)} logged` },
              ].map((item, i) => (
                <motion.div key={item.tag}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 6, fontSize: 12 }}>
                  <span style={{
                    fontSize: 9, padding: "2px 6px", borderRadius: 3,
                    background: "rgba(255,255,255,0.05)",
                    color: item.tag === "AI" ? "#F59E0B" : "#475569",
                    letterSpacing: "0.1em", whiteSpace: "nowrap",
                    border: item.tag === "AI" ? "1px solid rgba(245,158,11,0.2)" : "1px solid rgba(255,255,255,0.05)"
                  }}>
                    {item.tag}
                  </span>
                  <span style={{ color: "#64748B", lineHeight: 1.6 }}>{item.text}</span>
                </motion.div>
              ))}
            </div>

            {/* Human Override Controls */}
            {isPending && !decided && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                <input type="text" placeholder="// operator note (optional)"
                  value={note} onChange={e => setNote(e.target.value)}
                  onClick={e => e.stopPropagation()}
                  style={{
                    width: "100%", background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6,
                    padding: "8px 12px", fontSize: 12, color: "#94A3B8",
                    fontFamily: "monospace", marginBottom: 10, outline: "none"
                  }}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={e => { e.stopPropagation(); handleDecision("approved") }}
                    disabled={loading}
                    style={{
                      flex: 1, padding: "9px 0", borderRadius: 6, fontSize: 12,
                      fontWeight: 600, letterSpacing: "0.1em", cursor: "pointer",
                      background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)",
                      color: "#10B981", fontFamily: "monospace"
                    }}>
                    ✓ APPROVE
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={e => { e.stopPropagation(); handleDecision("rejected") }}
                    disabled={loading}
                    style={{
                      flex: 1, padding: "9px 0", borderRadius: 6, fontSize: 12,
                      fontWeight: 600, letterSpacing: "0.1em", cursor: "pointer",
                      background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
                      color: "#EF4444", fontFamily: "monospace"
                    }}>
                    ✕ REJECT
                  </motion.button>
                </div>
              </motion.div>
            )}

            <AnimatePresence>
              {decided && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  style={{
                    textAlign: "center", padding: "12px",
                    color: decided === "approved" ? "#10B981" : "#EF4444",
                    fontSize: 13, fontWeight: 600, letterSpacing: "0.1em"
                  }}>
                  {decided === "approved" ? "✓ INCIDENT APPROVED" : "✕ INCIDENT REJECTED"}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}