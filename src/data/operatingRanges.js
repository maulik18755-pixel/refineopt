/**
 * Operating range thresholds for CDU process parameters.
 * Units match the source dataset (metric).
 * Each entry: { warn: [lo, hi], critical: [lo, hi], unit, label }
 * null bound means "no limit in that direction"
 */
export const RANGES = {
  // Furnace
  cot: {
    label: "Coil Outlet Temp",
    unit: "°C",
    warn:     [350, 358],
    critical: [345, 362],
  },
  passImbalance: {
    label: "Pass Temp Imbalance (σ)",
    unit: "°C",
    warn:     [null, 3.0],
    critical: [null, 5.0],
  },
  furnaceDuty: {
    label: "Furnace Duty",
    unit: "MW",
    warn:     [null, 68],
    critical: [null, 72],
  },
  energyIntensity: {
    label: "Energy Intensity",
    unit: "MW/(m³/hr)",
    warn:     [null, 0.095],
    critical: [null, 0.110],
  },

  // Column
  dpCol: {
    label: "Column ΔP",
    unit: "mbar",
    warn:     [null, 200],
    critical: [null, 230],
  },
  dpColSatPct: {
    label: "DP_COL Saturation Rate",
    unit: "%",
    warn:     [null, 5],
    critical: [null, 10],
  },
  refluxRatio: {
    label: "Reflux / Feed Ratio",
    unit: "—",
    warn:     [0.50, 0.70],
    critical: [0.45, 0.80],
  },

  // Feed
  feedRate: {
    label: "Crude Feed Rate",
    unit: "m³/hr",
    warn:     [500, 760],
    critical: [450, 800],
  },
  crudeAPI: {
    label: "Crude API Gravity",
    unit: "°API",
    warn:     [28, 42],
    critical: [22, 46],
  },

  // Lab / product quality
  keroYieldPct: {
    label: "Kerosene Yield",
    unit: "vol%",
    warn:     [16.0, null],
    critical: [15.5, null],
  },
  keroFlashPt: {
    label: "Kerosene Flash Point",
    unit: "°C",
    warn:     [40, null],
    critical: [38, null],
  },
  keroIBP: {
    label: "Kerosene IBP",
    unit: "°C",
    warn:     [130, 160],
    critical: [120, 170],
  },
  keroFBP: {
    label: "Kerosene FBP",
    unit: "°C",
    warn:     [258, 270],
    critical: [255, 275],
  },
  naphRONC: {
    label: "Naphtha RONC",
    unit: "",
    warn:     [70, null],
    critical: [68, null],
  },
  goCloudPt: {
    label: "Gas Oil Cloud Point",
    unit: "°C",
    warn:     [null, 7],
    critical: [null, 10],
  },

  // Availability
  availability: {
    label: "Plant Availability",
    unit: "%",
    warn:     [90, null],
    critical: [85, null],
  },
};

/**
 * Return severity for a value given a range config.
 * @returns {"ok" | "warning" | "critical"}
 */
export function getSeverity(key, value) {
  if (value == null || isNaN(value)) return "ok";
  const r = RANGES[key];
  if (!r) return "ok";

  const [critLo, critHi] = r.critical;
  const [warnLo, warnHi] = r.warn;

  if (
    (critLo != null && value < critLo) ||
    (critHi != null && value > critHi)
  ) return "critical";

  if (
    (warnLo != null && value < warnLo) ||
    (warnHi != null && value > warnHi)
  ) return "warning";

  return "ok";
}
