import { T, severityColor, severityBg } from "../styles/theme.js";

export function KPICard({ label, value, unit, severity = "ok", sub }) {
  const color = severityColor(severity);

  return (
    <div style={{
      background:    T.surface,
      border:        `1px solid ${severity !== "ok" ? color + "44" : T.border}`,
      borderRadius:  T.r8,
      padding:       "12px 14px",
      display:       "flex",
      flexDirection: "column",
      gap:           "3px",
      minWidth:      0,
    }}>
      <span style={{ fontSize: "10px", color: T.textMute, textTransform: "uppercase", letterSpacing: "0.06em", lineHeight: 1.3 }}>
        {label}
      </span>
      <span style={{ fontFamily: T.fontMono, fontSize: "20px", fontWeight: 500, color, lineHeight: 1.1 }}>
        {value != null ? value : "—"}
        {unit && (
          <span style={{ fontSize: "11px", color: T.textMute, marginLeft: "3px", fontWeight: 400 }}>
            {unit}
          </span>
        )}
      </span>
      {sub && (
        <span style={{ fontSize: "10px", color: T.textDim, lineHeight: 1.3 }}>
          {sub}
        </span>
      )}
    </div>
  );
}
