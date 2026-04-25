import { useState } from "react";
import { T, priorityColor } from "../styles/theme.js";

export function ActionCard({ action, rank }) {
  const [expanded, setExpanded] = useState(rank === 1);
  const { title, what, how, estimatedDailyMarginNote, timeframe, kpi, kpiCurrent, kpiTarget, confidence, priority } = action;
  const color = priorityColor(priority);

  const timeframeLabel = {
    "immediate":         "Act Now",
    "next-opportunity":  "Next Opportunity",
    "next-turnaround":   "Next Turnaround",
    "capital-project":   "Capital Project",
  }[timeframe] || timeframe;

  return (
    <div style={{
      background:    T.surface,
      border:        `1px solid ${expanded ? color + "55" : T.border}`,
      borderRadius:  T.r8,
      overflow:      "hidden",
    }}>
      {/* Header */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          display:    "flex",
          alignItems: "flex-start",
          gap:        "14px",
          padding:    "16px 18px",
          cursor:     "pointer",
        }}
      >
        {/* Rank bubble */}
        <div style={{
          flexShrink:   0,
          width:        "34px",
          height:       "34px",
          borderRadius: "50%",
          background:   color + "22",
          border:       `2px solid ${color}`,
          display:      "flex",
          alignItems:   "center",
          justifyContent: "center",
          fontFamily:   T.fontMono,
          fontSize:     "15px",
          fontWeight:   700,
          color,
        }}>
          #{rank}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span style={{
              fontSize: "11px", fontWeight: 600, textTransform: "uppercase",
              letterSpacing: "0.06em", color,
            }}>
              {priority.toUpperCase()}
            </span>
            <span style={{
              fontSize: "11px", color: T.textDim, border: `1px solid ${T.border2}`,
              borderRadius: T.r4, padding: "1px 7px",
            }}>
              {timeframeLabel}
            </span>
            <span style={{ fontSize: "11px", color: T.teal, marginLeft: "auto" }}>
              {estimatedDailyMarginNote?.split(" ")[0]}
              {estimatedDailyMarginNote?.split(" ")[1] && " " + estimatedDailyMarginNote.split(" ")[1]}
            </span>
          </div>
          <h3 style={{ marginTop: "4px", color: T.text, fontSize: "15px", fontWeight: 600 }}>{title}</h3>
          <p style={{ marginTop: "4px", color: T.textMute, fontSize: "13px", lineHeight: 1.4 }}>{what}</p>
        </div>

        <span style={{ color: T.textDim, fontSize: "16px", flexShrink: 0, marginTop: "6px" }}>
          {expanded ? "▲" : "▼"}
        </span>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div style={{ borderTop: `1px solid ${T.border}`, padding: "16px 18px 18px", display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Action steps */}
          <div>
            <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", color: T.textDim, marginBottom: "8px" }}>
              Action Steps
            </div>
            <ol style={{ paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {how.map((step, i) => (
                <li key={i} style={{ color: T.textBody, fontSize: "13px", lineHeight: 1.6 }}>{step}</li>
              ))}
            </ol>
          </div>

          {/* KPI + margin row */}
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <MetaBlock label="KPI" value={kpi} />
            <MetaBlock label="Current" value={kpiCurrent} highlight={T.warning} />
            <MetaBlock label="Target" value={kpiTarget} highlight={T.teal} />
            <MetaBlock label="Confidence" value={confidence} />
          </div>

          <div style={{
            background:    T.tealDim,
            border:        `1px solid ${T.teal}33`,
            borderRadius:  T.r6,
            padding:       "10px 14px",
            fontSize:      "13px",
            color:         T.text,
          }}>
            <span style={{ color: T.teal, fontWeight: 600 }}>Margin Uplift: </span>
            {estimatedDailyMarginNote}
          </div>
        </div>
      )}
    </div>
  );
}

function MetaBlock({ label, value, highlight }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
      <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.06em", color: T.textDim }}>{label}</span>
      <span style={{ fontSize: "13px", fontFamily: T.fontMono, color: highlight || T.textBody }}>{value}</span>
    </div>
  );
}
