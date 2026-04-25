import { T, severityColor, severityBg } from "../styles/theme.js";

export function SeverityBadge({ severity }) {
  const label = { critical: "Critical", warning: "Warning", info: "Info", ok: "OK" }[severity] || severity;
  return (
    <span style={{
      display:      "inline-block",
      padding:      "2px 8px",
      borderRadius: T.r4,
      fontSize:     "11px",
      fontWeight:   600,
      letterSpacing:"0.04em",
      textTransform:"uppercase",
      color:        severityColor(severity),
      background:   severityBg(severity),
      border:       `1px solid ${severityColor(severity)}44`,
      whiteSpace:   "nowrap",
    }}>
      {label}
    </span>
  );
}
