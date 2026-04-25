export const T = {
  // Surfaces
  bg:       "#0d1117",
  surface:  "rgba(255,255,255,0.03)",
  surface2: "rgba(255,255,255,0.06)",
  border:   "rgba(255,255,255,0.08)",
  border2:  "rgba(255,255,255,0.13)",

  // Text
  text:     "#e8eaf6",
  textBody: "#c9d1d9",
  textMute: "#8892a4",
  textDim:  "#5c6b88",

  // Accent
  teal:     "#00bfa5",
  tealDim:  "rgba(0,191,165,0.12)",

  // Severity
  critical:    "#ff1744",
  criticalDim: "rgba(255,23,68,0.12)",
  warning:     "#ff9100",
  warningDim:  "rgba(255,145,0,0.12)",
  info:        "#69f0ae",
  infoDim:     "rgba(105,240,174,0.10)",
  ok:          "#69f0ae",

  // Data colours
  blue:   "#448aff",
  purple: "#ab47bc",
  amber:  "#ffd600",
  coral:  "#ff6e40",

  // Type
  fontBody: "'Instrument Sans', system-ui, sans-serif",
  fontMono: "'JetBrains Mono', 'Fira Code', monospace",

  // Radii
  r4:  "4px",
  r6:  "6px",
  r8:  "8px",
  r12: "12px",
};

export const severityColor = (sev) => ({
  critical: T.critical,
  warning:  T.warning,
  info:     T.info,
  ok:       T.teal,
}[sev] || T.textMute);

export const severityBg = (sev) => ({
  critical: T.criticalDim,
  warning:  T.warningDim,
  info:     T.infoDim,
  ok:       T.tealDim,
}[sev] || "transparent");

export const priorityColor = (p) => ({
  critical: T.critical,
  high:     T.warning,
  medium:   T.amber,
  low:      T.textMute,
}[p] || T.textMute);
