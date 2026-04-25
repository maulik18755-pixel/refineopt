import { useState } from "react";
import { T, severityColor, severityBg } from "../styles/theme.js";
import { SeverityBadge } from "./SeverityBadge.jsx";

export function FindingCard({ finding }) {
  const [expanded, setExpanded] = useState(false);
  const { id, severity, category, text, value, threshold, impact } = finding;
  const color = severityColor(severity);

  return (
    <div
      onClick={() => setExpanded(e => !e)}
      style={{
        background:    T.surface,
        border:        `1px solid ${expanded ? color + "55" : T.border}`,
        borderLeft:    `3px solid ${color}`,
        borderRadius:  T.r6,
        padding:       "12px 16px",
        cursor:        "pointer",
        transition:    "border-color 0.15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
        <SeverityBadge severity={severity} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" }}>
            <span style={{ fontFamily: T.fontMono, fontSize: "11px", color: T.textDim }}>{id}</span>
            <span style={{ fontSize: "12px", color: T.textMute, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {category.replace(/-/g, " ")}
            </span>
          </div>
          <p style={{ marginTop: "4px", color: T.textBody, lineHeight: 1.5, fontSize: "13px" }}>{text}</p>

          {value != null && threshold && (
            <div style={{ marginTop: "6px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <Chip label="Measured" value={typeof value === "number" ? value.toFixed(2) : value} unit={threshold.unit} color={color} />
              {threshold.min != null && <Chip label="Min" value={threshold.min} unit={threshold.unit} color={T.textDim} />}
              {threshold.max != null && <Chip label="Max" value={threshold.max} unit={threshold.unit} color={T.textDim} />}
            </div>
          )}

          {expanded && impact && (
            <div style={{
              marginTop:    "10px",
              padding:      "10px 12px",
              background:   severityBg(severity),
              borderRadius: T.r4,
              color:        T.textBody,
              fontSize:     "13px",
              lineHeight:   1.6,
            }}>
              <span style={{ color, fontWeight: 600, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Impact &amp; Context
              </span>
              <p style={{ marginTop: "4px" }}>{impact}</p>
            </div>
          )}
        </div>
        <span style={{ color: T.textDim, fontSize: "16px", flexShrink: 0 }}>{expanded ? "▲" : "▼"}</span>
      </div>
    </div>
  );
}

function Chip({ label, value, unit, color }) {
  return (
    <span style={{ display: "flex", gap: "4px", alignItems: "center" }}>
      <span style={{ fontSize: "10px", color: T.textDim, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}:</span>
      <span style={{ fontFamily: T.fontMono, fontSize: "12px", color }}>
        {value}{unit ? ` ${unit}` : ""}
      </span>
    </span>
  );
}
