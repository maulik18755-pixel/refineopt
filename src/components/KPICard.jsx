import { T, severityColor, severityBg } from "../styles/theme.js";

export function KPICard({ label, value, unit, severity = "ok", sub }) {
  const color = severityColor(severity);
  const bg    = severityBg(severity);

  return (
    <div style={{
      background:   T.surface,
      border:       `1px solid ${severity !== "ok" ? color + "44" : T.border}`,
      borderRadius: T.r8,
      padding:      "14px 16px",
      display:      "flex",
      flexDirection:"column",
      gap:          "4px",
      minWidth:     0,
    }}>
      <span style={{ fontSize: "11px", color: T.textMute, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </span>
      <span style={{ fontFamily: T.fontMono, fontSize: "22px", fontWeight: 500, color, lineHeight: 1.1 }}>
        {value != null ? value : "—"}
        {unit && (
          <span style={{ fontSize: "13px", color: T.textMute, marginLeft: "4px", fontWeight: 400 }}>
            {unit}
          </span>
        )}
      </span>
      {sub && (
        <span style={{ fontSize: "11px", color: T.textDim }}>
          {sub}
        </span>
      )}
    </div>
  );
}
